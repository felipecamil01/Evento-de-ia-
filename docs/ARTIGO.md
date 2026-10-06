# GERAÇÃO E REVISÃO DE LAYOUTS 2D DE RECEPÇÕES DE CASAMENTO COM INTELIGÊNCIA ARTIFICIAL

Felipe Jacinto Camilo; Douglas Lopes; Ruminiki Pavei Schmoeller.

## RESUMO

Introdução. A conversão de briefings em layouts exige interpretar quantidades e relações espaciais, além de controlar inconsistências geométricas. Objetivo. Desenvolver o EventIA e investigar os efeitos da geração em duas etapas e da revisão com diagnóstico automático no atendimento a requisitos de recepções de casamento. Metodologia. Pesquisa aplicada, quantitativa e experimental computacional, com 30 cenários sintéticos, três repetições por cenário e duas comparações pareadas: geração direta versus geração em duas etapas; revisão genérica versus revisão orientada por diagnóstico. Um avaliador independente verifica critérios previamente definidos. Resultados. A verificação local aprovou 26 testes do sistema, 67 testes do protocolo e 20 casos de regressão geométrica. A coleta com o modelo de linguagem permanece pendente, sem resultados empíricos para confirmar as hipóteses. Conclusão. O protótipo e a infraestrutura de avaliação foram implementados e verificados nos casos examinados. Sua eficácia na geração e revisão de layouts deverá ser estabelecida pela coleta comparativa, com registro de falhas, regressões e consumo, sem extrapolação para desempenho humano ou segurança física.

Palavras-chave: inteligência artificial; layouts bidimensionais; avaliação computacional; verificação de restrições; engenharia de software.

## 1. INTRODUÇÃO

A elaboração de uma proposta de distribuição espacial transforma solicitações textuais em objetos, dimensões e posições. Em recepções de casamento, pedidos sobre mesas, pista de dança, buffet e entrada podem combinar quantidades com relações como “à esquerda” e “acima”. Uma representação visual plausível pode contrariar essas solicitações ou apresentar colisões. O problema técnico deste trabalho é produzir uma planta editável e verificar requisitos explícitos, mantendo rastreabilidade entre entrada, processamento e resultado.

Modelos de linguagem vêm sendo investigados como intermediários entre descrições e representações espaciais. LayoutGPT explora o planejamento visual a partir de texto (FENG et al., 2023), enquanto Tell2Design estuda plantas condicionadas por linguagem natural (LENG et al., 2023). Essas contribuições fundamentam a abordagem, mas não estabelecem desempenho para o recorte de recepções de casamento nem demonstram que uma revisão automática sempre corrige erros. A investigação proposta examina separadamente a estratégia de geração e a informação utilizada na revisão.

O EventIA delimita o domínio a salões retangulares fechados, catálogo fixo de objetos e eventos fictícios com 30 a 150 convidados. Essa faixa é uma decisão de escopo, não uma norma de lotação. O editor utiliza pixels; não realiza projeto executivo, cálculo de capacidade, verificação de acessibilidade ou certificação de segurança. A imagem de ambientação é ilustrativa e não integra as duas hipóteses avaliadas.

A contribuição pretendida é um protocolo reproduzível que permita verificar quando a decomposição do processamento e o diagnóstico computacional favorecem o atendimento aos requisitos. O estudo não coleta opiniões, ações ou dados pessoais de participantes. Assim, suas medidas não permitem afirmar satisfação, economia de tempo humano ou melhoria da experiência profissional.

A questão norteadora é: nos cenários sintéticos delimitados, quais são os efeitos da geração em duas etapas e da revisão orientada por diagnósticos sobre a qualidade verificável dos layouts? O objetivo geral é desenvolver e avaliar computacionalmente uma abordagem de geração e revisão de layouts 2D que combine modelos de linguagem e verificação de restrições, mensurando atendimento a requisitos, violações e consumo de recursos.

## 2. ESTADO DA ARTE / TRABALHOS RELACIONADOS

