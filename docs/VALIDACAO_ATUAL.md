# Verificação atual do EventIA

- Backend: compilação TypeScript aprovada; 30 testes automatizados aprovados.
- Teste de resiliência: a lógica de uma etapa de texto não ultrapassa três chamadas ao provedor, mesmo com vários fallbacks configurados.
- Teste de concorrência: uma segunda solicitação simultânea do mesmo usuário é rejeitada sem iniciar outra chamada à IA.
- Frontend: verificação TypeScript (`tsc -b`) aprovada.
- Build Vite: não concluído neste ambiente Linux porque as dependências originalmente incluídas no ZIP não contêm o pacote opcional de Rollup para Linux. A entrega não inclui `node_modules`; o script `TESTAR_EVENTIA.bat` reinstala as dependências no Windows antes de compilar.
- API Gemini real, chave paga, PostgreSQL e Docker Compose não foram testados nesta revisão. Os testes da API usam mocks e não consomem quota.
- O controle de concorrência é em memória, válido para uma instância local do Node.js. Para múltiplas instâncias, é necessário um mecanismo compartilhado.
- O benchmark geométrico offline não representa uma avaliação da qualidade da IA, experiência humana ou segurança física.
