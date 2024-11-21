import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  Grid,
  Typography,
  Snackbar,
  Alert,
  InputAdornment,
  useTheme,
  Paper,
  Fade,
} from '@mui/material';
import { API_BASE_URL, checkBackendHealth } from '../config';
import { AddCircle as AddIcon } from '@mui/icons-material';

const categories = [
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
  'Profit',
];

interface ExpenseFormData {
  date: string;
  category: string;
  amount: string;
  description: string;
}

const ExpenseEntry = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    description: '',
  });

  const [errors, setErrors] = useState<Partial<ExpenseFormData>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // Check backend health on component mount
  useEffect(() => {
    const verifyBackend = async () => {
      const health = await checkBackendHealth();
      if (!health.isHealthy) {
        setSnackbar({
          open: true,
          message: 'Warning: Backend service is not responding',
          severity: 'error',
        });
      }
    };
    verifyBackend();
  }, []);

  const validateForm = () => {
    const newErrors: Partial<ExpenseFormData> = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.amount || isNaN(Number(formData.amount))) {
      newErrors.amount = 'Valid amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields correctly',
        severity: 'error',
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date(formData.date),
          category: formData.category,
          amount: Number(formData.amount),
          description: formData.description,
        }),
      });

      if (response.ok) {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          category: '',
          amount: '',
          description: '',
        });
        setSnackbar({
          open: true,
          message: 'Expense added successfully',
          severity: 'success',
        });
      } else {
        throw new Error('Failed to add expense');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to add expense. Please try again.',
        severity: 'error',
      });
    }
  };

  return (
    <Fade in timeout={800}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(45deg, #2196f3 30%, #64b5f6 90%)',
            borderRadius: '20px 20px 0 0',
            p: 3,
            mb: -2,
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              color: 'white',
              fontWeight: 600,
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            Add New Expense
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'rgba(255,255,255,0.9)',
              textAlign: 'center',
              maxWidth: 600,
              mx: 'auto',
              mb: 2,
            }}
          >
            Track your dental clinic expenses by entering the details below
          </Typography>
        </Paper>
        <Card
          elevation={0}
          sx={{
            borderRadius: '0 0 20px 20px',
            backgroundColor: 'background.paper',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            },
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    error={!!errors.date}
                    helperText={errors.date}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'background.paper',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: 'rgba(33, 150, 243, 0.02)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(33, 150, 243, 0.05)',
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    error={!!errors.category}
                    helperText={errors.category}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'background.paper',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: 'rgba(33, 150, 243, 0.02)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(33, 150, 243, 0.05)',
                        },
                      },
                    }}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    error={!!errors.amount}
                    helperText={errors.amount}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₹</InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'background.paper',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: 'rgba(33, 150, 243, 0.02)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(33, 150, 243, 0.05)',
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Add any additional notes or details about the expense"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'background.paper',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: 'rgba(33, 150, 243, 0.02)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(33, 150, 243, 0.05)',
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    sx={{
                      minWidth: 200,
                      py: 1.5,
                      px: 4,
                      borderRadius: '12px',
                      background: 'linear-gradient(45deg, #2196f3 30%, #64b5f6 90%)',
                      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                      },
                    }}
                  >
                    Add Expense
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
            sx={{
              width: '100%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default ExpenseEntry;
