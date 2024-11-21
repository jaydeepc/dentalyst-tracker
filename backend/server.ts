import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001; // Changed port to 5001

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = 'mongodb+srv://dentalyst:admin@dentalyst.lkkq3.mongodb.net/?retryWrites=true&w=majority&appName=dentalyst';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define expense schema
const expenseSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String },
});

const Expense = mongoose.model('Expense', expenseSchema);

// API Routes
app.post('/api/expenses', async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error creating expense' });
  }
});

app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching expenses' });
  }
});

app.get('/api/expenses/monthly', async (req, res) => {
  try {
    const expenses = await Expense.aggregate([
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
    res.json(expenses);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching monthly expenses' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