Feng et al. (2023) apresentam o LayoutGPT, no qual modelos de linguagem geram representações espaciais intermediárias a partir de condições textuais. O trabalho demonstra a relevância de examinar quantidades e relações espaciais, além da aparência final. O EventIA adota uma representação estruturada de objetos, mas utiliza catálogo, condições e avaliador próprios; portanto, não compara diretamente suas taxas com as publicadas no LayoutGPT.

Leng et al. (2023) apresentam o Tell2Design, com plantas e instruções em linguagem natural. Sua distinção entre geração artística e projetos sujeitos a restrições reforça a necessidade de critérios verificáveis. O presente estudo reduz o domínio a objetos de recepções de casamento em plantas simplificadas, sem reutilizar a base como se representasse eventos reais.

Lin et al. (2023), no LayoutPrompter, investigam serialização, seleção de exemplos e ordenação de propostas para geração de layouts. O EventIA também utiliza um contrato explícito de entrada e saída, mas o protocolo não seleciona a melhor entre várias propostas: todas as respostas das condições experimentais são contabilizadas. Essa diferença evita que a seleção esconda falhas do gerador.

Yang et al. (2023) apresentam o Holodeck, voltado à geração de ambientes tridimensionais orientada por linguagem. O estudo amplia o contexto do planejamento espacial por IA. Neste trabalho, a avaliação permanece bidimensional e se concentra na consistência de objetos e relações; a imagem ilustrativa não funciona como prova de preservação geométrica.

Madaan et al. (2023) propõem o Self-Refine, com realimentação e refinamento iterativos produzidos pelo modelo. Esse trabalho motiva a investigação de uma segunda oportunidade de resposta. Entretanto, uma comparação entre “sem revisão” e “com revisão diagnosticada” confundiria o efeito do diagnóstico com o da chamada adicional. Por isso, H2 utiliza uma revisão em cada condição e mantém a mesma proposta inicial.

Huang et al. (2024) discutem limitações da autocorreção de raciocínio sem realimentação externa. Esse resultado não prova que diagnósticos geométricos melhorarão o EventIA, mas sustenta a necessidade de medir erros corrigidos e introduzidos. A revisão pode degradar uma saída inicialmente correta. O protocolo inclui essas situações e utiliza avaliação computacional independente da autodeclaração do modelo.

A lacuna operacional abordada é a comparação controlada desses componentes em um benchmark sintético de recepções de casamento. Trata-se de uma contribuição delimitada e verificável, cuja relevância dependerá dos resultados e da reprodução, sem reivindicação antecipada de superioridade sobre o estado da arte.

## 3. MATERIAIS E MÉTODOS

### 3.1 Delineamento e objetivos específicos

A pesquisa é aplicada quanto à natureza, exploratória e comparativa quanto aos objetivos, quantitativa quanto à abordagem e experimental computacional quanto aos procedimentos. Os objetos observados são respostas do software a cenários sintéticos. A execução dos comandos pelo pesquisador constitui operação do instrumento, sem avaliação de seu desempenho pessoal.

Os objetivos específicos são delimitar o catálogo e os requisitos; implementar geração direta, geração em duas etapas e duas modalidades de revisão; construir um corpus versionado com testemunhas de viabilidade; verificar um avaliador independente; comparar sucesso integral e fração de critérios violados; e registrar falhas, regressões, duração e consumo. Nesta versão, o desenvolvimento e a verificação offline estão concluídos nos casos descritos, enquanto a coleta comparativa com o provedor permanece pendente.

### 3.2 Duas hipóteses

H1 — Nos 30 cenários sintéticos, a geração em duas etapas, com interpretação do briefing seguida de planejamento espacial, apresenta maior sucesso integral médio do que a geração direta pelo mesmo modelo. Seja S a variável binária de sucesso. O efeito é Δ1 = média por cenário de [S(B) − S(A)], após agregar as três repetições. A hipótese nula é Δ1 ≤ 0; a alternativa é Δ1 > 0.

