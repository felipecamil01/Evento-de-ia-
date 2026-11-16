# Auditoria do fluxo Gemini e roteiro de teste do EventIA

## Resultado da auditoria de chamadas

Encontrei uma amplificação possível de solicitações no código, não um problema com as aspas da chave:

- Uma ação de geração faz duas chamadas sequenciais: uma para estruturar o briefing e outra para gerar os elementos do layout.
- A configuração anterior permitia até três tentativas do modelo principal e tentava os modelos alternativos após falhas transitórias. Com três modelos configurados, o caminho de recuperação podia chegar a cinco chamadas por etapa (até dez por clique em certos cenários).
- O assistente visual já apresentava o estado `loading`, mas faltava uma trava síncrona e uma proteção correspondente no endpoint do servidor contra duas solicitações simultâneas.
- A geração de imagem é um fluxo separado, só iniciado quando a pessoa clica em **Gerar prévia com IA**. Não é chamada automaticamente durante a geração do layout.
- A função antiga `generateAILayout` em `layoutController.ts` não está registrada nas rotas atuais; o assistente usa `POST /api/briefing/process`.

## O que foi alterado nesta entrega

- O algoritmo limita cada etapa de texto a no máximo **três chamadas ao provedor**, mesmo que haja mais modelos listados em `GEMINI_TEXT_FALLBACK_MODELS`.
- O padrão passa a ser `GEMINI_MAX_RETRIES=1`; com fallbacks, reserva uma tentativa para o próximo modelo quando o principal falha transitoriamente.
- O frontend usa uma trava síncrona com `useRef` para ignorar cliques/envios repetidos enquanto a geração está em andamento.
- O backend permite somente uma geração ativa por usuário e limita as gerações de texto simultâneas por processo (`AI_MAX_CONCURRENT_GENERATIONS=2`). Requisições concorrentes recebem `409` ou `429` com `Retry-After` em vez de iniciar outra geração.
- Foram adicionados testes para confirmar o limite de três chamadas e o bloqueio de uma segunda solicitação concorrente.
- Testes automatizados executados nesta revisão: **30 aprovados, 0 falhas**. A verificação TypeScript do frontend passou; a etapa Vite do build não pôde ser executada neste Linux porque as dependências carregadas do ZIP original não possuem `@rollup/rollup-linux-x64-gnu`. O script fornecido reinstala as dependências nativamente no Windows antes de compilar.

## O erro 503 e as cotas

O `503 Service Unavailable` recebido aponta para indisponibilidade temporária do provedor. O código pode amplificar o número de tentativas, mas não é possível afirmar que isso causou aquele `503`. A documentação do Gemini diz que limites são aplicados por projeto, e não individualmente por chave, e recomenda espera exponencial para erros transitórios como `429` e `503`.

O bloqueio de concorrência atual é em memória e protege uma única instância Node.js. Caso você publique o sistema com várias instâncias/servidores, será necessário trocar esse controle por Redis ou uma fila compartilhada para manter o limite global.

## Atenção às credenciais

O ZIP original enviado para análise contém um `backend/.env` preenchido, incluindo `GEMINI_API_KEY` e outras configurações sensíveis. Os arquivos `.env` não estão incluídos na entrega corrigida. Como medida preventiva, revogue e crie outra chave Gemini, e troque os segredos de autenticação/credenciais de banco se o ZIP original tiver sido compartilhado, publicado ou enviado a terceiros. Não copie a chave para o frontend, nem para variáveis `VITE_*`.

## Configuração e testes no Windows

Pré-requisitos: Node.js 20+, PostgreSQL local ou Docker Desktop e uma chave Gemini válida.

Na raiz do projeto:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Preencha `GEMINI_API_KEY`, `JWT_SECRET` e `DATABASE_URL` em `backend/.env`. A variável `GEMINI_API_KEY` pode ser escrita sem aspas, por exemplo `GEMINI_API_KEY=cole_sua_chave`; o formato com aspas também é aceito pelo `dotenv`.

Se usar o banco do Compose:

```powershell
docker compose up -d db
```

Prepare o banco na primeira instalação:

```powershell
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm test
```

Em outro terminal:

```powershell
cd frontend
npm ci
npm run build
```

Alternativamente, execute `TESTAR_EVENTIA.bat` na raiz para reinstalar as dependências, rodar os testes e compilar o frontend.

Para executar localmente, inicie `npm run dev` dentro de `backend` e `frontend`, cada um em seu terminal. Abra o endereço informado pelo Vite e confira `http://localhost:3001/api/health`. Esse endpoint informa se o backend está ativo e se a variável da chave foi definida, mas não testa a validade da chave nem a disponibilidade externa do Gemini.

O conjunto automatizado usa respostas simuladas para testar o tratamento de falhas; ele não precisa de uma chave real e não prova que a API do Google esteja disponível no momento. Para testar a geração real, crie um evento, abra o editor e envie um briefing uma vez. Evite gerar repetidamente enquanto a API estiver indisponível.
