import mongoose from 'mongoose';

const consultantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    validate: {
      validator: function(v: string) {
        return v.trim().length > 0;
      },
      message: 'Name cannot be empty'
    }
  },
  specialization: {
    type: String,
    required: false,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Consultant', consultantSchema);
