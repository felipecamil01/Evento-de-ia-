# Verificação realizada em 6 de outubro de 2026

| Procedimento | Resultado |
| --- | --- |
| `npm test` no backend | 26 testes aprovados |
| `npm run research:verify` | 67 testes aprovados: 30 relativos a H1, 30 a H2 e 7 gerais |
| `npm run benchmark` | 20/20 casos concordantes |
| `npm run build` no frontend | Aprovado; aviso de pacote principal maior que 500 kB |
| Prisma Client | Gerado com sucesso |
| Integração com PostgreSQL real | Não executada nesta revisão |
| Coleta de H1/H2 com modelo real | Pendente; chave Gemini ausente no ambiente |

Os testes de IA usam respostas simuladas. Os 60 testes associados às hipóteses verificam corpus e protocolo, não confirmam H1/H2. A coleta principal executará 30 cenários por hipótese, três repetições e até 450 chamadas reais. Consulte [PROTOCOLO](PROTOCOLO.md).

Registros de saída dos comandos estão em `docs/validation/`. Os relatórios geométricos com data anterior são históricos; a reexecução desta revisão está em `backend/reports/2026-10-06T18-23-08-568Z/`.
