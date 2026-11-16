# EventIA

Protótipo de TCC para planejar recepções de casamento em salões fechados, com 30 a 150 convidados. O fluxo combina briefing, proposta de layout pela IA, edição 2D, verificação geométrica e prévia horizontal de ambientação.

## Comece aqui

Para corrigir e testar a integração Gemini no Windows, siga também [`CORRECOES_IA.md`](CORRECOES_IA.md) ou execute `TESTAR_EVENTIA.bat`.

1. Instale Node.js 20 ou superior e tenha um PostgreSQL disponível.
2. Extraia este projeto em uma nova pasta. As dependências e os arquivos `.env` não estão incluídos.
3. Em `backend`, copie `.env.example` para `.env` e preencha `DATABASE_URL`, `JWT_SECRET` e `GEMINI_API_KEY`.
4. Não coloque a chave Gemini em variáveis `VITE_`: elas ficam acessíveis no navegador.
5. Execute o backend e o frontend nos terminais abaixo.

### Backend

```sh
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

O servidor atende em `http://localhost:3001`. Crie o banco indicado em `DATABASE_URL` antes de aplicar as migrações. Use banco de desenvolvimento para a primeira execução. Em um projeto existente, faça backup antes de aplicar migrações. Não é necessário executar o seed: cadastre sua conta pela interface.

### Frontend em outro terminal

```sh
cd frontend
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`. Caso o backend esteja em outro endereço, copie `frontend/.env.example` para `.env` e ajuste `VITE_API_URL`.

### Compilação e testes

```sh
cd backend
npm test
```

```sh
cd frontend
npm run build
```

Os testes automatizados verificam geometria, rotação, esquema dos dados, controle de proprietário, contrato da API de imagens e resiliência da integração Gemini. O provedor externo e o banco são simulados nesses testes; eles não atestam integração com uma conta real ou PostgreSQL em produção. Execute `TESTAR_EVENTIA.bat` no Windows para instalar as dependências, rodar a suíte e compilar o frontend.

## Como usar a prévia horizontal

1. Cadastre um casamento com 30 a 150 convidados e abra o editor.
2. Arraste os elementos ou descreva o briefing no assistente. O número de convidados cadastrado é a referência da IA.
3. Revise a proposta, corrija conflitos e clique em **Salvar**. O salvamento é manual.
4. Clique em **Validar** para conferir as regras geométricas implementadas.
5. Abra **Prévia do evento** e escolha estilo e iluminação.
6. Clique em **Gerar prévia com IA**. O servidor envia a planta PNG e as coordenadas para o modelo de imagem, solicitando formato 16:9 e resolução de referência 1K.
7. Compare o resultado com a planta e use **Baixar imagem** antes de fechar a janela. A imagem não é salva no banco e o fechamento da janela descarta a prévia local.

A geração de imagens depende de acesso ao modelo e cota na sua conta e pode ter custo. A configuração padrão utiliza `gemini-3.1-flash-image` para imagens e `gemini-3.6-flash` para texto, com `gemini-3.8-flash` como fallback. Se o Gemini retornar cota Free Tier igual a zero, ative o faturamento ou um plano com cota para imagens no projeto vinculado à chave; trocar o nome do modelo não remove esse limite. O assistente agora informa esse motivo e não bloqueia uma nova tentativa quando o provedor rejeita a geração. O backend lê `GEMINI_TEXT_MODEL`, faz tentativas limitadas com espera progressiva e pode recorrer aos modelos indicados em `GEMINI_TEXT_FALLBACK_MODELS`. Cada etapa de texto fica limitada a três chamadas ao provedor, mesmo que sejam configurados vários fallbacks; uma geração normal segue usando duas chamadas sequenciais. O servidor permite apenas uma geração de texto ativa por usuário e limita a duas gerações de texto simultâneas por processo (`AI_MAX_CONCURRENT_GENERATIONS`). Esses bloqueios são locais ao processo, adequados a uma demonstração de instância única; para múltiplas instâncias, use fila/limite compartilhado. Após uma imagem bem-sucedida, uma nova geração fica disponível em dois minutos.

