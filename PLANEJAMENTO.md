# Planejamento de implementação e avaliação do EventIA

O pacote entregue contém o código completo revisado. O próximo passo é executar a aplicação localmente, verificar banco e provedor reais e definir com o orientador qual desenho de avaliação será usado no TCC. Este documento distingue melhorias implementadas, testes executados e atividades ainda pendentes.

## 1. O que está implementado

- Nicho de recepções de casamento em salões fechados, entre 30 e 150 convidados.
- Duas etapas especializadas de IA: interpretação do briefing e proposta espacial, com validação das respostas.
- Editor 2D com camadas, salvamento manual e proteção contra sobrescrever alterações feitas durante uma chamada de IA.
- Verificação de limites, rotações, sobreposições e obstrução de entrada e pista.
- Autorização por proprietário e gravação transacional dos elementos.
- Janela de prévia horizontal com planta de referência, estilo, iluminação e download; integração ao provedor no servidor.
- Testes automatizados e avaliação offline de 20 cenários geométricos, com exportação CSV/JSON e identificação do código e corpus por hash.
- Configuração opcional de PostgreSQL local via Docker Compose.

A revisão não treinou um modelo nem criou agentes autônomos. Imagens são ilustrativas e não ficam armazenadas no banco. As medidas do editor são pixels; não há certificação de acessibilidade, lotação ou segurança do evento.

## 2. Instalar e testar

Extraia o ZIP em uma pasta nova. Use Node.js 20 ou superior e npm. Não execute os comandos na pasta de um banco de produção. Não há senhas pessoais nem chaves de API no pacote.

### Banco local

Se já possui PostgreSQL, crie um banco chamado eventia e ajuste DATABASE_URL. Como alternativa, com Docker e Compose instalados, execute na raiz do projeto:

```sh
docker compose up -d db
docker compose ps
```

O Compose usa localhost:5432, banco eventia e credenciais postgres/postgres exclusivamente para desenvolvimento. Se a porta já estiver ocupada, use seu PostgreSQL existente ou altere a porta e DATABASE_URL. `docker compose stop` interrompe o banco preservando dados. Não use opções de remoção de volumes se quiser preservar seus cadastros. O Compose foi fornecido para instalação; não foi executado neste ambiente.

### Backend, primeiro terminal

Copie backend/.env.example para backend/.env pelo gerenciador de arquivos e configure DATABASE_URL. Gere JWT_SECRET com o comando abaixo e copie o resultado para o arquivo:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Preencha GEMINI_API_KEY quando for testar a IA real. Nunca use uma variável VITE_ para guardar essa chave.

