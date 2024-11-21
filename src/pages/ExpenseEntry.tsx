import { useState } from 'react';
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
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import { API_BASE_URL } from '../config';
import {
  AddCircleOutline as AddIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  CurrencyRupee as RupeeIcon,
  Description as DescriptionIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

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
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" gutterBottom color="primary.dark" fontWeight={700}>
              Add New Expense
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Track your dental clinic expenses by entering the details below
            </Typography>
          </Box>

          <Card>
            <CardContent sx={{ p: 3 }}>
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
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon color="action" />
                          </InputAdornment>
                        ),
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
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CategoryIcon color="action" />
                          </InputAdornment>
                        ),
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
                          <InputAdornment position="start">
                            <RupeeIcon color="action" />
                          </InputAdornment>
                        ),
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
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <DescriptionIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 2,
                      }}
                    >
                      <Tooltip title="All fields except Description are required">
                        <IconButton size="small" color="primary">
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        startIcon={<AddIcon />}
                        sx={{
                          px: 4,
                          py: 1.5,
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                          boxShadow: '0 8px 16px rgba(0, 98, 255, 0.2)',
                          '&:hover': {
                            background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                            boxShadow: '0 12px 24px rgba(0, 98, 255, 0.3)',
                          },
                        }}
                      >
                        Add Expense
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Stack>

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
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
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
