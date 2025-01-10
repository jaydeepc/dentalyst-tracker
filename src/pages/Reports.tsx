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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
  Checkbox
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { API_BASE_URL } from '../config';

interface ExpenseEntry {
  _id: string;
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

interface DeleteDialogProps {
  open: boolean;
  expenses: ExpenseEntry[];
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteDialog = ({ open, expenses, onClose, onConfirm }: DeleteDialogProps) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Confirm Delete</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Are you sure you want to delete {expenses.length === 1 ? 'this expense' : `these ${expenses.length} expenses`}?
        {expenses.length === 1 ? (
          <>
            <br /><br />
            Amount: ₹{expenses[0]?.amount.toLocaleString()}
            <br />
            Date: {new Date(expenses[0].date).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </>
        ) : (
          <>
            <br /><br />
            Total Amount: ₹{expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
          </>
        )}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">Cancel</Button>
      <Button onClick={onConfirm} color="error" variant="contained">Delete</Button>
    </DialogActions>
  </Dialog>
);

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
  const [filterType, setFilterType] = useState<'date' | 'month' | 'year'>('date');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showEntries, setShowEntries] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<ExpenseEntry[]>([]);
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

  const fetchExpenses = async (withFilter = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE_URL}/api/expenses/monthly`);
      
      if (withFilter) {
        let start: Date, end: Date;
        
        switch (filterType) {
          case 'date':
            if (startDate && endDate) {
              start = new Date(`${startDate}T00:00:00`);
              end = new Date(`${endDate}T23:59:59`);
            } else return;
            break;
          
          case 'month':
            if (selectedMonth) {
              const [year, month] = selectedMonth.split('-');
              start = new Date(parseInt(year), parseInt(month) - 1, 1);
              end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            } else return;
            break;
          
          case 'year':
            if (selectedYear) {
              start = new Date(parseInt(selectedYear), 0, 1);
              end = new Date(parseInt(selectedYear), 11, 31, 23, 59, 59);
            } else return;
            break;
          
          default:
            return;
        }
        
        url.searchParams.append('startDate', start.toISOString());
        url.searchParams.append('endDate', end.toISOString());
      } else {
        // Get all expenses till date
        const today = new Date();
        const firstDay = new Date(2000, 0, 1); // Start from year 2000
        url.searchParams.append('startDate', firstDay.toISOString());
        url.searchParams.append('endDate', today.toISOString());
      }
      
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

  // Load all expenses on mount
  React.useEffect(() => {
    fetchExpenses();
  }, []);

  const handleViewEntries = () => {
    let canProceed = false;
    switch (filterType) {
      case 'date':
        canProceed = !!(startDate && endDate);
        break;
      case 'month':
        canProceed = !!selectedMonth;
        break;
      case 'year':
        canProceed = !!selectedYear;
        break;
    }
    
    if (canProceed) {
      setShowEntries(true);
      fetchExpenses(true);
    }
  };

  const handleDeleteClick = (expense: ExpenseEntry) => {
    setSelectedExpenses([expense]);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedExpenses.length === 0) return;

    try {
      let response;
      if (selectedExpenses.length === 1) {
        response = await fetch(`${API_BASE_URL}/api/expenses/${selectedExpenses[0]._id}`, {
          method: 'DELETE',
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/expenses`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ids: selectedExpenses.map(exp => exp._id)
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to delete expense(s)');
      }