```sh
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

Backend esperado: http://localhost:3001. Não precisa executar seed; crie a conta na interface. Sem chave de IA, o editor manual pode ser testado com o banco funcionando; a IA mostrará erro de configuração.

### Frontend, segundo terminal

```sh
cd frontend
npm ci
npm run dev
```

Abra a URL informada, normalmente http://localhost:5173. frontend/.env.example permite alterar VITE_API_URL caso necessário.

### Testes sem chave ou banco real

Após instalar as dependências e gerar o cliente Prisma, execute em backend:

```sh
npm test
npm run benchmark
```

O benchmark cria uma pasta datada em backend/reports, com benchmark.csv e benchmark.json. Cada caso contém resultado esperado, observado, concordância, duração e conflitos. Os 20 casos são cenários de regressão conhecidos, não um conjunto independente de avaliação da IA. A duração mede apenas a chamada local ao validador e não representa tempo de planejamento humano. Repetições não criam novos casos independentes.

Em frontend:

```sh
npm run build
```

## 3. Roteiro de aceitação local

| Passo | Ação | Critério |
| --- | --- | --- |
| 1 | Cadastrar conta fictícia e criar recepção de 60 convidados | Editor abre sem erro |
| 2 | Adicionar entrada, mesas e pista; salvar e recarregar | Elementos e posições persistem |
| 3 | Sobrepor mesa à pista e validar | Conflito é informado |
| 4 | Corrigir o conflito e validar novamente | Planta atende às regras implementadas |
| 5 | Solicitar sugestão textual com chave válida | Retorno estruturado ou erro explícito; sem resposta falsa de sucesso |
| 6 | Alterar a planta enquanto aguarda a IA | Edição recente não é substituída silenciosamente |
| 7 | Abrir prévia, escolher estilo e iluminação, gerar | Imagem horizontal ou mensagem clara de falha |
| 8 | Baixar a imagem e comparar com a planta | Arquivo abre; diferenças de quantidade e posição são registradas |
| 9 | Entrar com outra conta fictícia e tentar acessar o ID do primeiro layout | Acesso recusado |

Use eventos e contas fictícios para desenvolvimento. Registre versão do modelo, erros, duração e custo real. Não compartilhe os arquivos .env em apresentações ou repositórios.

## 4. Sequência de trabalho sugerida

As semanas são estimativas e devem ser ajustadas ao prazo da disciplina. Prazos de análise ética não estão incluídos nesta previsão.

| Etapa | Atividade | Saída necessária |
| --- | --- | --- |
| Semana 1 | Instalar, testar cadastro, banco, salvamento e autorização | Registro de testes locais e correções |
| Semana 2 | Verificar IA textual e imagem com API real | Exemplos fictícios, falhas e consumo registrado |
| Semana 3 | Definir com orientador o desenho de pesquisa e encaminhamento ético | Protocolo e escopo de conclusões definidos |
| Semana 4 | Congelar corpus técnico e critérios; executar avaliação permitida | Dados brutos, versão do código e resultados |
| Semana 5 | Analisar falhas e redigir resultados e discussão | Tabelas reais, limitações e comparação com literatura |
| Semana 6 | Revisão acadêmica e ensaio da demonstração | PDF atualizado, código e evidências arquivadas |

Prioridades futuras: escala métrica persistente, obstáculos do salão, histórico de imagens e redução do pacote frontend após medir carregamento. Essas funcionalidades não são apresentadas como prontas.

## 5. Plano A com participantes

Manter a comparação manual versus assistência de IA e a H1 sobre tempo limitado. O protocolo anterior prevê 24 adultos e piloto separado, com tarefas equivalentes, ordem contrabalançada e indicadores de conclusão e atendimento a requisitos. Esse tamanho é uma proposta de viabilidade, não garantia de poder estatístico.

Antes de recrutamento ou coleta, encaminhar o protocolo conforme orientação institucional e obter a aprovação aplicável. Se houver pendências, responder aos pontos indicados; se houver reprovação, discutir revisão ou recurso pelos canais institucionais. Não iniciar o mesmo estudo sob outro nome para evitar análise. Um teste com amigos, questionários anônimos ou avaliações de especialistas não constitui dispensa automática.

A Lei nº 14.874/2024 inclui participação direta e indireta e manejo de dados na definição de pesquisa com seres humanos. A página oficial da Resolução CNS nº 510/2016 descreve seu âmbito em Ciências Humanas e Sociais com dados de participantes e informações identificáveis. Esses textos orientam a discussão, mas não determinam sozinhos o enquadramento específico deste TCC. Solicitar orientação formal à instituição/CEP para o protocolo concreto e suas regras vigentes.

Fontes consultadas em 21/09/2026:
- [Lei nº 14.874/2024, especialmente art. 2º](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14874.htm).
- [Resolução CNS nº 510/2016, página oficial](https://www.gov.br/conselho-nacional-de-saude/pt-br/atos-normativos/resolucoes/2016/resolucao-no-510.pdf/view).

## 6. Plano B com avaliação exclusivamente computacional

Se a pesquisa com pessoas não for viável no prazo, propor uma mudança real de escopo: avaliar o software em casos sintéticos, sem recrutamento, entrevistas, questionários, observação de usuários ou dados de clientes. Confirmar o enquadramento com a instituição. O desenho proposto não é um certificado de dispensa ética.

Pergunta sugerida: em cenários sintéticos de recepções de casamento, em que medida o protótipo produz representações estruturadas e identifica conflitos segundo critérios previamente definidos?

Objetivo sugerido: desenvolver e avaliar tecnicamente um protótipo de planejamento de layouts, mensurando validade dos retornos, atendimento de restrições, falhas, latência e consumo de recursos em um corpus sintético.

Retirar a H1 de redução do tempo humano e as alegações de clareza/satisfação. Usar perguntas de avaliação técnica, sem exigir uma hipótese causal. Não converter latência da API em economia de tempo para clientes.

### Etapa B1 já executável

Usar `npm run benchmark` para o validador. O corpus inclui plantas válidas, entrada ausente, objetos fora do salão, sobreposição, rotação e medidas inválidas. Os resultados demonstram concordância nos casos conhecidos; não demonstram generalização ou qualidade da IA. Não somar seus 20 casos aos testes automatizados como se fossem evidências independentes, pois há cobertura sobreposta.

### Etapa B2 a preparar e executar com API real

1. Redigir 20 briefings totalmente fictícios: 12 para desenvolvimento e oito reservados. O arquivo de 20 layouts do benchmark não substitui esses briefings.
2. Fixar requisitos esperados e regras verificáveis antes de executar os oito reservados. Guardar o corpus com data e hash.
3. Executar os oito briefings três vezes, totalizando 24 respostas por configuração. Registrar falhas e não ajustar prompts usando os casos reservados após o início.
4. Medir validade do JSON, quantidades e relações requeridas, conflitos geométricos, latência e consumo retornado pelo provedor. API falha permanece no denominador das tentativas. Separar casos inviáveis ou ambíguos por critérios previamente definidos.
5. Arquivar entradas, saídas e configuração. Apresentar frequências e valores por caso; as três repetições do mesmo briefing não são três casos independentes.
6. Para avaliar o ganho das duas etapas, um estudo adicional pode comparar uma chamada única e o fluxo especializado no mesmo corpus, com modelo e orçamento documentados. Esse comparador ainda não está implementado.
7. A prévia horizontal pode permanecer como demonstração técnica. Não afirmar fidelidade com base em imagens bonitas. Uma avaliação de imagem precisa de critérios próprios; se forem coletadas opiniões de terceiros, reavaliar o enquadramento ético antes da coleta.

B2 não foi executada e não possui resultados no pacote. É uma avaliação complementar necessária para sustentar afirmações sobre a IA; B1 sozinha testa apenas parte do software.

### Como alterar o TCC se o plano B for escolhido

| Seção | Alteração |
| --- | --- |
| Resumo e introdução | Foco em desenvolvimento e avaliação computacional; retirar promessa de economia de tempo humano |
| Materiais e métodos | Corpus sintético, critérios, versões, repetições, ferramentas e análise; retirar recrutamento e questionários |
| Resultados e discussão | Resultados reais do benchmark e, quando executada, da API; distinguir regressão e casos reservados |
| Considerações finais | Limitar conclusões ao desempenho técnico observado; experiência do cliente como trabalho futuro |
| Ética | Descrever o enquadramento confirmado pela instituição; nunca declarar aprovação ou dispensa inexistente |

O PDF entregue anteriormente mantém o protocolo com participantes como etapa futura. Ele não foi silenciosamente convertido para o plano B; se essa opção for adotada, as seções acima precisam ser alinhadas antes da entrega final.

## 7. Evidências e limites da entrega

A compilação e os testes são verificações de desenvolvimento. Banco PostgreSQL real, Docker Compose e chamadas pagas de IA ainda precisam ser verificados no seu computador. O aviso de bundle frontend acima de 500 kB não bloqueia o build. Os relatórios offline incluídos foram produzidos pela execução do código e não contêm resultados de pessoas nem de IA real.
