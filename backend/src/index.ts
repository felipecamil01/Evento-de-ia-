import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import layoutRoutes from './routes/layoutRoutes';
import briefingRoutes from './routes/briefingRoutes';
import dns from 'node:dns';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({limit:'8mb'}));

// Endpoint simples para verificar se o backend e a configuração básica da IA estão ativos.
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'eventia-backend',
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    textModel: process.env.GEMINI_TEXT_MODEL || 'gemini-3.6-flash',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/layouts', layoutRoutes);
app.use('/api/briefing', briefingRoutes);

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  dns.setDefaultResultOrder('ipv4first');
});
