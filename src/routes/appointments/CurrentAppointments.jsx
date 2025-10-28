// CurrentAppointments.jsx - Updated with days left in error message
import { useState, useMemo, useRef } from "react";
import {
  Box,
  Button,
  Badge,
  MenuItem,
  IconButton,
  Menu,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
  Alert,
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import {
  useUpdateAppointmentMutation,
} from "../../services/api/appointmentsApi";
import { useFetchServiceByIdQuery } from "../../services/api/servicesApi";
import { useFetchServiceCategoryByIdQuery } from "../../services/api/serviceCategoriesApi";
import dayjs from "dayjs";
import AppointmentDetailsModal from "./AppointmentDetailsModal";
import { useSelector } from "react-redux";

const CurrentAppointments = ({ 
  appointmentsData, 
  isLoading, 
  refetch, 
  user,
  alert,
  setAlert 
}) => {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));
  
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100,
  });
  
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [statusChangeDialog, setStatusChangeDialog] = useState({
    open: false,
    appointmentId: null,
    newStatus: null,
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [redTagAlert, setRedTagAlert] = useState(null);

  const [updateAppointment] = useUpdateAppointmentMutation();

  // Check if user is red tagged and calculate days left
  const redTagInfo = useMemo(() => {
    if (currentUser?.isRedTagged && currentUser?.redTagExpiresAt && dayjs().isBefore(dayjs(currentUser.redTagExpiresAt))) {
      const daysLeft = dayjs(currentUser.redTagExpiresAt).diff(dayjs(), 'day');
      return {
        isRedTagged: true,
        daysLeft: daysLeft + 1 // Add 1 to include the current day
      };
    }
    return {
      isRedTagged: false,
      daysLeft: 0
    };
  }, [currentUser]);

  const handleCreateNewAppointment = () => {
    if (redTagInfo.isRedTagged) {
      setRedTagAlert({
        type: "error",
        message: `Your account is temporarily restricted from booking appointments due to previous no-show incidents. Restricted ${redTagInfo.daysLeft} days left.`,
      });
    } else {
      navigate("/appointments/create");
    }
  };

  // filter for current appointments (Upcoming and Rescheduled)
  const currentAppointments = useMemo(
    () =>
      (appointmentsData?.results || [])
        .filter(appt => ["Upcoming", "Rescheduled"].includes(appt.status))
        .sort((a, b) => new Date(a.appointmentDateTime) - new Date(b.appointmentDateTime)),
    [appointmentsData]
  );

  const columns = [
    ...((user?.role === "admin" || user?.role === "staff") ? [
      {
        field: "fullName",
        headerName: "Full Name",
        width: 180,
        renderCell: (params) => `${params.row.firstName} ${params.row.lastName}`,
      },
    ] : []),
    {
      field: "serviceType",
      headerName: "Service",
      width: 180,
      renderCell: (params) => {
        const { data: service } = useFetchServiceByIdQuery(params.row.serviceType);
        return service ? service.title : "Loading...";
      },
    },
    {
      field: "serviceCategory",
      headerName: "Category",
      width: 140,
      renderCell: (params) => {
        const { data: category } = useFetchServiceCategoryByIdQuery(params.row.serviceCategory);
        return category ? category.name : "Loading...";
      },
    },
    {
      field: "price",
      headerName: "Price",
      width: 100,
      renderCell: (params) => {
        const { data: service } = useFetchServiceByIdQuery(params.row.serviceType);
        return service ? `₱${service.price}` : "Loading...";
      },
    },
    {
      field: "appointmentDateTime",
      headerName: "Date & Time",
      width: 150,
      renderCell: (params) =>
        dayjs(params.row.appointmentDateTime).format("DD/MM/YYYY HH:mm"),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleViewDetails(params.row)}
            sx={{ mr: 1 }}
          >
            View
          </Button>
          
          {(user?.role === "admin" || user?.role === "staff") && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => handleEdit(params.row.id)}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
          )}
          
          <IconButton
            aria-label="more"
            aria-controls="long-menu"
            aria-haspopup="true"
            onClick={(e) => handleMenuOpen(e, params.row)}
          >
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            id="long-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl && currentAppointment?.id === params.row.id)}
            onClose={handleMenuClose}
          >
            {(user?.role === "admin" || user?.role === "staff") && [
              <MenuItem key="complete" onClick={() => handleStatusChange("Completed")}>
                Mark as Completed
              </MenuItem>,
              <MenuItem key="cancel" onClick={() => handleStatusChange("Cancelled")}>
                Mark as Cancelled
              </MenuItem>,
              <MenuItem key="no-arrival" onClick={() => handleStatusChange("No Arrival")}>
                Mark as No Arrival
              </MenuItem>,
            ]}
            {user?.role === "user" && (
              <MenuItem key="user-cancel" onClick={() => {
                handleMenuClose();
                handleOpenDialog(params.row);
              }}>
                Cancel Appointment
              </MenuItem>
            )}
          </Menu>
        </Box>
      ),
    },
  ];

  const handleMenuOpen = (event, appointment) => {
    setAnchorEl(event.currentTarget);
    setCurrentAppointment(appointment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setCurrentAppointment(null);
  };

  const handleStatusChange = (newStatus) => {
    if (currentAppointment) {
      if (['Completed', 'Cancelled', 'No Arrival'].includes(currentAppointment.status)) {
        setAlert({
          message: `Cannot change status of an appointment that is already ${currentAppointment.status}`,
          severity: "error",
        });
        handleMenuClose();
        return;
      }

      setStatusChangeDialog({
        open: true,
        appointmentId: currentAppointment.id,
        newStatus,
      });
      handleMenuClose();
    }
  };

  const confirmStatusChange = async () => {
    try {
      await updateAppointment({
        id: statusChangeDialog.appointmentId,
        status: statusChangeDialog.newStatus,
      }).unwrap();
      refetch();
      setStatusChangeDialog({ open: false, appointmentId: null, newStatus: null });
      
      if (statusChangeDialog.newStatus === 'No Arrival') {
        setAlert({
          message: "Appointment marked as No Arrival. User has been red tagged and restricted from booking for 3 days.",
          severity: "warning",
        });
      } else {
        setAlert({
          message: `Appointment status updated to ${statusChangeDialog.newStatus} successfully!`,
          severity: "success",
        });
      }
    } catch (error) {
      setAlert({
        message: `Error updating status: ${error.message}`,
        severity: "error",
      });
    }
  };

  const cancelStatusChange = () => {
    setStatusChangeDialog({ open: false, appointmentId: null, newStatus: null });
  };

  const handleEdit = (id) => {
    navigate(`/appointments/edit/${id}`);
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setOpenDetailsModal(true);
  };

  const handleOpenDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAppointment(null);
  };

  const handleCancel = async () => {
    if (selectedAppointment) {
      try {
        await updateAppointment({
          id: selectedAppointment.id,
          status: "Cancelled",
        }).unwrap();
        setOpenDialog(false);
        refetch();
        setAlert({
          message: "Appointment cancelled successfully!",
          severity: "success",
        });
      } catch (error) {
        setAlert({
          message: `Error cancelling appointment: ${error.message}`,
          severity: "error",
        });
      }
    }
  };

  return (
    <Box sx={{ height: 650, width: "100%" }}>
      {redTagAlert && (
        <Alert severity={redTagAlert.type} sx={{ mb: 2 }}>
          {redTagAlert.message}
        </Alert>
      )}
      
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
            onClick={handleCreateNewAppointment}
          >
            Create New Appointment
          </Button>
        )}
      </Box>
      <DataGrid
        rows={currentAppointments}
        columns={columns}
        rowCount={currentAppointments.length}
        loading={isLoading}
        paginationMode="client"
        pageSizeOptions={[15, 30, 50]}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        disableSelectionOnClick
      />
      
      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Cancel Appointment
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to cancel the appointment for {selectedAppointment?.firstName} {selectedAppointment?.lastName}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            No
          </Button>
          <Button
            onClick={handleCancel}
            color="secondary"
            autoFocus
          >
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Status Change Confirmation Dialog */}
      <Dialog
        open={statusChangeDialog.open}
        onClose={cancelStatusChange}
        aria-labelledby="status-change-dialog-title"
      >
        <DialogTitle id="status-change-dialog-title">
          Confirm Status Change
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {statusChangeDialog.newStatus === 'No Arrival' ? (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This action will red tag the user and restrict them from booking new appointments for 3 days.
                </Alert>
                Are you sure you want to mark this appointment as "No Arrival"?
              </Box>
            ) : (
              `Are you sure you want to change this appointment's status to "${statusChangeDialog.newStatus}"?`
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelStatusChange} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmStatusChange} color="secondary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      
      <AppointmentDetailsModal
        open={openDetailsModal}
        onClose={() => setOpenDetailsModal(false)}
        appointment={selectedAppointment}
      />
    </Box>
  );
};

export default CurrentAppointments; 