Se a API estiver ausente, o sistema informa que é necessário configurá-la. Ele não substitui a resposta por um layout simulado. Em caso de indisponibilidade temporária, o backend tenta os modelos de fallback e apresenta uma mensagem que permite tentar de novo; se todos estiverem indisponíveis, confira o status do provedor, o modelo e a chave no servidor. O endpoint `GET /api/health` ajuda a conferir se o backend está ativo e se a chave está configurada, sem validar remotamente a chave. O tempo máximo da chamada de imagem é de 110 segundos; a interface aguarda até 120 segundos.

## Arquitetura da IA

- Especialista em briefing: resume o pedido, extrai requisitos e identifica pendências.
- Especialista em layout: propõe a lista completa de objetos, posições e camadas.
- Validador em código: verifica limites e conflitos, inclusive rotação de retângulos.
- Gerador visual: recebe uma imagem da planta completa, geometria, estilo e luz.

As duas primeiras etapas são chamadas sequenciais ao modelo com instruções distintas. Não há treinamento de modelo, fine-tuning, embeddings ou banco vetorial. Os registros de briefing guardam modelo, versão do prompt, duração e metadados de consumo retornados pelo provedor.

## Principais alterações

- Recorte de novos eventos para recepções de casamento.
- Tela de prévia com planta, opções de estilo e iluminação, mensagens de progresso e download.
- Saídas da IA verificadas por Zod; remoção da resposta simulada sem coordenadas.
- Correção do modo Melhorar, que antes ignorava mudanças em objetos do mesmo tipo.
- Proteção contra substituição de uma edição feita enquanto a IA estava processando.
- Autorização por proprietário nas rotas de layout e briefing.
- Proteção síncrona no botão de gerar, bloqueio de solicitações concorrentes por usuário e limite de chamadas do Gemini por etapa.
- Substituição dos elementos em transação; edição invalida a validação anterior.
- Validação de retângulos rotacionados e bloqueio da entrada e da pista.
- Ajuste do canvas à área disponível, correção do Delete durante digitação e erros de TypeScript.
- Salvamento explícito para evitar concorrência do salvamento automático anterior.

## Limites conhecidos

Este é um protótipo acadêmico. A imagem pode alterar objetos ou posições e não é uma garantia visual da montagem real. A validação geométrica é parcial e não certifica capacidade, acessibilidade ou segurança. O editor usa pixels; as medidas em metros informadas no assistente ainda não constituem uma escala física persistente. Círculos são verificados por caixas delimitadoras. As imagens não têm histórico persistente. Não há controle completo de concorrência entre abas, nem endurecimento de segurança suficiente para lançamento público.

Os testes acadêmicos com participantes ainda devem ser executados. O TCC descreve uma proposta de avaliação e não contém resultados experimentais inventados. Os campos de medição do estudo serão preenchidos pelo pesquisador conforme os apêndices.

## Documentação externa

- [Geração de imagens Gemini](https://ai.google.dev/gemini-api/docs/image-generation)
- [Preços Gemini](https://ai.google.dev/gemini-api/docs/pricing)

Veja `GUIA_TCC.md` para relacionar as alterações aos feedbacks da apresentação e preparar a conversa com o orientador.

## Nova entrega para execução e avaliação técnica

Leia `PLANEJAMENTO.md` para instalação detalhada, roteiro de aceitação, cronograma e alternativas de avaliação acadêmica. Na raiz, `docker compose up -d db` disponibiliza opcionalmente um banco de desenvolvimento em localhost; o Compose ainda deve ser verificado no ambiente do autor.

No backend, `npm run benchmark` executa 20 casos sintéticos do validador sem chave de API e grava CSV/JSON em `reports/`. São casos de regressão, não experimentos com usuários nem avaliação da IA. A suíte atual inclui testes de retentativa e fallback da IA, além de rejeição de rotação não finita. Consulte a saída de `npm test` para a contagem exata de testes.
