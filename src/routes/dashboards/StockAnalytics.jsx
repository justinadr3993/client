import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useFetchStockAnalyticsQuery, useFetchStockHistoryQuery } from '../../services/api/stocksApi';
import DashboardLayout from '../../layouts/DashboardLayout';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StockAnalytics = () => {
  const [timeframe, setTimeframe] = useState('month');
  
  const { 
    data: analytics, 
    isLoading: analyticsLoading, 
    isError: analyticsError 
  } = useFetchStockAnalyticsQuery();
  
  const { 
    data: history, 
    isLoading: historyLoading, 
    isError: historyError 
  } = useFetchStockHistoryQuery(timeframe);

  if (analyticsLoading || historyLoading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (analyticsError || historyError) {
    return (
      <DashboardLayout>
        <Alert severity="error">
          Failed to load analytics data
        </Alert>
      </DashboardLayout>
    );
  }

  const { overall, byCategory, lowStockItemsList, trends } = analytics;

  // Category distribution chart
  const categoryChartData = {
    labels: byCategory?.map(cat => cat.category) || [],
    datasets: [
      {
        label: 'Total Value (₱)',
        data: byCategory?.map(cat => cat.totalValue) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Stock usage trends
  const usageTrends = trends?.filter(trend => trend.operation === 'usage') || [];
  const restockTrends = trends?.filter(trend => trend.operation === 'restock') || [];

  const trendsChartData = {
    labels: usageTrends.map(trend => trend.category),
    datasets: [
      {
        label: 'Usage',
        data: usageTrends.map(trend => trend.totalChange),
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'Restock',
        data: restockTrends.map(trend => trend.totalChange),
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  // History chart data
  const historyByDate = {};
  history?.forEach(item => {
    if (!historyByDate[item.date]) {
      historyByDate[item.date] = { usage: 0, restock: 0 };
    }
    historyByDate[item.date][item.operation] += item.totalChange;
  });

  const historyDates = Object.keys(historyByDate).sort();
  const historyChartData = {
    labels: historyDates,
    datasets: [
      {
        label: 'Usage',
        data: historyDates.map(date => historyByDate[date].usage),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Restock',
        data: historyDates.map(date => historyByDate[date].restock),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" gutterBottom>
            Stock Analytics
          </Typography>
          
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              label="Timeframe"
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Overall Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Stock Value
                </Typography>
                <Typography variant="h4" component="div">
                  ₱{(overall?.totalValue || 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Items
                </Typography>
                <Typography variant="h4" component="div">
                  {overall?.totalItems || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Low Stock Items
                </Typography>
                <Typography variant="h4" component="div" color="error">
                  {overall?.lowStockItems || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Item Value
                </Typography>
                <Typography variant="h4" component="div">
                  ₱{(overall?.averageStockValue || 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Stock Value by Category
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Bar 
                    data={categoryChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Stock Movement Trends
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Line 
                    data={historyChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Low Stock Items */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Low Stock Items
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Current</TableCell>
                        <TableCell align="right">Minimum</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lowStockItemsList?.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>
                            <Chip label={item.category} size="small" />
                          </TableCell>
                          <TableCell align="right">
                            <Typography color="error">
                              {item.quantity}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{item.minStockLevel}</TableCell>
                        </TableRow>
                      ))}
                      {(!lowStockItemsList || lowStockItemsList.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography color="textSecondary">
                              No low stock items
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Category Performance
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Items</TableCell>
                        <TableCell align="right">Total Value</TableCell>
                        <TableCell align="right">Low Stock</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {byCategory?.map((category) => (
                        <TableRow key={category.category}>
                          <TableCell>
                            <Chip label={category.category} size="small" />
                          </TableCell>
                          <TableCell align="right">{category.totalItems}</TableCell>
                          <TableCell align="right">
                            ₱{category.totalValue.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            {category.lowStockItems > 0 ? (
                              <Chip 
                                label={category.lowStockItems} 
                                color="error" 
                                size="small" 
                              />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default StockAnalytics;