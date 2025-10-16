import { useState, useMemo } from "react";
import {
  Box,
  MenuItem,
  Select,
  FormControl,
  TextField,
  InputAdornment,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TableFooter,
  TablePagination,
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { useFetchServiceByIdQuery } from "../../services/api/servicesApi";
import { useFetchServiceCategoryByIdQuery } from "../../services/api/serviceCategoriesApi";
import dayjs from "dayjs";

const AppointmentHistory = ({ appointmentsData, user }) => {
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(50);

  // Filter states
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [bookedDateFilter, setBookedDateFilter] = useState("");
  const [appointmentDateFilter, setAppointmentDateFilter] = useState("");

  // Filter for history appointments (Completed, Cancelled, No Arrival)
  const filteredHistoryAppointments = useMemo(() => {
    if (!appointmentsData?.results) return [];
    
    let filtered = appointmentsData.results
      .filter(appt => ["Completed", "Cancelled", "No Arrival"].includes(appt.status))
      .sort((a, b) => new Date(b.appointmentDateTime) - new Date(a.appointmentDateTime));

    if (user?.role === "admin" || user?.role === "staff") {
      if (nameFilter) {
        filtered = filtered.filter(appt => 
          `${appt.firstName} ${appt.lastName}`.toLowerCase().includes(nameFilter.toLowerCase())
        );
      }
      if (emailFilter) {
        filtered = filtered.filter(appt => 
          appt.email.toLowerCase().includes(emailFilter.toLowerCase())
        );
      }
      if (phoneFilter) {
        filtered = filtered.filter(appt => 
          appt.contactNumber.includes(phoneFilter)
        );
      }
    }

    if (statusFilter) {
      filtered = filtered.filter(appt => 
        appt.status === statusFilter
      );
    }
    if (bookedDateFilter) {
      filtered = filtered.filter(appt => 
        dayjs(appt.createdAt).format("YYYY-MM-DD") === bookedDateFilter
      );
    }
    if (appointmentDateFilter) {
      filtered = filtered.filter(appt => 
        dayjs(appt.appointmentDateTime).format("YYYY-MM-DD") === appointmentDateFilter
      );
    }

    return filtered;
  }, [appointmentsData, nameFilter, emailFilter, phoneFilter, statusFilter, bookedDateFilter, appointmentDateFilter, user?.role]);

  const handleHistoryPageChange = (event, newPage) => {
    setHistoryPage(newPage);
  };

  const handleHistoryRowsPerPageChange = (event) => {
    setHistoryRowsPerPage(parseInt(event.target.value, 10));
    setHistoryPage(0);
  };

  const ServiceName = ({ serviceId }) => {
    const { data: service } = useFetchServiceByIdQuery(serviceId);
    return service ? service.title : "Loading...";
  };

  const ServicePrice = ({ serviceId }) => {
    const { data: service } = useFetchServiceByIdQuery(serviceId);
    return service ? `₱${service.price}` : "Loading...";
  };

  const ServiceCategoryName = ({ categoryId }) => {
    const { data: category } = useFetchServiceCategoryByIdQuery(categoryId);
    return category ? category.name : "Loading...";
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {(user?.role === "admin" || user?.role === "staff") && (
            <>
              <TextField
                label="Filter by Name"
                variant="outlined"
                size="small"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Filter by Email"
                variant="outlined"
                size="small"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Filter by Phone"
                variant="outlined"
                size="small"
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </>
          )}
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              inputProps={{ 'aria-label': 'Filter by Status' }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
              <MenuItem value="No Arrival">No Arrival</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Filter by Booked Date"
            type="date"
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={bookedDateFilter}
            onChange={(e) => setBookedDateFilter(e.target.value)}
          />
          <TextField
            label="Filter by Appointment Date"
            type="date"
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={appointmentDateFilter}
            onChange={(e) => setAppointmentDateFilter(e.target.value)}
          />
          <Button 
            variant="outlined" 
            onClick={() => {
              setNameFilter("");
              setEmailFilter("");
              setPhoneFilter("");
              setServiceFilter("");
              setPriceFilter("");
              setStatusFilter("");
              setBookedDateFilter("");
              setAppointmentDateFilter("");
            }}
          >
            Clear Filters
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="appointment history table" size="small">
          <TableHead>
            <TableRow>
              {(user?.role === "admin" || user?.role === "staff") && (
                <>
                  <TableCell sx={{ fontSize: '0.75rem' }}>Full Name</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>Email</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>Phone</TableCell>
                </>
              )}
              <TableCell sx={{ fontSize: '0.75rem' }}>Service</TableCell>
              <TableCell sx={{ fontSize: '0.75rem' }}>Category</TableCell>
              <TableCell sx={{ fontSize: '0.75rem' }}>Price</TableCell>
              <TableCell sx={{ fontSize: '0.75rem' }}>Notes</TableCell>
              <TableCell sx={{ fontSize: '0.75rem' }}>Rating</TableCell>
              <TableCell sx={{ fontSize: '0.75rem' }}>Booked At</TableCell>
              <TableCell sx={{ fontSize: '0.75rem' }}>Appointment At</TableCell>
              <TableCell sx={{ fontSize: '0.75rem' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHistoryAppointments
              .slice(historyPage * historyRowsPerPage, historyPage * historyRowsPerPage + historyRowsPerPage)
              .map((appointment) => (
              <TableRow key={appointment.id}>
                {(user?.role === "admin" || user?.role === "staff") && (
                  <>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{`${appointment.firstName} ${appointment.lastName}`}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{appointment.email}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{appointment.contactNumber}</TableCell>
                  </>
                )}
                <TableCell sx={{ fontSize: '0.75rem' }}>
                  <ServiceName serviceId={appointment.serviceType} />
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>
                  <ServiceCategoryName categoryId={appointment.serviceCategory} />
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>
                  <ServicePrice serviceId={appointment.serviceType} />
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{appointment.additionalNotes || "N/A"}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>
                  {appointment.review ? `${appointment.review.rating}/5` : 'N/A'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{dayjs(appointment.bookedAt).format("MMM D, YYYY h:mm A")}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{dayjs(appointment.appointmentDateTime).format("MMM D, YYYY h:mm A")}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>
                  <Chip 
                    label={appointment.status} 
                    color={
                      appointment.status === "Completed" ? "success" :
                      appointment.status === "Cancelled" ? "error" : 
                      appointment.status === "No Arrival" ? "warning" : "default"
                    } 
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[15, 30, 50]}
                colSpan={(user?.role === "admin" || user?.role === "staff") ? 11 : 8}
                count={filteredHistoryAppointments.length}
                rowsPerPage={historyRowsPerPage}
                page={historyPage}
                onPageChange={handleHistoryPageChange}
                onRowsPerPageChange={handleHistoryRowsPerPageChange}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AppointmentHistory;