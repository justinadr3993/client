import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  Container,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from '@mui/material';
import { 
  useGetStockAnalyticsQuery,
  useGetStockHistoryQuery,
} from '../../services/api/stocksApi';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const StockAnalytics = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [customDate, setCustomDate] = useState(dayjs());
  const [customStartDate, setCustomStartDate] = useState(dayjs().startOf('week'));
  const [customEndDate, setCustomEndDate] = useState(dayjs().endOf('week'));
  
  const { 
    data: analytics, 
    isLoading: analyticsLoading,
    error: analyticsError
  } = useGetStockAnalyticsQuery();
  
  const { 
    data: history, 
    isLoading: historyLoading,
    error: historyError
  } = useGetStockHistoryQuery(timeRange);

  const handleTimeRangeChange = (event, newValue) => {
    setTimeRange(newValue);
  };

  const filterDataByDateRange = (data) => {
    if (!data) return [];
    
    let startDate, endDate;
    
    switch (timeRange) {
      case 'week':
        startDate = customStartDate.startOf('day');
        endDate = customEndDate.endOf('day');
        break;
      case 'month':
        startDate = customDate.startOf('month');
        endDate = customDate.endOf('month');
        break;
      case 'year':
        startDate = customDate.startOf('year');
        endDate = customDate.endOf('year');
        break;
      default:
        return data;
    }
    
    return data.filter(item => {
      const itemDate = dayjs(item.date);
      return itemDate.isSameOrAfter(startDate) && itemDate.isSameOrBefore(endDate);
    });
  };

  const formatDateRange = () => {
    switch (timeRange) {
      case 'week':
        return `${customStartDate.format('MMM D')} - ${customEndDate.format('MMM D, YYYY')}`;
      case 'month':
        return customDate.format('MMMM YYYY');
      case 'year':
        return customDate.format('YYYY');
      default:
        return '';
    }
  };

  // Prepare chart data
  const filteredHistory = filterDataByDateRange(history);
  const lowStockItems = analytics?.lowStockItemsList || [];
  const categoryData = analytics?.byCategory || [];

  // Prepare data for stock movement chart
  const movementData = filteredHistory.map(item => ({
    ...item,
    totalChange: Number(item.totalChange)
  }));

  if (analyticsLoading || historyLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (analyticsError || historyError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography color="error">
            Error loading analytics data: {analyticsError?.data?.message || historyError?.data?.message || 'Unknown error'}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Typography
          component="h1"
          variant="h3"
          color="inherit"
          noWrap
          sx={{ flexGrow: 1, mb: 4 }}
        >
          <AnalyticsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Stock Analytics
        </Typography>

        {/* Time range selector */}
        <Box sx={{ mb: 3 }}>
          <Tabs 
            value={timeRange} 
            onChange={handleTimeRangeChange} 
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Week" value="week" />
            <Tab label="Month" value="month" />
            <Tab label="Year" value="year" />
          </Tabs>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {timeRange === 'week' && (
              <>
                <DatePicker
                  label="Start Date"
                  value={customStartDate}
                  onChange={(newValue) => setCustomStartDate(newValue)}
                  renderInput={(params) => <TextField {...params} />}
                />
                <DatePicker
                  label="End Date"
                  value={customEndDate}
                  onChange={(newValue) => setCustomEndDate(newValue)}
                  minDate={customStartDate}
                  renderInput={(params) => <TextField {...params} />}
                />
              </>
            )}
            
            {(timeRange === 'month' || timeRange === 'year') && (
              <DatePicker
                label={`Select ${timeRange === 'month' ? 'Month' : 'Year'}`}
                value={customDate}
                onChange={(newValue) => setCustomDate(newValue)}
                views={timeRange === 'month' ? ['year', 'month'] : ['year']}
                openTo={timeRange === 'month' ? 'month' : 'year'}
                renderInput={(params) => <TextField {...params} />}
              />
            )}
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Inventory Value
                </Typography>
                <Typography variant="h4">
                  {new Intl.NumberFormat('en-PH', {
                    style: 'currency',
                    currency: 'PHP'
                  }).format(analytics?.overall?.totalValue || 0)}
                </Typography>
                {timeRange !== 'all' && (
                  <Typography variant="caption" color="textSecondary">
                    {formatDateRange()}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Items
                </Typography>
                <Typography variant="h4">
                  {analytics?.overall?.totalItems || 0}
                </Typography>
                {timeRange !== 'all' && (
                  <Typography variant="caption" color="textSecondary">
                    {formatDateRange()}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Low Stock Items (≤5)
                </Typography>
                <Typography variant="h4" color="error">
                  {analytics?.overall?.lowStockItems || 0}
                </Typography>
                {timeRange !== 'all' && (
                  <Typography variant="caption" color="textSecondary">
                    {formatDateRange()}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Categories
                </Typography>
                <Typography variant="h4">
                  {categoryData.length}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Active categories
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Category Distribution */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Inventory by Category
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, value }) => `${category}: ${new Intl.NumberFormat('en-PH', {
                      style: 'currency',
                      currency: 'PHP'
                    }).format(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalValue"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [new Intl.NumberFormat('en-PH', {
                      style: 'currency',
                      currency: 'PHP'
                    }).format(value), 'Value']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Items per Category */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Items per Category
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={categoryData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalItems" fill="#8884d8" name="Number of Items" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Stock Movement Trends */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Stock Movement Trends ({timeRange})
                {timeRange !== 'all' && (
                  <Typography variant="subtitle2" color="textSecondary">
                    {formatDateRange()}
                  </Typography>
                )}
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={movementData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(date) => {
                      if (timeRange === 'year') {
                        return date.split('-')[1]; // Show just month for year view
                      }
                      return date.split('-').slice(1).join('-'); // Show day/month for week/month views
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [`${value} items`, name === 'restock' ? 'Restocks' : 'Usage']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalChange"
                    name="restock"
                    stroke="#00C49F"
                    strokeWidth={2}
                    dot={{ fill: '#00C49F', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    data={movementData.filter(item => item.operation === 'restock')}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalChange"
                    name="usage"
                    stroke="#FF8042"
                    strokeWidth={2}
                    dot={{ fill: '#FF8042', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    data={movementData.filter(item => item.operation === 'usage')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Low Stock Items */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Low Stock Items (Quantity ≤ 5)
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lowStockItems.length > 0 ? (
                      lowStockItems.map((item) => (
                        <TableRow key={item._id} hover>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('en-PH', {
                              style: 'currency',
                              currency: 'PHP'
                            }).format(item.price)}
                          </TableCell>
                          <TableCell sx={{ 
                            color: item.quantity <= 2 ? 'error.main' : 'warning.main',
                            fontWeight: 'bold'
                          }}>
                            {item.quantity}
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: item.quantity <= 2 ? 'error.main' : 'warning.main',
                                fontWeight: 'bold'
                              }}
                            >
                              {item.quantity <= 2 ? 'CRITICAL' : 'LOW'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No low stock items
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default StockAnalytics;