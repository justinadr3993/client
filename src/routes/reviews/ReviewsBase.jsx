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
  Rating,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useFetchReviewsQuery,
  useDeleteReviewMutation,
} from "../../services/api/reviewsApi";
import { useFetchServiceByIdQuery } from "../../services/api/servicesApi";
import FadeAlert from "../../components/FadeAlert/FadeAlert";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import ReviewDetailsModal from "./ReviewDetailsModal";

const ReviewsBase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100
  });

  const [deleteReview] = useDeleteReviewMutation();
  const [selectedReview, setSelectedReview] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [alert, setAlert] = useState(null);

  const {
    data: reviewsData,
    isLoading,
    isError,
    refetch,
  } = useFetchReviewsQuery({
    page: paginationModel.page + 1,
    limit: paginationModel.pageSize,
  });

  useEffect(() => {
    if (location.state?.alert) {
      setAlert(location.state.alert);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const ServiceName = ({ serviceId }) => {
    const { data: service } = useFetchServiceByIdQuery(serviceId);
    return service ? service.title : "Loading...";
  };

  const handleViewDetails = (review) => {
    setSelectedReview(review);
    setOpenDetailsModal(true);
  };

  const handleOpenDialog = (review) => {
    setSelectedReview(review);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedReview(null);
  };

  const handleAlertClose = () => {
    setAlert(null);
  };

  const handleDelete = async () => {
    if (selectedReview) {
      try {
        await deleteReview(selectedReview.id).unwrap();
        setOpenDialog(false);
        refetch();
        setAlert({
          message: "Review deleted successfully!",
          severity: "success",
        });
      } catch (error) {
        setAlert({
          message: `Error deleting review: ${error.message}`,
          severity: "error",
        });
      }
    }
  };

  const columns = [
    {
      field: "name",
      headerName: "Reviewer",
      width: 150,
      flex: 1,
      minWidth: 150,
      renderCell: (params) => params.row.name,
    },
    {
      field: "serviceType",
      headerName: "Service",
      width: 180,
      flex: 1,
      minWidth: 180,
      renderCell: (params) => <ServiceName serviceId={params.row.serviceType} />,
    },
    {
      field: "rating",
      headerName: "Rating",
      width: 130,
      flex: 0.5,
      minWidth: 130,
      renderCell: (params) => (
        <Rating 
          value={params.row.rating} 
          precision={0.5} 
          readOnly 
          size="small" 
        />
      ),
    },
    {
      field: "date",
      headerName: "Review Date",
      width: 130,
      flex: 0.5,
      minWidth: 130,
      renderCell: (params) =>
        dayjs(params.row.date).format("DD/MM/YYYY"),
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
            onClick={() => (user?.role === "admin" || user?.role === "staff") ? handleViewDetails(params.row) : navigate(`/reviews/edit/${params.row.id}`)}
          >
            {(user?.role === "admin" || user?.role === "staff") ? "View" : "Edit"}
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
        <Typography>Loading reviews...</Typography>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <Typography color="error">Error loading reviews</Typography>
        <Button onClick={refetch} variant="contained" sx={{ mt: 2 }}>
          Retry
        </Button>
      </DashboardLayout>
    );
  }

  // Show all reviews for admin and staff, only user's reviews for regular users
  const filteredReviews =
    (user?.role === "admin" || user?.role === "staff")
      ? reviewsData?.results || []
      : (reviewsData?.results || []).filter((review) => review.userId === user.id);

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
        {(user?.role === "admin" || user?.role === "staff") ? "Manage All Reviews" : "My Reviews"}
      </Typography>
      <Box sx={{ height: 650, width: "100%" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: isSmallScreen ? "flex-start" : "flex-end",
            mb: 2,
          }}
        >
          {user?.role === "user" && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/reviews/create")}
            >
              Write a Review
            </Button>
          )}
        </Box>
        <DataGrid
          rows={filteredReviews}
          columns={columns}
          rowCount={filteredReviews.length}
          loading={isLoading}
          paginationMode="client"
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

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Delete Review"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to delete the review for{" "}
              {selectedReview?.title}?
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
        
        <ReviewDetailsModal
          open={openDetailsModal}
          onClose={() => setOpenDetailsModal(false)}
          review={selectedReview}
        />
      </Box>
    </DashboardLayout>
  );
};

export default ReviewsBase;