H2 — Partindo das mesmas propostas produzidas por B, uma revisão com diagnóstico automático apresenta menor fração média de critérios violados do que uma revisão genérica, com uma chamada adicional por condição. Seja L a fração de violações. O efeito é Δ2 = média por cenário de [L(C) − L(D)]. A hipótese nula é Δ2 ≤ 0; a alternativa é Δ2 > 0. Efeitos positivos favorecem a abordagem investigada em ambas as comparações.

QUADRO 1: Condições experimentais.

| Condição | Procedimento | Chamadas por repetição |
| --- | --- | --- |
| A | Briefing original → layout direto | 1 |
| B | Briefing → extração → layout | Até 2 |
| C | Revisão genérica da resposta B | 1 adicional |
| D | Revisão da mesma B com diagnóstico | 1 adicional |

Fonte: Elaborado pelo autor (2026).

A condição B recebe o briefing original, o contexto e a extração estruturada. A e B compartilham o contrato espacial. C e D recebem o mesmo briefing, contexto e representação da resposta B. Somente D recebe a lista de problemas do diagnosticador. Ambas usam o mesmo texto de instrução de revisão, modelo, temperatura e limite de saída. Os ramos são independentes: D não recebe a revisão produzida por C.

### 3.3 Protótipo e instrumentos

O MVP utiliza React e Konva no editor, Node.js e TypeScript no servidor, Express nas rotas, Prisma no acesso ao PostgreSQL e Zod na validação dos dados. A geração textual utiliza a API Gemini, com modelo selecionado por configuração. O módulo de prompts e chamadas é compartilhado pelo aplicativo e pelo executor experimental, reduzindo divergências entre o sistema descrito e o avaliado.

O diagnóstico operacional verifica formato dos elementos, identificadores, preservação de objetos, limites e colisões. A geometria do MVP considera retângulos rotacionados. A interface oferece revisão automática opcional, limitada a uma chamada: uma revisão somente substitui a proposta inicial se apresentar estrutura válida e nenhum problema nos diagnósticos implementados. Isso não garante atendimento semântico ao briefing. O experimento avalia todas as respostas C/D diretamente, sem essa seleção protetiva.

A coleta é feita por um programa independente da interface e do banco. São armazenados o manifesto da execução, hashes do código e corpus, commit, parâmetros, respostas textuais, motivos de falha, duração, metadados de consumo e versão do modelo quando retornada. O analisador exporta resultados por cenário em CSV e resumo em JSON. Não há pontuação atribuída por outro modelo de linguagem.

### 3.4 Corpus e unidade de análise

O corpus contém 30 cenários sintéticos distintos, definidos antes da coleta principal: dez enfatizam quantidades, dez acrescentam relações entre centros de objetos e dez acrescentam preservação de identificadores e tipos de uma planta existente. Variam contagens, formatos de mesa, dimensões do canvas e direção de relações espaciais. Sua construção é intencional e paramétrica, sem pretensão de representar probabilisticamente todos os casamentos.

Incluem-se cenários completos, compatíveis com o catálogo, com rotação zero, quantidades explícitas e uma planta testemunha que satisfaz os critérios. Excluem-se dados de clientes, plantas reais identificáveis, requisitos subjetivos, cenários inviáveis e exigências normativas não implementadas. A ausência de cadeiras individuais não é interpretada como falha de lotação, pois o corpus não avalia capacidade física.

As testemunhas verificam a viabilidade e não são fornecidas como respostas esperadas ao modelo. Nos dez cenários de preservação, os objetos existentes integram legitimamente o contexto entregue às duas estratégias. Essa particularidade é relatada porque pode facilitar esses casos. Os testes de software usam testemunhas e mutações artificiais; seus acertos não integram a medida de qualidade da IA.

