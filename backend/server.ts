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

// MongoDB connection with enhanced retry logic
const connectDB = async (retryCount = 0) => {
  const MONGODB_URI = process.env.MONGODB_URI;
  const MAX_RETRIES = 5;
  
  if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  try {
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
      minPoolSize: 5,
      keepAlive: true,
      keepAliveInitialDelay: 300000
    };

    await mongoose.connect(MONGODB_URI, options);
    console.log('Connected to MongoDB successfully');
    
    // Reset retry count on successful connection
    if (retryCount > 0) {
      console.log(`Successfully reconnected after ${retryCount} retries`);
    }
  } catch (err) {
    console.error(`MongoDB connection error (attempt ${retryCount + 1}/${MAX_RETRIES}):`, err);
    
    if (retryCount < MAX_RETRIES) {
      // Exponential backoff: wait longer between each retry
      const waitTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
      console.log(`Retrying connection in ${waitTime}ms...`);
      setTimeout(() => connectDB(retryCount + 1), waitTime);
    } else {
      console.error('Max retry attempts reached. Could not connect to MongoDB');
      process.exit(1);
    }
  }
};

// Initial database connection
connectDB();

// Monitor database connection
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  connectDB();
});

// Health check route with enhanced database status
app.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStates[dbState as keyof typeof dbStates],
      host: mongoose.connection.host,
      name: mongoose.connection.name
    },
    version: '1.0.0',
    allowedOrigins
  });
});

// Expense routes with enhanced error handling
app.post('/api/expenses', async (req, res) => {
  try {
    // Check database connection first
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected when attempting to create expense');
      return res.status(503).json({ 
        error: 'Database connection unavailable',
        details: 'The server is currently unable to handle the request due to database connection issues'
      });
    }

    // Validate required fields
    const { date, category, amount } = req.body;
    if (!date || !category || amount === undefined) {
      const missingFields = {
        date: !date,
        category: !category,
        amount: amount === undefined
      };
      
      console.error('Validation error - missing fields:', missingFields);
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
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: Object.values(error.errors).map((err: any) => err.message)
      });
    }
    
    // Handle other types of errors
    res.status(500).json({ 
      error: 'Failed to create expense',
      details: 'An unexpected error occurred while processing your request'
    });
  }
});

// Bulk expense creation
app.post('/api/expenses/bulk', async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database connection unavailable',
        details: 'The server is currently unable to handle the request due to database connection issues'
      });
    }

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

app.get('/api/expenses', async (_req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database connection unavailable',
        details: 'The server is currently unable to handle the request due to database connection issues'
      });
    }

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
app.get('/api/expenses/monthly', async (_req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database connection unavailable',
        details: 'The server is currently unable to handle the request due to database connection issues'
      });
    }

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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log('Allowed origins:', allowedOrigins);
});
