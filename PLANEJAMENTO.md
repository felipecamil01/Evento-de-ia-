# Execução e avaliação do EventIA

1. Instalar backend/frontend conforme o [README](README.md), configurar PostgreSQL e testar cadastro, salvamento e recarregamento local.
2. Executar as verificações automatizadas descritas em [VALIDACAO_ATUAL](docs/VALIDACAO_ATUAL.md).
3. Para a pesquisa, seguir [PROTOCOLO](docs/PROTOCOLO.md): dois experimentos pareados, 30 cenários por hipótese e três repetições.
4. Configurar modelo e chave Gemini em `backend/.env`, verificar a conta com dados de desenvolvimento diferentes do corpus principal e registrar a configuração escolhida.
5. Congelar prompts, corpus e código em um commit antes da primeira coleta principal. Não ajustar o sistema a partir dos resultados reservados e reavaliar como se fosse a primeira rodada.
6. Executar a coleta completa, preservar todas as falhas e registros, analisar e substituir no artigo a indicação de resultados pendentes pelos dados efetivamente obtidos.

A avaliação usa somente cenários sintéticos, sem participantes ou dados pessoais. Os antigos planos de comparação com usuários não integram esta versão. A aplicação web e a geração de imagens precisam de validação integrada com banco e provedor reais; compilar e testar com simulações não substitui essa etapa.