Os mesmos 30 cenários são usados nas duas hipóteses, com três repetições por cenário. Há 90 pares A/B e 90 pares C/D, mas a unidade de análise continua sendo o cenário, com n = 30 em cada comparação. O desenho produz 360 respostas finais e até 450 chamadas, contando as extrações de B. Repetições não são novas amostras independentes e o compartilhamento do corpus não transforma o estudo em 60 cenários distintos.

### 3.5 Métricas e regras de execução

O avaliador final tem implementação própria, sem importar o validador geométrico de produção. Para retângulos sem rotação, verifica contrato de saída, ids únicos, dimensões e camadas do catálogo, limites, colisões, doze contagens por tipo, relações quando aplicáveis e preservação. O sucesso integral exige todos os critérios satisfeitos. A perda corresponde ao número de critérios violados dividido pelo total fixado para aquele cenário.

Resposta estruturalmente inválida, falha de transporte ou truncamento recebe sucesso zero e perda um. A remoção de um objeto obrigatório reprova sua contagem e eventuais relações dependentes. Os critérios têm pesos iguais; múltiplas colisões reprovam um único predicado de ausência de sobreposição. Essa medida é operacional e não representa uma escala validada de gravidade. As violações por categoria são preservadas para interpretação.

A configuração principal fixa temperatura 0,2, limite de saída de 8192 tokens por chamada, tempo limite de 60 segundos e três repetições. Uma ordem pseudoaleatória com semente 20261006 intercala cenários e condições. O modelo deve ser escolhido e registrado antes da coleta, mantendo-se a configuração em todos os ramos. Não existem retentativas automáticas, seleção da melhor resposta ou descarte de falhas do provedor.

Falha da extração interrompe a geração B e é contabilizada; C e D ainda recebem a mesma representação dessa falha e podem tentar produzir uma proposta. Saídas iniciais válidas também são revisadas, permitindo medir regressões. Uma coleta interrompida permanece arquivada e não é apresentada como completa. O executor não sobrescreve pastas, e o analisador recusa registros simulados, incompletos, duplicados ou incompatíveis com o código da coleta.

### 3.6 Análise e tamanho do benchmark

As três repetições são agregadas por cenário antes do cálculo das diferenças pareadas. O analisador utiliza bootstrap estratificado por cenário, com 10000 reamostragens de pares completos dentro dos três grupos. Serão apresentados efeitos e intervalos percentis aproximados de 97,5% para cada hipótese. Esse nível individual foi escolhido em referência ao ajuste de Bonferroni para duas comparações; a cobertura do bootstrap permanece aproximada, sobretudo em dados discretos e amostras pequenas.

O valor de 30 cenários é uma escolha de viabilidade, não uma garantia de estabilização. A lei dos grandes números descreve convergência sob condições apropriadas quando a amostra cresce; o teorema central do limite trata da distribuição de estatísticas e não determina que os resultados parem de mudar após 30 observações. Tamanho amostral, precisão e magnitude de efeito devem ser considerados conjuntamente (NIST/SEMATECH, s.d.). Não foi realizado cálculo de poder que assegure detectar um efeito específico.

Um ganho de 0,10, equivalente a dez pontos percentuais, constitui o limiar prático proposto antes da coleta. A interpretação considerará magnitude, intervalo, resultados por estrato, falhas e custos. Intervalos degenerados serão sinalizados, sem inferência de incerteza nula fora do corpus. A seleção intencional e as semelhanças entre cenários limitam a generalização. Os intervalos serão tratados como descrição exploratória da sensibilidade do benchmark à reamostragem.

Como medidas secundárias, serão examinados critérios antes satisfeitos por B e violados após C/D, duração das chamadas, tokens e ausência de metadados. H1 compara estratégias com orçamentos diferentes de chamadas e não isola completamente decomposição de maior inferência. H2 controla a oportunidade de revisão, mas o diagnóstico aumenta a entrada de D. A análise qualitativa dos erros será documental, baseada nos registros do programa, sem entrevistas ou julgamentos de participantes.

### 3.7 Delimitação ética

