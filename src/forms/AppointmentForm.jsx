import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useFetchAllAppointmentsQuery,
} from "../services/api/appointmentsApi";
import { useFetchServiceCategoriesQuery } from "../services/api/serviceCategoriesApi";
import { useFetchServicesQuery } from "../services/api/servicesApi";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  Fade,
  InputAdornment,
} from "@mui/material";
import dayjs from "dayjs";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import AppointmentCalendar from "../components/AppointmentCalendar/AppointmentCalendar";
import DaySlider from "../components/DaySlider";

const schema = yup.object().shape({
  firstName: yup
    .string()
    .trim()
    .min(2, "First name should be at least 2 characters")
    .required("First name is required"),
  lastName: yup.string().trim().required("Last name is required"),
  contactNumber: yup
    .string()
    .trim()
    .matches(
      /^0\d{10}$/,
      "Enter a valid phone number starting with 0 and containing 11 digits"
    )
    .required("Contact number is required"),
  email: yup
    .string()
    .trim()
    .email("Invalid email format")
    .required("Email is required"),
  serviceCategory: yup.string().required("Service category is required"),
  serviceType: yup.string().required("Service type is required"),
  appointmentDateTime: yup
    .string()
    .nullable()
    .required("Please select a time slot"),
  downPayment: yup
    .string()
    .trim()
    .required("Down payment is required")
    .test('is-valid-amount', 'Please enter a valid amount', value => {
      if (!value) return false;
      const amount = parseFloat(value);
      return !isNaN(amount) && amount >= 0;
    }),
  transactionReferenceNo: yup
    .string()
    .trim()
    .required("Transaction reference number is required")
    .min(3, "Transaction reference number must be at least 3 characters"),
});

