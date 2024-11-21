import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Gross Income',
      'Consultants',
      'Materials',
      'Assistant',
      'Housekeeping',
      'Water',
      'Maid',
      'Repairs',
      'Rent',
      'E-Bill',
      'Profit'
    ]
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Expense', expenseSchema);
