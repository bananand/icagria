import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'ok',
    db: isConnected ? 'connected' : 'disconnected',
    dbName: isConnected ? mongoose.connection.name : null,
  });
});

// Mount API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`,
  });
});

// Central error handler
app.use(errorHandler);

export default app;