const AppointmentForm = ({ appointmentToEdit }) => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedSlot } = location.state || {};

  const [selectedDay, setSelectedDay] = useState(
    selectedSlot ? dayjs(selectedSlot) : dayjs()
  );
  const [slot, setSlot] = useState(selectedSlot || null);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [selectedCategory, setSelectedCategory] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: user ? user.firstName : "",
      lastName: user ? user.lastName : "",
      contactNumber: user ? user.contactNumber : "",
      email: user ? user.email : "",
      serviceCategory: "",
      serviceType: "",
      additionalNotes: "",
      downPayment: "",
      transactionReferenceNo: "",
      userId: user ? user.id : null,
      appointmentDateTime: slot,
    },
  });

  const { data: categories = [] } = useFetchServiceCategoriesQuery();
  const { data: services = [] } = useFetchServicesQuery();
  const [filteredServices, setFilteredServices] = useState([]);

  const [createAppointment, { isLoading: isCreating }] =
    useCreateAppointmentMutation();
  const [updateAppointment, { isLoading: isUpdating }] =
    useUpdateAppointmentMutation();

  const {
    data: allAppointments = { results: [] },
    isLoading: isLoadingAppointments,
  } = useFetchAllAppointmentsQuery({
    date: selectedDay.format("YYYY-MM-DD"),
    page: 1,
    limit: 1000,
  });

  // Watch the downPayment field to conditionally require transaction reference
  const downPaymentValue = watch("downPayment");

  useEffect(() => {
    
    if (user?.isRedTagged && user?.redTagExpiresAt && dayjs().isBefore(dayjs(user.redTagExpiresAt))) {
      setAlert({
        type: "error",
        message: "Your account is temporarily restricted from booking appointments due to previous no-show incidents. Please contact support.",
      });
    }

    if (appointmentToEdit) {
      const {
        firstName,
        lastName,
        contactNumber,
        email,
        serviceType,
        serviceCategory,
        additionalNotes,
        downPayment,
        transactionReferenceNo,
        appointmentDateTime,
      } = appointmentToEdit;

      setValue("firstName", firstName);
      setValue("lastName", lastName);
      setValue("contactNumber", contactNumber);
      setValue("email", email);
      setValue("serviceType", serviceType);
      setValue("serviceCategory", serviceCategory);
      setValue("additionalNotes", additionalNotes);
      setValue("downPayment", downPayment || "");
      setValue("transactionReferenceNo", transactionReferenceNo || "");
      setSelectedDay(dayjs(appointmentDateTime));
      setSlot(dayjs(appointmentDateTime).toISOString());
      setValue("appointmentDateTime", dayjs(appointmentDateTime).toISOString());
      setSelectedCategory(serviceCategory);
    } else if (selectedSlot) {
      setValue("appointmentDateTime", selectedSlot);
    }
  }, [appointmentToEdit, selectedSlot, setValue, user]);

  useEffect(() => {
    if (selectedCategory) {
      const filtered = services?.results?.filter(
        (service) => service.category === selectedCategory
      );
      setFilteredServices(filtered);
    }
  }, [selectedCategory, services]);

  const handleSlotSelect = (time) => {
    setSlot(time);
    setValue("appointmentDateTime", time);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setValue("serviceCategory", value);
    setValue("serviceType", "");
  };

  const getButtonText = (isCreating, isUpdating, appointmentToEdit) => {
    if (isCreating || isUpdating) {
      return "Submitting...";
    } else if (appointmentToEdit) {
      return "Update Appointment";
    } else {
      return "Book Appointment";
    }
  };

  const onSubmit = async (data) => {
    const appointmentData = {
      ...data,
      appointmentDateTime: slot,
      userId: appointmentToEdit ? appointmentToEdit.userId : user.id,
      status: 'Requested',
    };

    if (appointmentToEdit && appointmentToEdit.status === 'Upcoming') {
      const originalDateTime = dayjs(appointmentToEdit.appointmentDateTime);
      const newDateTime = dayjs(slot);
      if (!originalDateTime.isSame(newDateTime)) {
        appointmentData.status = 'Rescheduled';
      }
    }

    if ((user?.role === 'admin' || user?.role === 'staff') && !appointmentToEdit) {
      appointmentData.status = 'Upcoming';
    }

    try {
      let alertMessage = "";

      if (appointmentToEdit) {
        await updateAppointment({
          id: appointmentToEdit.id,
          ...appointmentData,
        }).unwrap();
        alertMessage = appointmentData.status === 'Rescheduled' 
          ? "Appointment rescheduled successfully!" 
          : "Appointment updated successfully!";
      } else {
        await createAppointment(appointmentData).unwrap();
        if (user?.role === 'admin' || user?.role === 'staff') {
          alertMessage = "Appointment created successfully!";
        } else {
          alertMessage = "Appointment requested successfully! It will be reviewed by our staff.";
        }
      }

      navigate("/appointments", {
        state: { alert: { type: "success", message: alertMessage } },
      });

      reset({
        firstName: "",
        lastName: "",
        contactNumber: "",
        email: "",
        serviceCategory: "",
        serviceType: "",
        additionalNotes: "",
        downPayment: "",
        transactionReferenceNo: "",
        appointmentDateTime: null,
      });
      setSelectedCategory("");
      setSlot(null);
    } catch (error) {
      //
    }
  };

  if (!user || isLoadingAppointments) {
    return <CircularProgress disableShrink />;
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12}>
          <Typography variant="h6">
            {appointmentToEdit ? "Edit Appointment" : "Create Appointment"}
          </Typography>
        </Grid>
        {alert.message && (
          <Grid item xs={12}>
            <Alert severity={alert.type}>
              <AlertTitle>
                {alert.type === "success" ? "Success" : "Error"}
              </AlertTitle>
              {alert.message}
            </Alert>
          </Grid>
        )}
      </Grid>

      <Fade in={true}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth required error={!!errors.serviceCategory}>
              <InputLabel>Service Category</InputLabel>
              <Controller
                name="serviceCategory"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Service Category"
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    {categories?.results?.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.serviceCategory && (
                <Typography color="error">
                  {errors.serviceCategory.message}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {!!selectedCategory && (
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!errors.serviceType}>
                <InputLabel>Type of Service</InputLabel>
                <Controller
                  name="serviceType"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Type of Service">
                      {filteredServices?.map((service) => (
                        <MenuItem key={service.id} value={service.id}>
                          {service.title} (₱{service.price})
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.serviceType && (
                  <Typography color="error">
                    {errors.serviceType.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12}>
            <DaySlider
              currentDay={selectedDay}
              setCurrentDay={setSelectedDay}
            />
          </Grid>
          <Grid item xs={12}>
            <AppointmentCalendar
              appointments={allAppointments.results}
              onSlotSelect={handleSlotSelect}
              selectedDay={selectedDay}
              initialSlot={slot ? dayjs(slot).format("HH:mm") : null}
              serviceCategory={selectedCategory}
            />
            {errors.appointmentDateTime && (
              <Typography color="error">
                {errors.appointmentDateTime.message}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="First Name"
                  fullWidth
                  error={!!errors.firstName}
                  helperText={errors.firstName ? errors.firstName.message : ""}
                  required
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="filled"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Last Name"
                  fullWidth
                  error={!!errors.lastName}
                  helperText={errors.lastName ? errors.lastName.message : ""}
                  required
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="filled"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="contactNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Contact Number"
                  fullWidth
                  error={!!errors.contactNumber}
                  helperText={
                    errors.contactNumber ? errors.contactNumber.message : ""
                  }
                  required
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="filled"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email ? errors.email.message : ""}
                  required
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="filled"
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="downPayment"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Down Payment (GCash No. 0932 927 1164)"
                  fullWidth
                  error={!!errors.downPayment}
                  helperText={
                    errors.downPayment 
                      ? errors.downPayment.message 
                      : "Deposits will not be refunded if the customer did not arrive"
                  }
                  required
                  InputProps={{
                    readOnly: !!appointmentToEdit,
                    startAdornment: (
                      <InputAdornment position="start">₱</InputAdornment>
                    ),
                  }}
                  variant={appointmentToEdit ? "filled" : "outlined"}
                  FormHelperTextProps={{
                    sx: {
                      color: errors.downPayment ? 'error.main' : 'warning.main',
                      fontWeight: errors.downPayment ? 'normal' : 'medium'
                    }
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="transactionReferenceNo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Transaction Reference No."
                  fullWidth
                  error={!!errors.transactionReferenceNo}
                  required
                  InputProps={{
                    readOnly: !!appointmentToEdit,
                  }}
                  variant={appointmentToEdit ? "filled" : "outlined"}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="additionalNotes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Additional Notes (e.g. Plate No.)"
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" gap={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isCreating || isUpdating}
              >
                {getButtonText(isCreating, isUpdating, appointmentToEdit)}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate("/appointments")}
              >
                Cancel
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Fade>
    </Box>
  );
};

export default AppointmentForm;