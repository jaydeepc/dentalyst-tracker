import { useEffect, useState } from 'react';
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
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { API_BASE_URL } from '../config';

interface ExpenseData {
  _id: {
    month: number;
    year: number;
    category: string;
  };
  total: number;
}

interface SummaryData {
  category: string;
  total: number;
  percentage: number;
}

interface ProfitData {
  grossIncome: number;
  totalExpenses: number;
  profit: number;
  profitPercentage: number;
}

const COLORS = [
  '#0062FF', // Primary
  '#00C6FF', // Secondary
  '#4B8AFF',
  '#5CDDFF',
  '#0046B8',
  '#0095CC',
  '#7AA7FF',
  '#85E6FF',
  '#003285',
  '#006B99',
];

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
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0].substring(0, 7)
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
  const [profitData, setProfitData] = useState<ProfitData>({
    grossIncome: 0,
    totalExpenses: 0,
    profit: 0,
    profitPercentage: 0,
  });

  useEffect(() => {
    fetchExpenses();
  }, [selectedDate, selectedCategory]);

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses/monthly`);
      const data = await response.json();
      setExpenses(data);
      calculateSummary(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const calculateSummary = (data: ExpenseData[]) => {
    const totals = categories.reduce((acc: { [key: string]: number }, category) => {
      acc[category] = data
        .filter(expense => expense._id.category === category)
        .reduce((sum, expense) => sum + expense.total, 0);
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

    const summary = categories
      .filter(category => category !== 'Gross Income')
      .map(category => ({
        category,
        total: totals[category],
        percentage: totalExpenses ? (totals[category] / totalExpenses) * 100 : 0
      }));

    setSummaryData(summary);
  };

  const processDataForCharts = () => {
    const monthlyData = expenses.reduce((acc: any[], expense: ExpenseData) => {
      const monthYear = `${expense._id.month}/${expense._id.year}`;
      const existingMonth = acc.find((item) => item.monthYear === monthYear);

      if (existingMonth) {
        existingMonth[expense._id.category] = expense.total;
        existingMonth.total += expense.total;
      } else {
        const newMonth = {
          monthYear,
          total: expense.total,
          [expense._id.category]: expense.total,
        };
        acc.push(newMonth);
      }

      return acc;
    }, []);

    return monthlyData.sort((a, b) => {
      const [aMonth, aYear] = a.monthYear.split('/');
      const [bMonth, bYear] = b.monthYear.split('/');
      return new Date(aYear, aMonth - 1).getTime() - new Date(bYear, bMonth - 1).getTime();
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card
          elevation={3}
          sx={{
            p: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2" color="primary" fontWeight={600}>
            {label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Amount: ₹{payload[0].value.toLocaleString()}
          </Typography>
        </Card>
      );
    }
    return null;
  };

  const monthlyData = processDataForCharts();

  return (
    <Fade in timeout={800}>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" gutterBottom color="primary.dark" fontWeight={700}>
              Expense Reports
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Analyze your dental clinic expenses with detailed visualizations
            </Typography>
          </Box>

          {/* Profit Overview Cards */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(45deg, #2196f3 30%, #64b5f6 90%)',
                color: 'white',
                height: '100%'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Gross Income</Typography>
                  <Typography variant="h4">₹{profitData.grossIncome.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
                color: 'white',
                height: '100%'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Total Expenses</Typography>
                  <Typography variant="h4">₹{profitData.totalExpenses.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)',
                color: 'white',
                height: '100%'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Net Profit</Typography>
                  <Typography variant="h4">₹{profitData.profit.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
                  height: '100%'
                }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                      variant="determinate"
                      value={Math.max(0, Math.min(profitData.profitPercentage, 100))}
                      size={80}
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
                      <Typography variant="h6" component="div" color="white">
                        {Math.round(profitData.profitPercentage)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="subtitle1" sx={{ mt: 1 }}>Profit Margin</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="month"
                    label="Select Month"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="Category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Summary Table */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary.dark" fontWeight={600}>
                Expense Summary
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Total Amount</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summaryData.map((row) => (
                      <TableRow key={row.category}>
                        <TableCell component="th" scope="row">
                          {row.category}
                        </TableCell>
                        <TableCell align="right">
                          ₹{row.total.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {row.percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary.dark" fontWeight={600}>
                    Monthly Expense Trends
                  </Typography>
                  <Box sx={{ height: isMobile ? 300 : 400, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthlyData}
                        margin={isMobile ? { top: 5, right: 10, left: -20, bottom: 5 } : { top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis
                          dataKey="monthYear"
                          stroke={theme.palette.text.secondary}
                          tick={{ fill: theme.palette.text.secondary }}
                          angle={isMobile ? -45 : 0}
                          textAnchor={isMobile ? 'end' : 'middle'}
                          height={isMobile ? 60 : 30}
                        />
                        <YAxis
                          stroke={theme.palette.text.secondary}
                          tick={{ fill: theme.palette.text.secondary }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke={theme.palette.primary.main}
                          strokeWidth={3}
                          dot={{ fill: theme.palette.primary.main, strokeWidth: 2 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary.dark" fontWeight={600}>
                    Category Distribution
                  </Typography>
                  <Box sx={{ height: isMobile ? 300 : 400, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={isMobile ? { top: 0, right: 0, left: 0, bottom: 0 } : { top: 0, right: 30, left: 30, bottom: 0 }}>
                        <Pie
                          data={summaryData}
                          dataKey="total"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={isMobile ? '70%' : '80%'}
                          label={({ name, percent }) =>
                            isMobile ? `${(percent * 100).toFixed(0)}%` : `${name} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {summaryData.map((entry, index) => (
                            <Cell
                              key={entry.category}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) =>
                            `₹${value.toLocaleString()}`
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary.dark" fontWeight={600}>
                    Category Comparison
                  </Typography>
                  <Box sx={{ height: isMobile ? 300 : 400, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={summaryData}
                        margin={isMobile ? { top: 5, right: 10, left: -20, bottom: 60 } : { top: 5, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis
                          dataKey="category"
                          stroke={theme.palette.text.secondary}
                          tick={{ fill: theme.palette.text.secondary }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          interval={0}
                          fontSize={isMobile ? 10 : 12}
                        />
                        <YAxis
                          stroke={theme.palette.text.secondary}
                          tick={{ fill: theme.palette.text.secondary }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                          {summaryData.map((entry, index) => (
                            <Cell
                              key={entry.category}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    </Fade>
  );
};

export default Reports;
