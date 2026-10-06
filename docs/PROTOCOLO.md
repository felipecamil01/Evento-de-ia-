# Protocolo computacional EventIA v1

**Estado em 6 de outubro de 2026:** implementação e verificação offline concluídas. Nenhuma coleta real das hipóteses foi realizada nesta revisão, pois não havia chave Gemini no ambiente. Testes com respostas simuladas não são evidência de qualidade de um modelo.

## Duas hipóteses e 30 cenários por hipótese

- **H1:** a geração em duas etapas B (extração + layout) aumenta o sucesso integral em relação à geração direta A. Efeito = média por cenário de sucesso(B) − sucesso(A).
- **H2:** uma revisão com diagnóstico D reduz a fração de critérios violados em relação à revisão genérica C. Efeito = média por cenário de perda(C) − perda(D). C e D partem exatamente da mesma saída B, em chamadas independentes, uma por condição.

O corpus contém **30 cenários sintéticos distintos**, reaproveitados nas duas hipóteses: 10 de quantidades, 10 de relações espaciais e 10 de preservação de objetos. Cada cenário tem 3 repetições: 90 pares A/B e 90 pares C/D. A unidade de análise continua sendo o cenário, portanto n=30 em cada hipótese. Não são 60 cenários independentes nem n=90 por hipótese.

São 360 respostas finais e **até 450 chamadas**: A=90, B=180 (duas por repetição), C=90 e D=90. A extração inválida interrompe B e conta como falha; a revisão C/D ainda é aplicada. Não há retentativa automática, seleção da melhor resposta ou exclusão por falha. Revise cota e custo da conta antes da coleta. `--repetitions 1` serve apenas para piloto operacional; o analisador principal exige 3.

30 não é um limiar de estabilização. A lei dos grandes números é assintótica, e o teorema central do limite não garante resultados imutáveis ou normalidade exata com 30 observações. A seleção do corpus é intencional e paramétrica, não uma amostra probabilística de casamentos reais. Os intervalos são exploratórios e condicionados ao benchmark.

## Executar

No diretório `backend`, com Node 20+:

```sh
npm ci
npx prisma generate
npm test
npm run research:verify
npm run benchmark
```

Os testes científicos não precisam do PostgreSQL nem da interface. Configure **somente no servidor/local**, em `backend/.env`, `GEMINI_API_KEY` e `GEMINI_TEXT_MODEL`. Escolha um modelo de texto disponível na sua conta e mantenha a mesma versão em todas as condições. Nunca publique a chave ou a coloque no frontend.

```sh
npm run research:run -- --live --repetitions 3 --out research/runs/coleta-01
npm run research:analyze -- research/runs/coleta-01
```

O executor grava `manifest.json` e `records.jsonl`; a análise gera `summary.json` e `scenario-means.csv`. A pasta não pode existir, para evitar sobrescrita. Respostas são gravadas após cada condição. Interrupções mantêm a coleta parcial, que não será analisada como completa. Não há retomada automática: documente a interrupção, preserve a pasta e faça uma coleta nova completa. Publique também a existência das coletas interrompidas; não escolha a rodada mais favorável. Os arquivos de execução são ignorados pelo Git até revisão deliberada dos dados e inclusão pelo pesquisador.

## Congelamento e avaliação

O corpus está em `backend/research/corpus.json`. `make-corpus.cjs` documenta sua construção; não o altere depois de começar a coleta principal. As testemunhas de viabilidade são usadas pelos testes offline e **não são enviadas ao modelo**. Nos dez casos de preservação, a planta inicial faz parte legítima do pedido e é fornecida às duas estratégias.

Os prompts e o provedor são os mesmos no MVP e no executor (`pipeline.cjs`). O diagnóstico usa esquema, ids, preservação e geometria de produção. O avaliador final (`oracle.cjs`) tem implementação própria para retângulos sem rotação e acrescenta contagens, dimensões, camadas e relações explícitas. Ele não usa a autodeclaração do modelo nem a função geométrica de produção.

O sucesso exige todos os critérios. A perda é a fração de critérios violados, com denominador fixo para cada cenário: contrato, ids únicos, catálogo, limites, ausência de colisões, doze contagens, relações quando aplicáveis e preservação. Contrato inválido, falha de transporte ou truncamento recebe sucesso 0 e perda 1. Critérios não se confundem com número de objetos: uma colisão e várias colisões reprovam o mesmo predicado. Essa ponderação é uma escolha operacional, não uma escala validada de gravidade.

C/D recebem a mesma representação da resposta B, filtrada por uma lista de campos permitidos. Somente D recebe o diagnóstico. Uma resposta B que não possa ser interpretada como JSON é representada pelo mesmo marcador de falha nos dois ramos. Todas as respostas finais C/D são avaliadas, inclusive revisões ruins; o executor não aplica a seleção protetiva da interface.

Temperatura 0,2; limite de saída 8192 tokens por chamada; tempo limite 60 s; três repetições; ordem pseudoaleatória fixada pela semente 20261006. O manifesto registra hashes do código/corpus, commit, runtime e parâmetros. Preserve o checkout usado na coleta. O analisador recusa versões diferentes do código.

## Análise previamente definida

Calcular as diferenças pareadas após agregar as três repetições de cada cenário. Reamostrar pares completos dentro dos três estratos, 10000 vezes, com semente registrada. Apresentar efeitos e intervalos percentis aproximados de 97,5% para cada hipótese; o nível individual foi escolhido em referência ao ajuste de Bonferroni para duas comparações. O bootstrap não garante cobertura exata em amostra pequena e discreta. Um intervalo degenerado deve ser sinalizado e não equivale a ausência de incerteza fora do corpus.

Efeito favorável tem sinal positivo. Ganho de 0,10 (dez pontos percentuais) é o limiar prático proposto antes da coleta, não derivado de um cálculo de poder. Interpretar intervalo, magnitude, diferenças por cenário e custos em conjunto, sem prometer confirmação das hipóteses. Registrar perdas introduzidas por C/D em critérios antes satisfeitos por B, falhas, latência, tokens e ausência de metadados. Versões de modelo divergentes exigem discussão explícita; não misturar silenciosamente rodadas de modelos diferentes.

H1 compara estratégias com diferentes orçamentos de chamadas, portanto não isola o efeito da decomposição do efeito do maior orçamento. H2 controla o número de revisões e o limite de saída, mas D consome entrada adicional para o diagnóstico. O modelo não recebe o avaliador final nem sua resposta esperada.

## Escopo e situação ética

Dados exclusivamente fictícios, sem recrutamento, entrevistas, questionários, logs de clientes ou medidas de desempenho humano. O pesquisador executa o software, não atua como participante avaliado. O enquadramento institucional deve refletir esse protocolo concreto; o repositório não declara aprovação ou dispensa formal de comitê de ética. A inclusão futura de pessoas ou dados pessoais exige reavaliar o desenho e seus procedimentos.

Este estudo não mede satisfação, produtividade humana, estética percebida ou segurança física. O editor usa pixels e caixas delimitadoras; não verifica rotas de fuga, lotação, acessibilidade ou distâncias normativas. A imagem de ambientação fica fora das duas hipóteses.
