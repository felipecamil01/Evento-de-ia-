import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import layoutRoutes from './routes/layoutRoutes';
import briefingRoutes from './routes/briefingRoutes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({limit:'8mb'}));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/layouts', layoutRoutes);
app.use('/api/briefing', briefingRoutes);

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
