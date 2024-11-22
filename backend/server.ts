import express, { Request, Response, NextFunction } from 'express';
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
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
}));

app.use(express.json());

// MongoDB connection handler
let isConnecting = false;
const connectDB = async () => {
  try {
    if (isConnecting) {
      console.log('Connection already in progress');
      return;
    }

    if (mongoose.connection.readyState === 1) {
      console.log('Already connected to MongoDB');
      return;
    }

    isConnecting = true;
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    const options: mongoose.ConnectOptions = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 5
    };

    await mongoose.connect(MONGODB_URI, options);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  } finally {
    isConnecting = false;
  }
};

// Middleware to ensure database connection
const ensureDbConnected = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (error) {
    console.error('Database connection error in middleware:', error);
    res.status(503).json({
      error: 'Database connection unavailable',
      details: 'The server is currently unable to handle the request due to database connection issues'
    });
  }
};

// Health check route with enhanced database status
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Try to connect if not connected
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const dbState = mongoose.connection.readyState;
    const dbStates: { [key: number]: string } = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStates[dbState] || 'unknown',
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'unknown'
      },
      version: '1.0.0',
      allowedOrigins
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to check system health',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Apply database connection middleware to all expense routes
app.use('/api/expenses', ensureDbConnected);

// Expense routes with enhanced error handling
app.post('/api/expenses', async (req: Request, res: Response) => {
  try {
    // Validate required fields
    const { date, category, amount } = req.body;
    if (!date || !category || amount === undefined) {
      const missingFields = {
        date: !date,
        category: !category,
        amount: amount === undefined
      };
      
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: Object.entries(missingFields)
          .filter(([_, isMissing]) => isMissing)
          .map(([field]) => `${field} is required`)
      });
    }

    // Validate amount is a number and not negative
    if (typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        details: 'Amount must be a non-negative number'
      });
    }

    // Create and save the expense
    const expense = new Expense(req.body);
    const savedExpense = await expense.save();
    console.log('Expense created successfully:', savedExpense);
    res.status(201).json(savedExpense);
  } catch (error: any) {
    console.error('Error creating expense:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: Object.values(error.errors).map((err: any) => err.message)
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create expense',
      details: 'An unexpected error occurred while processing your request'
    });
  }
});

// Bulk expense creation
app.post('/api/expenses/bulk', async (req: Request, res: Response) => {
  try {
    const { expenses } = req.body;
    if (!Array.isArray(expenses)) {
      return res.status(400).json({ 
        error: 'Invalid request format',
        details: 'Expenses must be provided as an array'
      });
    }

    const createdExpenses = await Expense.insertMany(expenses);
    console.log(`Successfully created ${createdExpenses.length} expenses`);
    res.status(201).json(createdExpenses);
  } catch (error: any) {
    console.error('Error creating bulk expenses:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: Object.values(error.errors).map((err: any) => err.message)
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create bulk expenses',
      details: 'An unexpected error occurred while processing your request'
    });
  }
});

app.get('/api/expenses', async (_req: Request, res: Response) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ 
      error: 'Failed to fetch expenses',
      details: 'An unexpected error occurred while retrieving expenses'
    });
  }
});

// Monthly aggregation for reports
app.get('/api/expenses/monthly', async (_req: Request, res: Response) => {
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
    res.status(500).json({ 
      error: 'Failed to fetch monthly expenses',
      details: 'An unexpected error occurred while aggregating expenses'
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred while processing your request'
  });
});

// Export the Express API
export default app;
