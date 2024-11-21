import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { config } from 'dotenv';
import Expense from './models/Expense';

config();

const app = express();

// Get allowed origins from environment variable or use default
const allowedOrigins = [
  'http://localhost:3000',
  'https://dentalyst-tracker.vercel.app',
  'https://dentalyst-expense.vercel.app',
  'https://dentalyst-expense.vercel.app/'
];

// Configure CORS with specific origins
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
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
    version: '1.0.0',
    allowedOrigins
  });
});

// Expense routes
app.post('/api/expenses', async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(400).json({ error: 'Failed to create expense' });
  }
});

// Bulk expense creation
app.post('/api/expenses/bulk', async (req, res) => {
  try {
    const { expenses } = req.body;
    if (!Array.isArray(expenses)) {
      return res.status(400).json({ error: 'Expenses must be an array' });
    }

    const createdExpenses = await Expense.insertMany(expenses);
    res.status(201).json(createdExpenses);
  } catch (error) {
    console.error('Error creating bulk expenses:', error);
    res.status(400).json({ error: 'Failed to create bulk expenses' });
  }
});

app.get('/api/expenses', async (_req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Monthly aggregation for reports
app.get('/api/expenses/monthly', async (_req, res) => {
  try {
    const monthlyExpenses = await Expense.aggregate([
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            year: { $year: '$date' },
            category: '$category'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);
    res.json(monthlyExpenses);
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    res.status(500).json({ error: 'Failed to fetch monthly expenses' });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something broke!',
    message: err.message
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log('Allowed origins:', allowedOrigins);
});