O protocolo foi reformulado para utilizar exclusivamente briefings, salões e objetos fictícios, sem recrutamento, questionários, entrevistas, dados pessoais ou registros de clientes. A Lei nº 14.874/2024 e sua regulamentação tratam da pesquisa com seres humanos (BRASIL, 2024; 2025). O enquadramento institucional deve considerar o protocolo concreto; este artigo não declara aprovação ou dispensa formal de comitê. Uma futura inclusão de participantes ou de seus dados demandará reavaliação do desenho e dos procedimentos aplicáveis.

## 4. RESULTADOS E DISCUSSÃO

### 4.1 Implementação e verificação concluídas

Em 6 de outubro de 2026, foram compilados o backend e o frontend e executadas as verificações locais apresentadas na Tabela 1. A suíte do sistema inclui geometria, esquema, controle de proprietário, contrato simulado de imagem e comportamento da nova revisão textual. A suíte do protocolo inclui 30 verificações associadas a H1, 30 associadas a H2 e sete verificações gerais do executor, avaliação e isolamento de condições.

TABELA 1: Evidências efetivamente obtidas nesta revisão.

| Verificação | Resultado | Alcance |
| --- | --- | --- |
| Testes do sistema | 26 de 26 aprovados | Comportamentos automatizados com dependências simuladas |
| Testes do protocolo | 67 de 67 aprovados | Corpus, avaliador e controles experimentais |
| Regressão geométrica | 20 de 20 concordantes | Casos conhecidos do validador |
| Compilações | Backend e frontend aprovados | Construção dos artefatos de software |
| Coleta real de H1 e H2 | Não executada nesta revisão | Efeitos e intervalos ainda indisponíveis |

Fonte: Registros de execução local do projeto (2026).

As testemunhas dos 30 cenários foram aceitas pelo avaliador independente e pelo diagnóstico geométrico. Mutações conhecidas, como ausência de buffet, posição fora do salão, ids duplicados e alteração de dimensão, foram rejeitadas nos testes correspondentes. Os ramos C/D preservaram o mesmo ponto de partida, e a condição C não recebeu o campo de diagnóstico. Esses resultados sustentam o funcionamento dos controles examinados, sem provar completude dos validadores.

A compilação do frontend apresentou aviso de tamanho do pacote principal. Esse aviso não impediu a construção, mas indica oportunidade de otimização de carregamento. O PostgreSQL e as integrações externas reais não foram exercitados nesta revisão. Não havia chave Gemini configurada no ambiente de execução; por isso, nenhuma resposta real foi utilizada para estimar Δ1 ou Δ2.

### 4.2 Discussão e limites das evidências

A separação entre proposta estruturada e verificação aproxima o protótipo da linha de planejamento visual discutida por Feng et al. (2023) e Leng et al. (2023). Entretanto, aprovar testes de software não equivale a reproduzir o desempenho desses estudos. O resultado disponível é a implementação de um instrumento de comparação; a eficácia do modelo continua como questão empírica.

A comparação C/D torna operacional a distinção entre oportunidade de refinar e acesso a informação externa, motivada por Madaan et al. (2023) e Huang et al. (2024). O registro de violações introduzidas permite identificar revisões prejudiciais. Contudo, o diagnóstico não contém todas as regras semânticas do avaliador; erros de quantidade ou de relação podem persistir mesmo quando a geometria é aprovada.

Há riscos de viés decorrentes da autoria do corpus, da simplicidade das plantas e da familiaridade do desenvolvedor com seus critérios. O congelamento anterior à coleta impede ajustes oportunistas após observar resultados, mas não elimina essas limitações. A ausência de rotação no benchmark também restringe o alcance experimental, embora o editor permita rotações. Sem escala métrica, obstáculos reais e análise de circulação, o estudo não sustenta uso como projeto físico certificado.

Para concluir a avaliação, deverão ser coletadas as respostas reais e apresentados Δ1, Δ2, seus intervalos, resultados por cenário e custos. Resultados nulos, desfavoráveis ou inconclusivos integrarão a discussão. Não se atribuirá confirmação das hipóteses aos 30 testes offline de cada comparação, pois eles utilizam respostas conhecidas e simuladas.

