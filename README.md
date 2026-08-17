# EventIA

Sistema de planejamento de layouts de eventos com Inteligência Artificial.

## Instalação e Execução

### 1. Banco de dados
Certifique-se de ter o PostgreSQL rodando localmente ou altere a URL em \`backend/.env\`.

### 2. Backend
- cd backend
- npm install
- npx prisma migrate dev --name init
- npm run db:seed
- npm run build

O backend estará rodando em \`http://localhost:3001\`

### 3. Frontend
- cd frontend
- npm install
- npm run build

## Tecnologias

- **Backend:** Node.js, Express, Prisma, PostgreSQL
- **Frontend:** React, Vite, Konva.js, TailwindCSS, Zustand