      // Refresh data with current filter state
      fetchExpenses(showEntries);
      setError(null);
    } catch (error) {
      console.error('Error deleting expense(s):', error);
      setError(error instanceof Error ? error.message : 'Failed to delete expense(s)');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedExpenses([]);
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allEntries = filteredExpenses.flatMap(expense => expense.entries);
      setSelectedExpenses(allEntries);
    } else {
      setSelectedExpenses([]);
    }
  };

  const handleSelectOne = (expense: ExpenseEntry) => {
    setSelectedExpenses(prev => {
      const isSelected = prev.some(e => e._id === expense._id);
      if (isSelected) {
        return prev.filter(e => e._id !== expense._id);
      } else {
        return [...prev, expense];
      }
    });
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedExpenses([]);
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

          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
              <Grid container spacing={{ xs: 1.5, sm: 3 }} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Filter Type"
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value as 'date' | 'month' | 'year');
                      setShowEntries(false);
                      // Reset all filter values
                      setStartDate('');
                      setEndDate('');
                      setSelectedMonth('');
                      setSelectedYear('');
                    }}
                    size={isMobile ? "small" : "medium"}
                  >
                    <MenuItem value="date">Date Range</MenuItem>
                    <MenuItem value="month">Month</MenuItem>
                    <MenuItem value="year">Year</MenuItem>
                  </TextField>
                </Grid>

                {filterType === 'date' && (
                  <>
                    <Grid item xs={12} md={2}>
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
                    <Grid item xs={12} md={2}>
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
                  </>
                )}

                {filterType === 'month' && (
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="month"
                      label="Select Month"
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setShowEntries(false);
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      size={isMobile ? "small" : "medium"}
                    />
                  </Grid>
                )}

                {filterType === 'year' && (
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Select Year"
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value);
                        setShowEntries(false);
                      }}
                      inputProps={{
                        min: 2000,
                        max: new Date().getFullYear(),
                      }}
                      size={isMobile ? "small" : "medium"}
                    />
                  </Grid>
                )}

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
                    disabled={
                      (filterType === 'date' && (!startDate || !endDate)) ||
                      (filterType === 'month' && !selectedMonth) ||
                      (filterType === 'year' && !selectedYear)
                    }
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography 
                        variant={isMobile ? "h6" : "h5"} 
                        color="primary.dark" 
                        fontWeight={600}
                      >
                        Detailed Entries
                      </Typography>
                      {selectedExpenses.length > 0 && (
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => setDeleteDialogOpen(true)}
                          startIcon={<DeleteIcon />}
                        >
                          Delete Selected ({selectedExpenses.length})
                        </Button>
                      )}
                    </Box>
                    <TableContainer component={Paper} elevation={2}>
                      <Table size={isMobile ? "small" : "medium"}>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                            <TableCell padding="checkbox" sx={{ color: 'white' }}>
                              <Checkbox
                                sx={{ color: 'white' }}
                                indeterminate={
                                  selectedExpenses.length > 0 &&
                                  selectedExpenses.length < filteredExpenses.flatMap(e => e.entries).length
                                }
                                checked={
                                  filteredExpenses.flatMap(e => e.entries).length > 0 &&
                                  selectedExpenses.length === filteredExpenses.flatMap(e => e.entries).length
                                }
                                onChange={handleSelectAll}
                              />
                            </TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Category</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
                            <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Amount</TableCell>
                            <TableCell align="center" sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
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
                                  <TableCell padding="checkbox">
                                    <Checkbox
                                      checked={selectedExpenses.some(e => e._id === entry._id)}
                                      onChange={() => handleSelectOne(entry)}
                                    />
                                  </TableCell>
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
                                  <TableCell align="center">
                                    <Tooltip title="Delete Entry">
                                      <IconButton
                                        onClick={() => handleDeleteClick(entry)}
                                        color="error"
                                        size="small"
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow sx={{ 
                                backgroundColor: theme.palette.primary.light,
                                '&:last-child td': { borderBottom: 0 }
                              }}>
                                <TableCell />
                                <TableCell colSpan={2} sx={{ color: 'white', fontWeight: 600 }}>
                                  {expense._id.category} Total
                                </TableCell>
                                <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                                  ₹{expense.total.toLocaleString()}
                                </TableCell>
                                <TableCell /> {/* Empty cell for actions column */}
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

        <DeleteDialog
          open={deleteDialogOpen}
          expenses={selectedExpenses}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
      </Box>
    </Fade>
  );
};

export default Reports;
