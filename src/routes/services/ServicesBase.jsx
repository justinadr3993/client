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
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useFetchServicesQuery,
  useDeleteServiceMutation,
} from "../../services/api/servicesApi";
import { useFetchServiceCategoryByIdQuery } from "../../services/api/serviceCategoriesApi";
import FadeAlert from "../../components/FadeAlert/FadeAlert";
import DashboardLayout from "../../layouts/DashboardLayout";
import { ButtonsContainer } from "./ServiceBase.styles";

const ServicesBase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 15,
  });

  const { 
    data: servicesData = { results: [], totalResults: 0 }, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useFetchServicesQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
  });

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

  const CategoryCell = ({ categoryId }) => {
    const { data: category, isLoading: categoryLoading } = useFetchServiceCategoryByIdQuery(categoryId);
    
    if (categoryLoading) return "Loading...";
    return category ? category.name : "Unknown Category";
  };

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
          message: `Error deleting service: ${error.data?.message || error.message}`,
          severity: "error",
        });
      }
    }
  };

  const columns = [
    { field: "title", headerName: "Title", width: 150 },
    {
      field: "category",
      headerName: "Category",
      width: 150,
      renderCell: (params) => <CategoryCell categoryId={params.row.category} />,
    },
    { 
      field: "price", 
      headerName: "Price", 
      width: 100, 
      renderCell: (params) => `₱${params.row.price}` 
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      renderCell: (params) => (
        <Box>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleEdit(params.row.id)}
            sx={{ mr: 1 }}
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
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <Typography color="error">
          Error loading services: {error?.data?.message || "Unknown error"}
        </Typography>
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
          rows={servicesData.results}
          columns={columns}
          rowCount={servicesData.totalResults || 0}
          loading={isLoading}
          paginationMode="server"
          pageSizeOptions={[15, 50, 100]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          disableSelectionOnClick
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