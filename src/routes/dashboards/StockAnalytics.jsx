import React, { useState, useMemo } from 'react';
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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip
} from '@mui/material';
import { 
  useGetStockAnalyticsQuery,
  useGetStockHistoryQuery,
  useFetchStocksQuery,
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
  Line
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const StockAnalytics = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [customDate, setCustomDate] = useState(dayjs());
  const [customStartDate, setCustomStartDate] = useState(dayjs().startOf('week'));
  const [customEndDate, setCustomEndDate] = useState(dayjs().endOf('week'));
  
  // Modal state for line click
  const [selectedLineData, setSelectedLineData] = useState(null);
  const [openLineDetails, setOpenLineDetails] = useState(false);
  
  const { 
    data: analytics, 
    isLoading: analyticsLoading,
    refetch: refetchAnalytics
  } = useGetStockAnalyticsQuery();
  
  const { 
    data: history, 
    isLoading: historyLoading,
    refetch: refetchHistory
  } = useGetStockHistoryQuery(timeRange);

  const { 
    data: stocksData,
    isLoading: stocksLoading,
    refetch: refetchStocks
  } = useFetchStocksQuery({ limit: 1000 });

  const handleTimeRangeChange = (event, newValue) => {
    setTimeRange(newValue);
  };

  // Refetch all data when timeframe changes
  React.useEffect(() => {
    refetchHistory();
    refetchAnalytics();
    refetchStocks();
  }, [timeRange, refetchHistory, refetchAnalytics, refetchStocks]);

  // Filter history data based on selected date range
  const filteredHistory = useMemo(() => {
    if (!history) return [];

    return history.filter(item => {
      // Parse the date from API (already in Asia/Manila timezone from server)
      let itemDate;
      
      if (item.date.includes('-')) {
        // Handle YYYY-MM-DD or YYYY-MM format
        if (item.date.length === 10) { // YYYY-MM-DD
          itemDate = dayjs(item.date, 'Asia/Manila');
        } else { // YYYY-MM
          itemDate = dayjs(`${item.date}-01`, 'Asia/Manila');
        }
      } else {
        itemDate = dayjs(item.date, 'Asia/Manila');
      }
      
      switch (timeRange) {
        case 'week':
          const startWeek = customStartDate.startOf('day');
          const endWeek = customEndDate.endOf('day');
          return itemDate.isSameOrAfter(startWeek) && itemDate.isSameOrBefore(endWeek);
        case 'month':
          const selectedMonth = customDate.startOf('month');
          const endOfMonth = customDate.endOf('month');
          return itemDate.isSameOrAfter(selectedMonth) && itemDate.isSameOrBefore(endOfMonth);
        case 'year':
          const selectedYear = customDate.startOf('year');
          const endOfYear = customDate.endOf('year');
          return itemDate.isSameOrAfter(selectedYear) && itemDate.isSameOrBefore(endOfYear);
        default:
          return true;
      }
    });
  }, [history, timeRange, customDate, customStartDate, customEndDate]);

  const prepareChartData = () => {
    if (!filteredHistory || filteredHistory.length === 0) return [];

    const groupedData = {};
    
    filteredHistory.forEach(item => {
      const dateKey = item.date;
      
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          restock: 0,
          usage: 0,
          restockDetails: [],
          usageDetails: []
        };
      }
      
      if (item.operation === 'restock') {
        groupedData[dateKey].restock += item.totalChange;
        groupedData[dateKey].restockDetails.push({
          ...item,
          change: item.totalChange,
          stockId: item.stockId,
          stockType: item.stockType,
          stockCategory: item.stockCategory,
          price: item.price
        });
      } else if (item.operation === 'usage') {
        groupedData[dateKey].usage += item.totalChange;
        groupedData[dateKey].usageDetails.push({
          ...item,
          change: item.totalChange,
          stockId: item.stockId,
          stockType: item.stockType,
          stockCategory: item.stockCategory,
          price: item.price
        });
      }
    });

    // Convert to array and sort by date
    const result = Object.values(groupedData).sort((a, b) => {
      // Handle both YYYY-MM and YYYY-MM-DD formats
      if (a.date.length === 7 && b.date.length === 7) {
        // YYYY-MM format (year view)
        return a.date.localeCompare(b.date);
      } else {
        // YYYY-MM-DD format (week/month view)
        return a.date.localeCompare(b.date);
      }
    });

    return result;
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
        return 'All Time';
    }
  };

  // Handle line click
  const handleLineClick = (data) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedData = data.activePayload[0].payload;
      setSelectedLineData(clickedData);
      setOpenLineDetails(true);
    }
  };

  // Get stock details for the clicked date
  const getStockDetails = () => {
    if (!selectedLineData) return { restock: [], usage: [] };
    
    return {
      restock: selectedLineData.restockDetails || [],
      usage: selectedLineData.usageDetails || []
    };
  };

  // Get stock name by ID
  const getStockName = (stockId, stockType) => {
    if (!stocksData?.results) return stockType || `Stock ID: ${stockId}`;
    
    const stock = stocksData.results.find(s => s._id === stockId);
    return stock ? stock.type : stockType || `Stock ID: ${stockId}`;
  };

  // Get stock category by ID
  const getStockCategory = (stockId, stockCategory) => {
    if (!stocksData?.results) return stockCategory || 'Unknown';
    
    const stock = stocksData.results.find(s => s._id === stockId);
    return stock ? stock.category : stockCategory || 'Unknown';
  };

  // Format X-axis labels based on time range
  const formatXAxisLabel = (date) => {
    if (timeRange === 'year') {
      // For year view, show month names
      const [year, month] = date.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames[parseInt(month) - 1];
    } else {
      // For week/month view, show day/month
      const parts = date.split('-');
      if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}`; // MM/DD format
      }
      return date;
    }
  };

  if (analyticsLoading || historyLoading || stocksLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Prepare data for charts
  const chartData = prepareChartData();
  const lowStockItems = analytics?.lowStockItemsList || [];

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
          <Grid item xs={12} md={4}>
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
                <Typography variant="caption" color="textSecondary">
                  Current Inventory
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Items
                </Typography>
                <Typography variant="h4">
                  {analytics?.overall?.totalItems || 0}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Current Inventory
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Low Stock Items (≤5)
                </Typography>
                <Typography variant="h4" color="error">
                  {analytics?.overall?.lowStockItems || 0}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Current Inventory
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Stock Movement Trends */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Stock Movement Trends ({timeRange})
                <Typography variant="subtitle2" color="textSecondary">
                  {formatDateRange()}
                </Typography>
              </Typography>
              
              {chartData.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                  <Typography variant="h6" color="textSecondary">
                    No stock movement data available for the selected period
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    onClick={handleLineClick}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={formatXAxisLabel}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'restock') {
                          return [`${value} items`, 'Restocks'];
                        } else if (name === 'usage') {
                          return [`${value} items`, 'Usage'];
                        }
                        return [`${value} items`, name];
                      }}
                      labelFormatter={(label) => {
                        if (timeRange === 'year') {
                          const [year, month] = label.split('-');
                          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                            'July', 'August', 'September', 'October', 'November', 'December'];
                          return `Month: ${monthNames[parseInt(month) - 1]} ${year}`;
                        }
                        return `Date: ${label}`;
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="restock"
                      stroke="#00C49F"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                      name="Restocks"
                    />
                    <Line
                      type="monotone"
                      dataKey="usage"
                      stroke="#FF8042"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                      name="Usage"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Line Details Modal */}
        <Dialog
          open={openLineDetails}
          onClose={() => setOpenLineDetails(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Stock Movement Details for {selectedLineData?.date}
          </DialogTitle>
          <DialogContent>
            {selectedLineData && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Total Restocks: {selectedLineData.restock} items
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  Total Usage: {selectedLineData.usage} items
                </Typography>
                
                {/* Restock Details */}
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Restock Details
                </Typography>
                
                {getStockDetails().restock.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Stock Item</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Operation</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getStockDetails().restock.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {getStockName(item.stockId, item.stockType)}
                            </TableCell>
                            <TableCell>
                              {getStockCategory(item.stockId, item.stockCategory)}
                            </TableCell>
                            <TableCell align="right">{item.change}</TableCell>
                            <TableCell align="right">
                              {new Intl.NumberFormat('en-PH', {
                                style: 'currency',
                                currency: 'PHP'
                              }).format(item.price || 0)}
                            </TableCell>
                            <TableCell align="right">
                              <Chip 
                                label="Restock" 
                                color="success" 
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No restocks recorded for this date.
                  </Typography>
                )}

                {/* Usage Details */}
                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                  Usage Details
                </Typography>
                
                {getStockDetails().usage.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Stock Item</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Operation</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getStockDetails().usage.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {getStockName(item.stockId, item.stockType)}
                            </TableCell>
                            <TableCell>
                              {getStockCategory(item.stockId, item.stockCategory)}
                            </TableCell>
                            <TableCell align="right">{item.change}</TableCell>
                            <TableCell align="right">
                              {new Intl.NumberFormat('en-PH', {
                                style: 'currency',
                                currency: 'PHP'
                              }).format(item.price || 0)}
                            </TableCell>
                            <TableCell align="right">
                              <Chip 
                                label="Usage" 
                                color="warning" 
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No usage recorded for this date.
                  </Typography>
                )}

              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenLineDetails(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Low Stock Items */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Low Stock Items (Quantity ≤ 5)
              </Typography>
              
              {lowStockItems.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No low stock items. Great job!
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item Name</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Current Quantity</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lowStockItems.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            {new Intl.NumberFormat('en-PH', {
                              style: 'currency',
                              currency: 'PHP'
                            }).format(item.price)}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={item.quantity === 0 ? 'Out of Stock' : 'Low Stock'} 
                              color={item.quantity === 0 ? 'error' : 'warning'} 
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default StockAnalytics;