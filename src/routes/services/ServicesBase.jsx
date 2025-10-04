import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useFetchServicesQuery,
  useDeleteServiceMutation,
} from "../../services/api/servicesApi";
import { useFetchServiceCategoriesQuery } from "../../services/api/serviceCategoriesApi";
import FadeAlert from "../../components/FadeAlert/FadeAlert";
import DashboardLayout from "../../layouts/DashboardLayout";
import { ButtonsContainer } from "./ServiceBase.styles";

const ServicesBase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100,
  });

  const { 
    data: servicesData = [], 
    isLoading, 
    isError, 
    refetch 
  } = useFetchServicesQuery();

  const { data: categoriesData = [] } = useFetchServiceCategoriesQuery();

  const [deleteService] = useDeleteServiceMutation();
  const [selectedService, setSelectedService] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [alert, setAlert] = useState(location.state?.alert || null);

  useEffect(() => {
    if (location.state?.alert) {
      setAlert(location.state.alert);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleEdit = (id) => {
    navigate(`/manage-services/edit/${id}`);
  };

  const handleOpenDialog = (service) => {
    setSelectedService(service);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedService(null);
  };

  const handleAlertClose = () => {
    setAlert(null);
  };

  const handleDelete = async () => {
    if (selectedService) {
      try {
        await deleteService(selectedService.id).unwrap();
        setOpenDialog(false);
        refetch();
        setAlert({
          message: "Service deleted successfully!",
          severity: "success",
        });
      } catch (error) {
        setAlert({
          message: `Error deleting service: ${error.message}`,
          severity: "error",
        });
      }
    }
  };

  // Create a map of category IDs to category names for easy lookup
  const categoryMap = {};
  if (categoriesData.results || categoriesData) {
    const categories = categoriesData.results || categoriesData;
    categories.forEach(category => {
      categoryMap[category.id] = category.name;
    });
  }

  const getCategoryName = (categoryId) => {
    if (typeof categoryId === 'object' && categoryId.name) {
      return categoryId.name; // If category is populated as an object
    }
    return categoryMap[categoryId] || categoryId || "Unknown Category";
  };

  const columns = [
    { 
      field: "title", 
      headerName: "Title", 
      width: 200,
      flex: 1,
      minWidth: 200,
    },
    {
      field: "category",
      headerName: "Category",
      width: 180,
      flex: 1,
      minWidth: 180,
      renderCell: (params) => {
        return getCategoryName(params.row.category);
      },
    },
    { 
      field: "price", 
      headerName: "Price", 
      width: 120,
      flex: 0.5,
      minWidth: 120,
      renderCell: (params) => `₱${params.row.price}` 
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      flex: 0.8,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleEdit(params.row.id)}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => handleOpenDialog(params.row)}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <Typography>Loading services...</Typography>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <Typography color="error">Error loading services</Typography>
        <Button onClick={refetch} variant="contained" sx={{ mt: 2 }}>
          Retry
        </Button>
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
      <Typography variant="h4" gutterBottom>
        Manage Services
      </Typography>
      <Box sx={{ height: 650, width: "100%" }}>
        <ButtonsContainer>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/manage-services/create")}
          >
            Add New Service
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate("/manage-service-categories/")}
          >
            Manage Categories
          </Button>
        </ButtonsContainer>
        <DataGrid
          rows={servicesData.results || servicesData || []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[15, 30, 50, 100]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell': {
              padding: '8px 12px',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
            },
          }}
        />
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Delete Service</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the service{" "}
              <strong>{selectedService?.title}</strong>?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">
              Cancel
            </Button>
            <Button onClick={handleDelete} color="secondary" autoFocus>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default ServicesBase;