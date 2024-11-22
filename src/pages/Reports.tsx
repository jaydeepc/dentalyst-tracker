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

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
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

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
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

  const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    if (percent < 0.03) return null;

    return (
      <text
        x={x}
        y={y}
        fill={theme.palette.text.primary}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={isMobile ? "10px" : "12px"}
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  const monthlyData = processDataForCharts();

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
              Analyze your dental clinic expenses with detailed visualizations
            </Typography>
          </Box>

          {/* Profit Overview Cards */}
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
                    size={isMobile ? "small" : "medium"}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
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
              </Grid>
            </CardContent>
          </Card>

          {/* Summary Table */}
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                gutterBottom 
                color="primary.dark" 
                fontWeight={600}
              >
                Expense Summary
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table size={isMobile ? "small" : "medium"}>
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

          <Grid container spacing={{ xs: 1.5, sm: 3 }}>
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    gutterBottom 
                    color="primary.dark" 
                    fontWeight={600}
                  >
                    Monthly Expense Trends
                  </Typography>
                  <Box sx={{ height: isMobile ? 250 : 400, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthlyData}
                        margin={isMobile ? 
                          { top: 5, right: 10, left: -15, bottom: 0 } : 
                          { top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis
                          dataKey="monthYear"
                          stroke={theme.palette.text.secondary}
                          tick={{ 
                            fill: theme.palette.text.secondary,
                            fontSize: isMobile ? 10 : 12 
                          }}
                          angle={isMobile ? -45 : 0}
                          textAnchor={isMobile ? 'end' : 'middle'}
                          height={isMobile ? 50 : 30}
                        />
                        <YAxis
                          stroke={theme.palette.text.secondary}
                          tick={{ 
                            fill: theme.palette.text.secondary,
                            fontSize: isMobile ? 10 : 12 
                          }}
                          tickFormatter={(value) => `₹${value.toLocaleString()}`}
                          width={isMobile ? 60 : 80}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke={theme.palette.primary.main}
                          strokeWidth={2}
                          dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: isMobile ? 3 : 4 }}
                          activeDot={{ r: isMobile ? 6 : 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    gutterBottom 
                    color="primary.dark" 
                    fontWeight={600}
                  >
                    Category Distribution
                  </Typography>
                  <Box sx={{ height: isMobile ? 300 : 500, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 20, right: isMobile ? 20 : 100, bottom: 20, left: isMobile ? 20 : 100 }}>
                        <Pie
                          data={summaryData}
                          dataKey="total"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={isMobile ? '45%' : '65%'}
                          label={renderCustomizedPieLabel}
                          labelLine={{
                            stroke: theme.palette.text.secondary,
                            strokeWidth: 1
                          }}
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

            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    gutterBottom 
                    color="primary.dark" 
                    fontWeight={600}
                  >
                    Category Comparison
                  </Typography>
                  <Box sx={{ height: isMobile ? 300 : 500, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={summaryData}
                        margin={isMobile ? 
                          { top: 20, right: 10, left: 0, bottom: 20 } : 
                          { top: 20, right: 30, left: 20, bottom: 20 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis
                          type="number"
                          stroke={theme.palette.text.secondary}
                          tick={{ 
                            fill: theme.palette.text.secondary,
                            fontSize: isMobile ? 10 : 12 
                          }}
                          tickFormatter={(value) => `₹${value.toLocaleString()}`}
                        />
                        <YAxis
                          type="category"
                          dataKey="category"
                          stroke={theme.palette.text.secondary}
                          tick={{ 
                            fill: theme.palette.text.secondary,
                            fontSize: isMobile ? 10 : 12
                          }}
                          width={isMobile ? 70 : 100}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="total" radius={[0, 8, 8, 0]}>
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