## 5. CONSIDERAÇÕES FINAIS

O EventIA foi reformulado como protótipo de geração e revisão de layouts 2D com avaliação exclusivamente computacional. Foram implementadas duas estratégias de geração, dois ramos de revisão, um corpus de 30 cenários e um avaliador independente. As verificações locais aprovaram 26 testes do sistema, 67 do protocolo e 20 casos de regressão geométrica, estabelecendo evidência limitada aos comportamentos examinados.

O objetivo de desenvolvimento foi atendido no nível de protótipo, e o objetivo de avaliação encontra-se parcialmente concluído. H1 e H2 permanecem sem confirmação ou rejeição empírica, pois a coleta real ainda não foi executada. A contribuição disponível é a infraestrutura reproduzível para investigar esses efeitos, com distinção entre sucesso do software e qualidade das respostas da IA.

Como continuidade, a pesquisa deverá executar o protocolo congelado, analisar falhas e regressões e incorporar os resultados ao artigo. Ampliação independente do corpus, outras versões de modelo, escala física e restrições de circulação constituem extensões futuras. Estudos de experiência humana exigem outra metodologia. O alcance das conclusões será definido pelas evidências, sem promessas de estabilização a partir de 30 cenários ou de melhoria universal da abordagem.

## 6. REFERÊNCIAS

BRASIL. Lei nº 14.874, de 28 de maio de 2024. Dispõe sobre a pesquisa com seres humanos e institui o Sistema Nacional de Ética em Pesquisa com Seres Humanos. Brasília, DF, 2024. Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14874.htm. Acesso em: 6 out. 2026.

BRASIL. Decreto nº 12.651, de 7 de outubro de 2025. Regulamenta a Lei nº 14.874, de 28 de maio de 2024. Brasília, DF, 2025. Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12651.htm. Acesso em: 6 out. 2026.

FENG, Weixi et al. LayoutGPT: Compositional Visual Planning and Generation with Large Language Models. arXiv, 2023. DOI: 10.48550/arXiv.2305.15393. Disponível em: https://arxiv.org/abs/2305.15393. Acesso em: 6 out. 2026.

HUANG, Jie et al. Large Language Models Cannot Self-Correct Reasoning Yet. arXiv, versão 2, 2024. DOI: 10.48550/arXiv.2310.01798. Disponível em: https://arxiv.org/abs/2310.01798v2. Acesso em: 6 out. 2026.

LENG, Sicong et al. Tell2Design: A Dataset for Language-Guided Floor Plan Generation. arXiv, 2023. DOI: 10.48550/arXiv.2311.15941. Disponível em: https://arxiv.org/abs/2311.15941. Acesso em: 6 out. 2026.

LIN, Jiawei et al. LayoutPrompter: Awaken the Design Ability of Large Language Models. arXiv, 2023. DOI: 10.48550/arXiv.2311.06495. Disponível em: https://arxiv.org/abs/2311.06495. Acesso em: 6 out. 2026.

MADAAN, Aman et al. Self-Refine: Iterative Refinement with Self-Feedback. arXiv, 2023. DOI: 10.48550/arXiv.2303.17651. Disponível em: https://arxiv.org/abs/2303.17651. Acesso em: 6 out. 2026.

NIST/SEMATECH. e-Handbook of Statistical Methods. Seção 7.2.2.2, Sample sizes required. [S. l.], [s. d.]. Disponível em: https://www.itl.nist.gov/div898/handbook/prc/section2/prc222.htm. Acesso em: 6 out. 2026.

YANG, Yue et al. Holodeck: Language Guided Generation of 3D Embodied AI Environments. arXiv, 2023. DOI: 10.48550/arXiv.2312.09067. Disponível em: https://arxiv.org/abs/2312.09067. Acesso em: 6 out. 2026.
