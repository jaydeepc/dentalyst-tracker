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
  Switch,
  FormControlLabel,
  Select,
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
  'Bio Medicals',
  'Maid',
  'Repairs',
  'Rent',
  'E-Bill',
  'Profit',
  'Lab Materials'
];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface Consultant {
  _id: string;
  name: string;
  specialization: string;
  active: boolean;
}

interface ExpenseFormData {
  date: string;
  category: string;
  amount: string;
  description: string;
  consultantName?: string;
}

interface BulkExpenseFormData {
  month: number;
  year: number;
  category: string;
  totalAmount: string;
  description: string;
  consultantName?: string;
}

interface SingleFormErrors {
  date?: string;
  category?: string;
  amount?: string;
  description?: string;
  consultantName?: string;
}

interface BulkFormErrors {
  month?: string;
  year?: string;
  category?: string;
  totalAmount?: string;
  description?: string;
  consultantName?: string;
}

const ExpenseEntry = () => {
  const theme = useTheme();
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    description: '',
    consultantName: '',
  });

  const currentDate = new Date();
  const [bulkFormData, setBulkFormData] = useState<BulkExpenseFormData>({
    month: currentDate.getMonth(),
    year: currentDate.getFullYear(),
    category: '',
    totalAmount: '',
    description: '',
    consultantName: '',
  });

  const [singleErrors, setSingleErrors] = useState<SingleFormErrors>({});
  const [bulkErrors, setBulkErrors] = useState<BulkFormErrors>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // Generate year options (last 5 years to next year)
  const years = Array.from({ length: 7 }, (_, i) => currentDate.getFullYear() - 5 + i);

  // Fetch consultants on mount
  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/consultants`);
        if (!response.ok) {
          throw new Error('Failed to fetch consultants');
        }
        const data = await response.json();
        setConsultants(data.filter((c: Consultant) => c.active));
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to fetch consultants',
          severity: 'error',
        });
      }
    };

    fetchConsultants();
  }, []);

  // Check backend health on mount
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

  const validateSingleForm = () => {
    const newErrors: SingleFormErrors = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.amount || isNaN(Number(formData.amount))) {
      newErrors.amount = 'Valid amount is required';
    }
    if (formData.category === 'Consultants' && !formData.consultantName) {
      newErrors.consultantName = 'Consultant name is required';
    }

    setSingleErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBulkForm = () => {
    const newErrors: BulkFormErrors = {};

    if (bulkFormData.month === undefined) {
      newErrors.month = 'Month is required';
    }
    if (!bulkFormData.year) {
      newErrors.year = 'Year is required';
    }
    if (!bulkFormData.category) {
      newErrors.category = 'Category is required';
    }
    if (!bulkFormData.totalAmount || isNaN(Number(bulkFormData.totalAmount))) {
      newErrors.totalAmount = 'Valid total amount is required';
    }
    if (bulkFormData.category === 'Consultants' && !bulkFormData.consultantName) {
      newErrors.consultantName = 'Consultant name is required';
    }

    setBulkErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSingleForm()) {
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
          consultantName: formData.category === 'Consultants' ? formData.consultantName : undefined,
        }),
      });

      if (response.ok) {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          category: '',
          amount: '',
          description: '',
          consultantName: '',
        });
        setSnackbar({
          open: true,
          message: 'Expense added successfully',
          severity: 'success',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.details?.[0] || 'Failed to add expense');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to add expense. Please try again.',
        severity: 'error',
      });
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateBulkForm()) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields correctly',
        severity: 'error',
      });
      return;
    }

    try {
      // Calculate start and end dates for the selected month
      const startDate = new Date(bulkFormData.year, bulkFormData.month, 1);
      const endDate = new Date(bulkFormData.year, bulkFormData.month + 1, 0);
      const totalDays = endDate.getDate();
      const amountPerDay = Number(bulkFormData.totalAmount) / totalDays;

      const expenses = [];
      for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        expenses.push({
          date: currentDate,
          category: bulkFormData.category,
          amount: amountPerDay,
          description: bulkFormData.description,
          consultantName: bulkFormData.category === 'Consultants' ? bulkFormData.consultantName : undefined,
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/expenses/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expenses }),
      });

      if (response.ok) {
        setBulkFormData({
          ...bulkFormData,
          category: '',
          totalAmount: '',
          description: '',
          consultantName: '',
        });
        setSnackbar({
          open: true,
          message: 'Bulk expenses added successfully',
          severity: 'success',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.details?.[0] || 'Failed to add bulk expenses');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to add bulk expenses. Please try again.',
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
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isBulkMode}
                  onChange={(e) => setIsBulkMode(e.target.checked)}
                  sx={{ 
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'white',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ color: 'white' }}>
                  {isBulkMode ? 'Monthly Entry Mode' : 'Single Entry Mode'}
                </Typography>
              }
            />
          </Box>
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
            {!isBulkMode ? (
              <form onSubmit={handleSingleSubmit}>
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
                      error={!!singleErrors.date}
                      helperText={singleErrors.date}
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
                      error={!!singleErrors.category}
                      helperText={singleErrors.category}
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
                  {formData.category === 'Consultants' && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        fullWidth
                        label="Consultant"
                        value={formData.consultantName || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, consultantName: e.target.value })
                        }
                        error={!!singleErrors.consultantName}
                        helperText={singleErrors.consultantName}
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
                        {consultants.map((consultant) => (
                          <MenuItem key={consultant._id} value={consultant.name}>
                            {consultant.name} {consultant.specialization ? `(${consultant.specialization})` : ''}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  )}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      error={!!singleErrors.amount}
                      helperText={singleErrors.amount}
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
            ) : (
              <form onSubmit={handleBulkSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Month"
                      value={bulkFormData.month}
                      onChange={(e) =>
                        setBulkFormData({ ...bulkFormData, month: Number(e.target.value) })
                      }
                      error={!!bulkErrors.month}
                      helperText={bulkErrors.month}
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
                      {months.map((month, index) => (
                        <MenuItem key={month} value={index}>
                          {month}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Year"
                      value={bulkFormData.year}
                      onChange={(e) =>
                        setBulkFormData({ ...bulkFormData, year: Number(e.target.value) })
                      }
                      error={!!bulkErrors.year}
                      helperText={bulkErrors.year}
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
                      {years.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Category"
                      value={bulkFormData.category}
                      onChange={(e) =>
                        setBulkFormData({ ...bulkFormData, category: e.target.value })
                      }
                      error={!!bulkErrors.category}
                      helperText={bulkErrors.category}
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
                  {bulkFormData.category === 'Consultants' && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        fullWidth
                        label="Consultant"
                        value={bulkFormData.consultantName || ''}
                        onChange={(e) =>
                          setBulkFormData({ ...bulkFormData, consultantName: e.target.value })
                        }
                        error={!!bulkErrors.consultantName}
                        helperText={bulkErrors.consultantName}
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
                        {consultants.map((consultant) => (
                          <MenuItem key={consultant._id} value={consultant.name}>
                            {consultant.name} {consultant.specialization ? `(${consultant.specialization})` : ''}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  )}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Total Amount"
                      type="number"
                      value={bulkFormData.totalAmount}
                      onChange={(e) =>
                        setBulkFormData({ ...bulkFormData, totalAmount: e.target.value })
                      }
                      error={!!bulkErrors.totalAmount}
                      helperText={bulkErrors.totalAmount}
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
                      value={bulkFormData.description}
                      onChange={(e) =>
                        setBulkFormData({ ...bulkFormData, description: e.target.value })
                      }
                      placeholder="Add any additional notes or details about the monthly expenses"
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
                      Add Monthly Expenses
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}
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
