import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  useFetchStocksQuery, 
  useDeleteStockMutation,
} from "../../services/api/stocksApi";
import DashboardLayout from "../../layouts/DashboardLayout";
import { ButtonsContainer } from "./StocksBase.styles";
import FadeAlert from "../../components/FadeAlert/FadeAlert";
import AnalyticsIcon from '@mui/icons-material/Analytics';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';

const StocksBase = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 15,
  });

  const [filters, setFilters] = useState({
    category: '',
    lowStock: false
  });

  const { 
    data: stocksData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useFetchStocksQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
    ...filters
  });
  
  const [deleteStock] = useDeleteStockMutation();
  const [selectedStock, setSelectedStock] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [alert, setAlert] = useState(location.state?.alert || null);

  useEffect(() => {
    if (location.state?.alert) {
      setAlert(location.state.alert);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (isError) {
      setAlert({
        severity: "error",
        message: error?.data?.message || "Failed to load stock items",
      });
    }
  }, [isError, error]);

  const handleEdit = (id) => {
    navigate(`/manage-stocks/edit/${id}`);
  };

  const handleOpenDialog = (stock) => {
    setSelectedStock(stock);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStock(null);
  };

  const handleAlertClose = () => {
    setAlert(null);
  };

  const handleDelete = async () => {
    if (selectedStock) {
      try {
        await deleteStock(selectedStock._id).unwrap();
        setOpenDialog(false);
        setAlert({
          severity: "success",
          message: "Stock item deleted successfully!",
        });
        refetch();
      } catch (error) {
        setAlert({
          severity: "error",
          message: error?.data?.message || "Failed to delete stock item",
        });
      }
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  const columns = [
    { 
      field: "type",
      headerName: "Item Name", 
      width: 200,
      flex: 1 
    },
    { 
      field: "category", 
      headerName: "Category", 
      width: 120 
    },
    { 
      field: "price", 
      headerName: "Price", 
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          ₱{(params.row.price || 0).toFixed(2)}
        </Typography>
      )
    },
    { 
      field: "quantity", 
      headerName: "Quantity",
      width: 120,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2">{params.row.quantity || 0}</Typography>
          {params.row.quantity <= (params.row.minStockLevel || 5) && (
            <Tooltip title="Low Stock">
              <WarningIcon color="error" fontSize="small" />
            </Tooltip>
          )}
        </Box>
      )
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.row.quantity <= (params.row.minStockLevel || 5) ? "Low Stock" : "In Stock"}
          color={params.row.quantity <= (params.row.minStockLevel || 5) ? "error" : "success"}
          size="small"
        />
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => handleEdit(params.row._id)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(params.row)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {alert && (
        <FadeAlert
          message={alert.message}
          severity={alert.severity}
          duration={3000}
          onClose={handleAlertClose}
        />
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Manage Stock
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AnalyticsIcon />}
          onClick={() => navigate("/stock-analytics")}
        >
          View Analytics
        </Button>
      </Box>
      
      <ButtonsContainer>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/manage-stocks/create")}
          >
            Add New Stock Item
          </Button>
          
          <Button
            variant={filters.lowStock ? "contained" : "outlined"}
            color="warning"
            onClick={() => handleFilterChange({ ...filters, lowStock: !filters.lowStock })}
          >
            Low Stock Only
          </Button>

          <Button
            variant={filters.category === '' ? "contained" : "outlined"}
            onClick={() => handleFilterChange({ ...filters, category: '' })}
          >
            All Categories
          </Button>

          {['Oil', 'Tire', 'Brake', 'Filter', 'Battery'].map(category => (
            <Button
              key={category}
              variant={filters.category === category ? "contained" : "outlined"}
              onClick={() => handleFilterChange({ ...filters, category })}
            >
              {category}
            </Button>
          ))}
        </Box>
      </ButtonsContainer>

      <Box sx={{ height: 650, width: "100%", mt: 2 }}>
        {isError ? (    
          <Alert severity="error" sx={{ mb: 2 }}>
            {error?.data?.message || "Failed to load stock items"}
            <Button onClick={() => refetch()} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        ) : (
          <DataGrid
            rows={stocksData?.results || []}
            columns={columns}
            loading={isLoading}
            rowCount={stocksData?.totalResults || 0}
            paginationMode="server"
            pageSizeOptions={[15, 50, 100]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            disableSelectionOnClick
            getRowId={(row) => row._id}
            sx={{
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid',
                borderColor: 'divider',
              },
            }}
          />
        )}
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Delete Stock Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedStock?.type}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default StocksBase;