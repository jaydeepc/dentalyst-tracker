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
  InputAdornment,
  IconButton,
  Tooltip,
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
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { API_BASE_URL } from '../config';

interface ExpenseData {
  _id: {
    month: number;
    year: number;
    category: string;
  };
  total: number;
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
  '#A8C4FF',
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
  'Profit',
];

const Reports = () => {
  const theme = useTheme();
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0].substring(0, 7)
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchExpenses();
  }, [selectedDate, selectedCategory]);

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses/monthly`);
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
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

  const calculateCategoryTotals = () => {
    return categories.map((category) => ({
      category,
      total: expenses
        .filter((expense) => expense._id.category === category)
        .reduce((sum, expense) => sum + expense.total, 0),
    }));
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
  const categoryTotals = calculateCategoryTotals();

  return (
    <Fade in timeout={800}>
      <Box>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" gutterBottom color="primary.dark" fontWeight={700}>
              Expense Reports
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Analyze your dental clinic expenses with detailed visualizations
            </Typography>
          </Box>

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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon color="action" />
                        </InputAdornment>
                      ),
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CategoryIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Tooltip title="Select month and category to filter the data">
                      <IconButton color="primary">
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary.dark" fontWeight={600}>
                      Monthly Expense Trends
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Track your expenses over time
                    </Typography>
                  </Box>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis
                          dataKey="monthYear"
                          stroke={theme.palette.text.secondary}
                          tick={{ fill: theme.palette.text.secondary }}
                        />
                        <YAxis
                          stroke={theme.palette.text.secondary}
                          tick={{ fill: theme.palette.text.secondary }}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
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
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary.dark" fontWeight={600}>
                      Category Distribution
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expense breakdown by category
                    </Typography>
                  </Box>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={categoryTotals}
                          dataKey="total"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={150}
                          label={({ name, percent }) =>
                            `${name} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {categoryTotals.map((entry, index) => (
                            <Cell
                              key={entry.category}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
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
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary.dark" fontWeight={600}>
                      Category Comparison
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Compare expenses across categories
                    </Typography>
                  </Box>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer>
                      <BarChart data={categoryTotals}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis
                          dataKey="category"
                          stroke={theme.palette.text.secondary}
                          tick={{ fill: theme.palette.text.secondary }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis
                          stroke={theme.palette.text.secondary}
                          tick={{ fill: theme.palette.text.secondary }}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                          {categoryTotals.map((entry, index) => (
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
