# Guia de revisão e apresentação do TCC

## O que mudou no argumento

O projeto passou de “eventos em geral” para recepções de casamento em salões fechados. O intervalo de 30 a 150 convidados é um recorte de pesquisa proposto, não uma norma. A hipótese principal mede tempo limitado de conclusão. Clareza, pendências e retrabalho permanecem como resultados exploratórios com definições próprias.

A comparação foi ajustada para montagem manual no mesmo editor versus montagem assistida por IA. Isso ajuda a investigar a assistência da IA sem atribuir a ela vantagens da própria interface. Se a banca exigir comparação com briefing tradicional, o protocolo precisará incluir esse comparador e discutir os fatores adicionais.

O capítulo técnico foi alinhado ao código: React/Konva, Express/Prisma/PostgreSQL, duas etapas especializadas de modelo de linguagem e validação geométrica. Foram retiradas alegações de embeddings, otimização global e redução “drástica” não demonstradas.

## Como explicar a prévia

O cliente conclui a planta, revisa os elementos e solicita uma imagem horizontal. O modelo recebe a planta PNG e os dados dos objetos. A imagem serve para discutir ambientação; contagens e posições devem ser conferidas com a planta. Ela é avaliada separadamente do tempo de construção do layout.

## Relação com cada feedback

| Feedback | Resposta concreta |
| --- | --- |
| Escolher nicho | Recepções de casamento, salão fechado, catálogo delimitado |
| Considerar especialistas | Papéis de briefing e layout com entradas e saídas separadas |
| Referências na introdução | Leng et al., Feng et al., NIST e documentação oficial |
| Rever H2 | Uma H1; clareza e revisões como indicadores exploratórios |
| Metodologia detalhada | Piloto, 24 participantes propostos, quatro sequências, critérios e análise |
| Custos práticos | Tokens, imagens, infraestrutura, esforço e contingência |

## Pontos para fechar com o orientador

- O DOCX anexado deixa o orientador em branco. Preencha o nome confirmado e confira o ano de entrega: a revisão usa 2026, enquanto o modelo traz maio de 2025.
- Confirme a aceitação do nicho e a viabilidade dos 24 participantes e dos avaliadores. O tamanho é proposta de viabilidade, não cálculo de poder.
- Vincule as 12 semanas às datas da disciplina e ajuste o protocolo antes do piloto.
- O referencial articula cinco estudos: Tell2Design, LayoutGPT, Holodeck, LayoutPrompter e AutoGen, além de NIST e documentação técnica. Leia os trabalhos completos antes da defesa e confira os critérios de atualidade e classificação exigidos pela instituição; não foi atribuída classificação Qualis sem verificação.
- Confira o manual institucional para capa, numeração, sumário e referências. A versão entregue tem paginação física para facilitar a revisão e sumário com páginas conferidas. Depois de editar, atualize o sumário e a paginação.
- Verifique o procedimento institucional para participação de pessoas e defina consentimento e prazo de guarda dos registros.
- Reconheça o apoio de IA conforme as regras da instituição e revise o texto para que cada afirmação represente algo que você compreende e consegue defender.

## Verificação prática antes de demonstrar

Instale o projeto, configure um banco local, cadastre dois usuários e confirme que um não acessa o layout do outro. Teste salvar, recarregar, desfazer/refazer, IA textual e imagem com sua própria chave. Confira consumo e falhas. Execute o piloto com cenário diferente dos experimentais. Não apresente testes simulados como resultados reais do provedor ou dos participantes.

## Roteiro de explicação em cinco minutos

1. Problema delimitado e público de uso.
2. Planta 2D como registro editável dos requisitos espaciais.
3. Etapas especializadas de IA e verificações em código.
4. Prévia horizontal e diferença entre ilustração e planta.
5. H1, comparação, critérios de conclusão, custos e limitações.
