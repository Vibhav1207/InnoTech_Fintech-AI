import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './db/connect';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'backend',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
