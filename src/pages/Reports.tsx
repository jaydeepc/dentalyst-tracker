import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Stack,
  useTheme,
  Fade,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useMediaQuery,
  CircularProgress,
  Button
} from '@mui/material';
import { API_BASE_URL } from '../config';

interface ExpenseEntry {
  date: string;
  amount: number;
}

interface ExpenseData {
  _id: {
    month: number;
    year: number;
    category: string;
  };
  total: number;
  entries: ExpenseEntry[];
}

interface ProfitData {
  grossIncome: number;
  totalExpenses: number;
  profit: number;
  profitPercentage: number;
}

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
];

const Reports = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showEntries, setShowEntries] = useState(false);
  const [profitData, setProfitData] = useState<ProfitData>({
    grossIncome: 0,
    totalExpenses: 0,
    profit: 0,
    profitPercentage: 0,
  });

  const calculateSummary = (data: ExpenseData[]) => {
    if (!Array.isArray(data)) {
      data = [];
    }

    const totals = categories.reduce((acc: { [key: string]: number }, category) => {
      acc[category] = data
        .filter(expense => expense?._id?.category === category)
        .reduce((sum, expense) => sum + (expense?.total || 0), 0);
      return acc;
    }, {});

    const grossIncome = totals['Gross Income'] || 0;
    const totalExpenses = Object.entries(totals)
      .filter(([category]) => category !== 'Gross Income')
      .reduce((sum, [_, value]) => sum + value, 0);
    
    const profit = grossIncome - totalExpenses;
    const profitPercentage = grossIncome ? (profit / grossIncome) * 100 : 0;

    setProfitData({
      grossIncome,
      totalExpenses,
      profit,
      profitPercentage,
    });
  };

  const fetchExpenses = async () => {
    if (!startDate || !endDate) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE_URL}/api/expenses/monthly`);
      // Add time to get full day ranges (start of day to end of day)
      url.searchParams.append('startDate', `${startDate}T00:00:00`);
      url.searchParams.append('endDate', `${endDate}T23:59:59`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const data = await response.json();
      setExpenses(data || []);
      calculateSummary(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setExpenses([]);
      calculateSummary([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewEntries = () => {
    if (!startDate || !endDate) return;
    setShowEntries(true);
    fetchExpenses();
  };

  const filteredExpenses = useMemo(() => {
    if (!Array.isArray(expenses)) return [];
    return expenses.filter(expense => 
      selectedCategory === 'all' || expense?._id?.category === selectedCategory
    );
  }, [expenses, selectedCategory]);

  return (
    <Fade in timeout={800}>
      <Box sx={{ p: { xs: 1, sm: 3 } }}>
        <Stack spacing={{ xs: 2, sm: 3 }}>
          <Box>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              gutterBottom 
              color="primary.dark" 
              fontWeight={700}
            >
              Expense Reports
            </Typography>
            <Typography 
              variant={isMobile ? "body1" : "subtitle1"} 
              color="text.secondary"
            >
              View your dental clinic expenses by date range
            </Typography>
          </Box>

          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
              <Grid container spacing={{ xs: 1.5, sm: 3 }} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setShowEntries(false);
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    size={isMobile ? "small" : "medium"}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setShowEntries(false);
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    size={isMobile ? "small" : "medium"}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    size={isMobile ? "small" : "medium"}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleViewEntries}
                    disabled={!startDate || !endDate}
                    sx={{ height: '100%', minHeight: 40 }}
                  >
                    View Entries
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {showEntries && (
            <>
              <Grid container spacing={{ xs: 1.5, sm: 3 }}>
                <Grid item xs={6} sm={6} md={3}>
                  <Card sx={{ 
                    background: 'linear-gradient(45deg, #2196f3 30%, #64b5f6 90%)',
                    color: 'white',
                    height: '100%'
                  }}>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                        Gross Income
                      </Typography>
                      <Typography variant={isMobile ? "h6" : "h4"}>
                        ₹{profitData.grossIncome.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                  <Card sx={{ 
                    background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
                    color: 'white',
                    height: '100%'
                  }}>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                        Total Expenses
                      </Typography>
                      <Typography variant={isMobile ? "h6" : "h4"}>
                        ₹{profitData.totalExpenses.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                  <Card sx={{ 
                    background: 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)',
                    color: 'white',
                    height: '100%'
                  }}>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                        Net Profit
                      </Typography>
                      <Typography variant={isMobile ? "h6" : "h4"}>
                        ₹{profitData.profit.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                  <Card sx={{ 
                    background: 'linear-gradient(45deg, #9c27b0 30%, #ba68c8 90%)',
                    color: 'white',
                    height: '100%',
                    position: 'relative'
                  }}>
                    <CardContent sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      p: { xs: 1.5, sm: 2 }
                    }}>
                      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <CircularProgress
                          variant="determinate"
                          value={Math.max(0, Math.min(profitData.profitPercentage, 100))}
                          size={isMobile ? 40 : 80}
                          thickness={4}
                          sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                        />
                        <Box
                          sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant={isMobile ? "caption" : "h6"} component="div" color="white">
                            {Math.round(profitData.profitPercentage)}%
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant={isMobile ? "body2" : "subtitle1"} sx={{ mt: 1 }}>
                        Profit Margin
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Loading and Error States */}
              {isLoading && (
                <Card>
                  <CardContent sx={{ p: { xs: 1.5, sm: 3 }, textAlign: 'center' }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Loading expenses...</Typography>
                  </CardContent>
                </Card>
              )}

              {error && (
                <Card>
                  <CardContent sx={{ p: { xs: 1.5, sm: 3 }, color: 'error.main' }}>
                    <Typography>{error}</Typography>
                  </CardContent>
                </Card>
              )}

              {/* Detailed Entries */}
              {!isLoading && !error && (
                <Card>
                  <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
                    <Typography 
                      variant={isMobile ? "h6" : "h5"} 
                      gutterBottom 
                      color="primary.dark" 
                      fontWeight={600}
                      sx={{ mb: 3 }}
                    >
                      Detailed Entries
                    </Typography>
                    <TableContainer component={Paper} elevation={2}>
                      <Table size={isMobile ? "small" : "medium"}>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Category</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
                            <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredExpenses.map(expense => (
                            <React.Fragment key={`${expense._id.category}-${expense._id.month}-${expense._id.year}-group`}>
                              {Array.isArray(expense.entries) && expense.entries.map((entry, index) => (
                                <TableRow 
                                  key={`${expense._id.category}-${entry.date}-${index}`}
                                  sx={{ 
                                    '&:nth-of-type(odd)': {
                                      backgroundColor: theme.palette.action.hover,
                                    }
                                  }}
                                >
                                  <TableCell sx={{ fontWeight: 500 }}>
                                    {expense._id.category}
                                  </TableCell>
                                  <TableCell>
                                    {new Date(entry.date).toLocaleDateString('en-IN', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </TableCell>
                                  <TableCell align="right">
                                    ₹{entry.amount.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow sx={{ 
                                backgroundColor: theme.palette.primary.light,
                                '&:last-child td': { borderBottom: 0 }
                              }}>
                                <TableCell colSpan={2} sx={{ color: 'white', fontWeight: 600 }}>
                                  {expense._id.category} Total
                                </TableCell>
                                <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                                  ₹{expense.total.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </Stack>
      </Box>
    </Fade>
  );
};

export default Reports;
