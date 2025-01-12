import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { config } from 'dotenv';
import Expense from './models/Expense';
import Consultant from './models/Consultant';

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

// Apply database connection middleware to all API routes
app.use('/api', ensureDbConnected);

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

// Delete single expense
app.delete('/api/expenses/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid expense ID',
        details: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    const deletedExpense = await Expense.findByIdAndDelete(id);
    
    if (!deletedExpense) {
      return res.status(404).json({
        error: 'Expense not found',
        details: 'No expense found with the provided ID'
      });
    }

    res.json({ message: 'Expense deleted successfully', expense: deletedExpense });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      error: 'Failed to delete expense',
      details: 'An unexpected error occurred while deleting the expense'
    });
  }
});

// Bulk delete expenses
app.delete('/api/expenses', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        details: 'Expense IDs must be provided as a non-empty array'
      });
    }

    // Validate all IDs
    if (!ids.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({
        error: 'Invalid expense ID',
        details: 'One or more IDs are not valid MongoDB ObjectIds'
      });
    }

    const result = await Expense.deleteMany({ _id: { $in: ids } });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'No expenses found',
        details: 'No expenses were found with the provided IDs'
      });
    }

    res.json({ 
      message: 'Expenses deleted successfully', 
      count: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting expenses:', error);
    res.status(500).json({
      error: 'Failed to delete expenses',
      details: 'An unexpected error occurred while deleting expenses'
    });
  }
});

// Monthly aggregation for reports
app.get('/api/expenses/monthly', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'Both startDate and endDate are required'
      });
    }

    const expenses = await Expense.find({
      date: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      }
    }).sort({ date: 1 });

    // Group expenses by category only
    const groupedExpenses = expenses.reduce((acc: any[], expense) => {
      const existingGroup = acc.find(group => group._id.category === expense.category);
      
      if (existingGroup) {
        existingGroup.total += expense.amount;
        existingGroup.entries.push({
          _id: expense._id,
          date: expense.date,
          amount: expense.amount,
          consultantName: expense.category === 'Consultants' ? expense.consultantName : undefined
        });
        // Sort entries by date (newest first)
        existingGroup.entries.sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      } else {
        acc.push({
          _id: {
            category: expense.category
          },
          total: expense.amount,
          entries: [{
            _id: expense._id,
            date: expense.date,
            amount: expense.amount,
            consultantName: expense.category === 'Consultants' ? expense.consultantName : undefined
          }]
        });
      }
      
      return acc;
    }, []);

    // Sort groups by category name
    const sortedExpenses = groupedExpenses.sort((a, b) => 
      a._id.category.localeCompare(b._id.category)
    );

    res.json(sortedExpenses);
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    res.status(500).json({ 
      error: 'Failed to fetch monthly expenses',
      details: 'An unexpected error occurred while aggregating expenses'
    });
  }
});

// Consultant routes
app.get('/api/consultants', async (_req: Request, res: Response) => {
  try {
    const consultants = await Consultant.find().sort({ name: 1 });
    res.json(consultants);
  } catch (error) {
    console.error('Error fetching consultants:', error);
    res.status(500).json({ 
      error: 'Failed to fetch consultants',
      details: 'An unexpected error occurred while retrieving consultants'
    });
  }
});

app.post('/api/consultants', async (req: Request, res: Response) => {
  try {
    const { name, specialization } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: ['Name is required']
      });
    }

    const existingConsultant = await Consultant.findOne({ name });
    if (existingConsultant) {
      return res.status(400).json({
        error: 'Duplicate consultant',
        details: ['A consultant with this name already exists']
      });
    }

    const consultant = new Consultant({ name, specialization });
    const savedConsultant = await consultant.save();
    res.status(201).json(savedConsultant);
  } catch (error) {
    console.error('Error creating consultant:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body
    });
    res.status(500).json({ 
      error: 'Failed to create consultant',
      details: error instanceof Error ? error.message : 'An unexpected error occurred while creating the consultant'
    });
  }
});

app.put('/api/consultants/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, specialization, active } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid consultant ID',
        details: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    if (name) {
      const existingConsultant = await Consultant.findOne({ 
        name, 
        _id: { $ne: id } 
      });
      if (existingConsultant) {
        return res.status(400).json({
          error: 'Duplicate consultant',
          details: ['A consultant with this name already exists']
        });
      }
    }

    const consultant = await Consultant.findByIdAndUpdate(
      id,
      { name, specialization, active },
      { new: true, runValidators: true }
    );

    if (!consultant) {
      return res.status(404).json({
        error: 'Consultant not found',
        details: 'No consultant found with the provided ID'
      });
    }

    res.json(consultant);
  } catch (error) {
    console.error('Error updating consultant:', error);
    res.status(500).json({
      error: 'Failed to update consultant',
      details: 'An unexpected error occurred while updating the consultant'
    });
  }
});

app.delete('/api/consultants/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid consultant ID',
        details: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    // Check if consultant has any expenses
    const hasExpenses = await Expense.exists({ 
      category: 'Consultants',
      consultantName: (await Consultant.findById(id))?.name 
    });

    if (hasExpenses) {
      // Instead of deleting, mark as inactive
      const consultant = await Consultant.findByIdAndUpdate(
        id,
        { active: false },
        { new: true }
      );

      if (!consultant) {
        return res.status(404).json({
          error: 'Consultant not found',
          details: 'No consultant found with the provided ID'
        });
      }

      return res.json({ 
        message: 'Consultant marked as inactive',
        consultant
      });
    }

    const consultant = await Consultant.findByIdAndDelete(id);
    
    if (!consultant) {
      return res.status(404).json({
        error: 'Consultant not found',
        details: 'No consultant found with the provided ID'
      });
    }

    res.json({ 
      message: 'Consultant deleted successfully',
      consultant
    });
  } catch (error) {
    console.error('Error deleting consultant:', error);
    res.status(500).json({
      error: 'Failed to delete consultant',
      details: 'An unexpected error occurred while deleting the consultant'
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

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export the Express API
export default app;
