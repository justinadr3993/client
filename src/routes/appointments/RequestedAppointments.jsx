import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { DataGrid } from "@mui/x-data-grid";
import {
  useAcceptAppointmentMutation,
  useRejectAppointmentMutation,
} from "../../services/api/appointmentsApi";
import { useFetchServiceByIdQuery } from "../../services/api/servicesApi";
import { useFetchServiceCategoryByIdQuery } from "../../services/api/serviceCategoriesApi";
import dayjs from "dayjs";
import AppointmentDetailsModal from "./AppointmentDetailsModal";

const RequestedAppointments = ({ 
  appointmentsData, 
  isLoading, 
  refetch, 
  user,
  alert,
  setAlert 
}) => {
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100,
  });
  
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: '', // 'accept' or 'reject'
    appointmentId: null,
  });

  const [acceptAppointment] = useAcceptAppointmentMutation();
  const [rejectAppointment] = useRejectAppointmentMutation();

  // Filter for requested appointments
  const requestedAppointments = useMemo(
    () =>
      (appointmentsData?.results || [])
        .filter(appt => appt.status === "Requested")
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [appointmentsData]
  );

  const ServiceName = ({ serviceId }) => {
    const { data: service } = useFetchServiceByIdQuery(serviceId);
    return service ? service.title : "Loading...";
  };

  const ServiceCategoryName = ({ categoryId }) => {
    const { data: category } = useFetchServiceCategoryByIdQuery(categoryId);
    return category ? category.name : "Loading...";
  };

  const ServicePrice = ({ serviceId }) => {
    const { data: service } = useFetchServiceByIdQuery(serviceId);
    return service ? `₱${service.price}` : "Loading...";
  };

  const columns = [
    {
      field: "fullName",
      headerName: "Full Name",
      width: 180,
      renderCell: (params) => `${params.row.firstName} ${params.row.lastName}`,
    },
    {
      field: "serviceType",
      headerName: "Service",
      width: 180,
      renderCell: (params) => <ServiceName serviceId={params.row.serviceType} />,
    },
    {
      field: "serviceCategory",
      headerName: "Category",
      width: 140,
      renderCell: (params) => <ServiceCategoryName categoryId={params.row.serviceCategory} />,
    },
    {
      field: "price",
      headerName: "Price",
      width: 100,
      renderCell: (params) => <ServicePrice serviceId={params.row.serviceType} />,
    },
    {
      field: "appointmentDateTime",
      headerName: "Date & Time",
      width: 180,
      renderCell: (params) =>
        dayjs(params.row.appointmentDateTime).format("DD/MM/YYYY HH:mm"),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
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
            <MenuItem key="accept" onClick={() => handleAction('accept')}>
              Accept Appointment
            </MenuItem>
            <MenuItem key="reject" onClick={() => handleAction('reject')}>
              Reject Appointment
            </MenuItem>
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

  const handleAction = (type) => {
    if (currentAppointment) {
      setActionDialog({
        open: true,
        type,
        appointmentId: currentAppointment.id,
      });
      handleMenuClose();
    }
  };

  const confirmAction = async () => {
    try {
      if (actionDialog.type === 'accept') {
        await acceptAppointment(actionDialog.appointmentId).unwrap();
        setAlert({
          message: "Appointment accepted successfully!",
          severity: "success",
        });
      } else {
        await rejectAppointment(actionDialog.appointmentId).unwrap();
        setAlert({
          message: "Appointment rejected successfully!",
          severity: "success",
        });
      }
      refetch();
      setActionDialog({ open: false, type: '', appointmentId: null });
    } catch (error) {
      setAlert({
        message: `Error ${actionDialog.type === 'accept' ? 'accepting' : 'rejecting'} appointment: ${error.data?.message || error.message}`,
        severity: "error",
      });
    }
  };

  const cancelAction = () => {
    setActionDialog({ open: false, type: '', appointmentId: null });
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setOpenDetailsModal(true);
  };

  return (
    <Box sx={{ height: 650, width: "100%" }}>
      <DataGrid
        rows={requestedAppointments}
        columns={columns}
        rowCount={requestedAppointments.length}
        loading={isLoading}
        paginationMode="client"
        pageSizeOptions={[15, 30, 50]}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        disableSelectionOnClick
      />
      
      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onClose={cancelAction}
        aria-labelledby="action-dialog-title"
      >
        <DialogTitle id="action-dialog-title">
          {actionDialog.type === 'accept' ? 'Accept Appointment' : 'Reject Appointment'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionDialog.type === 'accept' 
              ? 'Are you sure you want to accept this appointment request? This will confirm the appointment and add it to current appointments.'
              : 'Are you sure you want to reject this appointment request? This action cannot be undone and the appointment will be permanently deleted.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelAction} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={confirmAction} 
            color={actionDialog.type === 'accept' ? "success" : "error"} 
            autoFocus
          >
            {actionDialog.type === 'accept' ? 'Accept' : 'Reject'}
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

export default RequestedAppointments;