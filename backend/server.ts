import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { config } from 'dotenv';

config();

const app = express();

// Configure CORS before any routes
app.use(cors({
  origin: '*', // In production, you should specify your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dentalyst:admin@dentalyst.lkkq3.mongodb.net/?retryWrites=true&w=majority&appName=dentalyst';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Health check route
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: '1.0.0'
  });
});

// Your existing routes here...

const PORT = process.env.PORT || 5001; // Changed to port 5001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});
