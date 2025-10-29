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
  Chip,
} from '@mui/material';
import { 
  useGetStockAnalyticsQuery,
  useGetStockHistoryQuery,
  useFetchStocksQuery,
} from '../../services/api/stocksApi';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { 
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

  // Filter history data based on selected date range - FIXED TIMEZONE HANDLING
  const filteredHistory = useMemo(() => {
    if (!history) return [];

    return history.filter(item => {
      // Parse the actualDate from API (stored as UTC in MongoDB)
      const itemDate = dayjs(item.actualDate); // This is the UTC date from server
      
      // Convert filter dates to UTC for proper comparison
      switch (timeRange) {
        case 'day':
          const selectedDayStart = customDate.startOf('day').utc();
          const selectedDayEnd = customDate.endOf('day').utc();
          return itemDate.isSameOrAfter(selectedDayStart) && itemDate.isSameOrBefore(selectedDayEnd);
        case 'week':
          const startWeek = customStartDate.startOf('day').utc();
          const endWeek = customEndDate.endOf('day').utc();
          return itemDate.isSameOrAfter(startWeek) && itemDate.isSameOrBefore(endWeek);
        case 'month':
          const selectedMonthStart = customDate.startOf('month').utc();
          const selectedMonthEnd = customDate.endOf('month').utc();
          return itemDate.isSameOrAfter(selectedMonthStart) && itemDate.isSameOrBefore(selectedMonthEnd);
        case 'year':
          const selectedYearStart = customDate.startOf('year').utc();
          const selectedYearEnd = customDate.endOf('year').utc();
          return itemDate.isSameOrAfter(selectedYearStart) && itemDate.isSameOrBefore(selectedYearEnd);
        default:
          return true;
      }
    });
  }, [history, timeRange, customDate, customStartDate, customEndDate]);

  const prepareChartData = () => {
    if (!filteredHistory || filteredHistory.length === 0) return [];

    const groupedData = {};
    
    filteredHistory.forEach(item => {
      // Use the formatted date from server (already in Asia/Manila timezone)
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
      case 'day':
        return customDate.format('MMMM D, YYYY');
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
    } else if (timeRange === 'day') {
      // For day view, show time (if available) or just the date
      return date.split('-')[2]; // Show just the day
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
  const trends = analytics?.trends || [];

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
            <Tab label="Day" value="day" />
            <Tab label="Week" value="week" />
            <Tab label="Month" value="month" />
            <Tab label="Year" value="year" />
          </Tabs>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {timeRange === 'day' && (
              <DatePicker
                label="Select Date"
                value={customDate}
                onChange={(newValue) => setCustomDate(newValue)}
                renderInput={(params) => <TextField {...params} />}
              />
            )}
            
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
                Stock Movement Trends - {formatDateRange()}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Click on any point in the graph to view detailed stock movements for that date
              </Typography>
              
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    onClick={handleLineClick}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatXAxisLabel}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        value, 
                        name === 'restock' ? 'Restock' : 'Usage'
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend 
                      formatter={(value) => value === 'restock' ? 'Restock' : 'Usage'}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="restock" 
                      stroke="#00C49F" 
                      strokeWidth={3}
                      dot={{ r: 6 }}
                      activeDot={{ r: 8, onClick: handleLineClick }}
                      name="restock"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="usage" 
                      stroke="#FF8042" 
                      strokeWidth={3}
                      dot={{ r: 6 }}
                      activeDot={{ r: 8, onClick: handleLineClick }}
                      name="usage"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center" 
                  height={200}
                >
                  <Typography variant="body1" color="textSecondary">
                    No stock movement data available for the selected period
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Low Stock Items */}
        {lowStockItems.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom color="error">
                  Low Stock Items (≤5)
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item Name</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Current Quantity</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Status</TableCell>
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
                          <TableCell align="right">
                            <Chip 
                              label={item.quantity === 0 ? "Out of Stock" : "Low Stock"} 
                              color={item.quantity === 0 ? "error" : "warning"} 
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Stock Movement Details Modal - Updated to show stock items in tables */}
        <Dialog
          open={openLineDetails}
          onClose={() => setOpenLineDetails(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Stock Movement Details - {selectedLineData?.date}
          </DialogTitle>
          <DialogContent>
            {selectedLineData && (
              <>
                {/* Restocked Items */}
                {selectedLineData.restockDetails.length > 0 && (
                  <>
                    <Typography variant="h6" sx={{ mt: 1, mb: 2 }}>
                      Restocked Items
                    </Typography>
                    
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Stock Item</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedLineData.restockDetails.map((detail, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {getStockName(detail.stockId, detail.stockType)}
                              </TableCell>
                              <TableCell>
                                {getStockCategory(detail.stockId, detail.stockCategory)}
                              </TableCell>
                              <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                +{detail.change}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                {/* Usage Items */}
                {selectedLineData.usageDetails.length > 0 && (
                  <>
                    <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                      Usage Items
                    </Typography>
                    
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Stock Item</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedLineData.usageDetails.map((detail, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {getStockName(detail.stockId, detail.stockType)}
                              </TableCell>
                              <TableCell>
                                {getStockCategory(detail.stockId, detail.stockCategory)}
                              </TableCell>
                              <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                                -{detail.change}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                {selectedLineData.restockDetails.length === 0 && selectedLineData.usageDetails.length === 0 && (
                  <Typography variant="body1" color="textSecondary" align="center" sx={{ mt: 2 }}>
                    No stock movement data available for this date.
                  </Typography>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenLineDetails(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default StockAnalytics;