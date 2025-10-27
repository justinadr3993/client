import { useEffect, useState, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useFetchAllAppointmentsQuery,
  useFetchAppointmentsByUserQuery,
  useFetchAppointmentsForStaffQuery,
} from "../../services/api/appointmentsApi";
import FadeAlert from "../../components/FadeAlert/FadeAlert";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useSelector } from "react-redux";
import CurrentAppointments from "./CurrentAppointments";
import AppointmentHistory from "./AppointmentHistory";
import RequestedAppointments from "./RequestedAppointments";

const AppointmentsBase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id?.toString();
  const [activeTab, setActiveTab] = useState(0);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100,
  });
  
  const rowCountRef = useRef(0);
  const [alert, setAlert] = useState(location.state?.alert || null);

  useEffect(() => {
    if (location.state?.alert) {
      setAlert(location.state.alert);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  let appointmentsQuery;

  switch (user?.role) {
    case "admin":
      appointmentsQuery = useFetchAllAppointmentsQuery({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
      });
      break;
    case "staff":
      appointmentsQuery = useFetchAppointmentsForStaffQuery({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
      });
      break;
    case "user":
      appointmentsQuery = useFetchAppointmentsByUserQuery({
        userId,
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
      });
      break;
    default:
      appointmentsQuery = {
        data: { results: [] },
        isLoading: false,
        isError: true,
        refetch: () => {},
      };
      break;
  }

  const {
    data: appointmentsData,
    isLoading,
    isError,
    refetch,
  } = appointmentsQuery;

  const rowCount = useMemo(() => {
    if (appointmentsData?.totalResults !== undefined) {
      rowCountRef.current = appointmentsData.totalResults;
    }
    return rowCountRef.current;
  }, [appointmentsData?.totalResults]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAlertClose = () => {
    setAlert(null);
  };

  // Determine tabs based on user role
  const getTabs = () => {
    const tabs = [];
    
    if (user?.role === "admin" || user?.role === "staff") {
      tabs.push("Requested Appointments");
    } else if (user?.role === "user") {
      tabs.push("Requested Appointments");
    }
    
    tabs.push("Current Appointments");
    tabs.push("Appointment History");
    
    return tabs;
  };

  const tabs = getTabs();

  if (isLoading) {
    return (
      <DashboardLayout>
        <Typography>Loading appointments...</Typography>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <Typography color="error">Error loading appointments</Typography>
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
        {user?.role === "admin" ? "Manage All Appointments" : 
         user?.role === "staff" ? "Manage Appointments" : "My Appointments"}
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        {tabs.map((tab, index) => (
          <Tab key={index} label={tab} />
        ))}
      </Tabs>

      {/* Requested Appointments Tab */}
      {activeTab === 0 && (
        <RequestedAppointments
          appointmentsData={appointmentsData}
          isLoading={isLoading}
          refetch={refetch}
          user={user}
          alert={alert}
          setAlert={setAlert}
        />
      )}

      {/* Current Appointments Tab */}
      {activeTab === 1 && (
        <CurrentAppointments
          appointmentsData={appointmentsData}
          isLoading={isLoading}
          refetch={refetch}
          user={user}
          alert={alert}
          setAlert={setAlert}
        />
      )}

      {/* Appointment History Tab */}
      {activeTab === 2 && (
        <AppointmentHistory
          appointmentsData={appointmentsData}
          user={user}
        />
      )}
    </DashboardLayout>
  );
};

export default AppointmentsBase;