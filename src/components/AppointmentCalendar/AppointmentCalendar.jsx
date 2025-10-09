import { useState, useEffect } from "react";
import { Grid, Typography, Button } from "@mui/material";
import dayjs from "dayjs";
import StyledSlot from "./AppointmentCalendar.styles";
import PropTypes from "prop-types";

AppointmentCalendar.propTypes = {
  appointments: PropTypes.array.isRequired,
  onSlotSelect: PropTypes.func.isRequired,
  selectedDay: PropTypes.object.isRequired,
  initialSlot: PropTypes.string,
  readOnly: PropTypes.bool,
  serviceCategory: PropTypes.string,
};

const slots = [
  "7:00 AM - 8:00 AM",
  "8:00 AM - 9:00 AM", 
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
  "5:00 PM - 6:00 PM"
];

const parseTimeFromAMPM = (timeStr) => {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return { hours, minutes };
};

const isSlotBooked = (time, appointments, selectedDay, serviceCategory) => {
  const [startTime] = time.split(" - ");
  const { hours, minutes } = parseTimeFromAMPM(startTime);
  
  return appointments.some(
    (appt) =>
      dayjs(appt.appointmentDateTime).isSame(
        dayjs(selectedDay).hour(hours).minute(minutes),
        "minute"
      ) &&
      appt.status !== "Cancelled" &&
      appt.serviceCategory === serviceCategory
  );
};

const isSlotInPast = (time, selectedDay) => {
  const [startTime] = time.split(" - ");
  const { hours, minutes } = parseTimeFromAMPM(startTime);
  const slotDateTime = dayjs(selectedDay).hour(hours).minute(minutes);
  return slotDateTime.isBefore(dayjs());
};

export default function AppointmentCalendar({
  appointments,
  onSlotSelect,
  selectedDay,
  initialSlot,
  readOnly = false,
  serviceCategory,
}) {
  const [selectedSlot, setSelectedSlot] = useState(initialSlot || null);

  useEffect(() => {
    if (initialSlot) {
      const initialSlotDay = dayjs(selectedDay).isSame(dayjs(), "day");
      if (initialSlotDay) {
        setSelectedSlot(initialSlot);
      } else {
        setSelectedSlot(null);
      }
    } else {
      setSelectedSlot(null);
    }
  }, [selectedDay, initialSlot]);

  useEffect(() => {
    if (initialSlot) {
      setSelectedSlot(initialSlot);
    }
  }, [initialSlot]);

  const handleSlotClick = (time) => {
    if (
      !readOnly &&
      !isSlotBooked(time, appointments, selectedDay, serviceCategory) &&
      !isSlotInPast(time, selectedDay)
    ) {
      setSelectedSlot(time);
      const [startTime] = time.split(" - ");
      const { hours, minutes } = parseTimeFromAMPM(startTime);
      
      onSlotSelect(
        dayjs(selectedDay)
          .hour(hours)
          .minute(minutes)
          .toISOString()
      );
    }
  };

  const getSlotStatus = (time) => {
    if (isSlotBooked(time, appointments, selectedDay, serviceCategory)) {
      return "Booked";
    }
    if (isSlotInPast(time, selectedDay)) {
      return "Past";
    }
    return "Available";
  };

  return (
    <Grid container spacing={2} mb={2}>
      {slots.map((time) => (
        <Grid item xs={12} sm={6} lg={3} key={time}>
          <StyledSlot
            elevation={3}
            isBooked={isSlotBooked(time, appointments, selectedDay, serviceCategory)}
            isSelected={selectedSlot === time}
          >
            <Button
              fullWidth
              variant="text"
              onClick={() => handleSlotClick(time)}
              disabled={
                readOnly ||
                isSlotBooked(time, appointments, selectedDay, serviceCategory) ||
                isSlotInPast(time, selectedDay)
              }
              sx={{ 
                padding: '5px 9px',
                minHeight: 'auto'
              }}
            >
              <Typography 
                mr={0.5} 
                variant="body2" 
                sx={{ fontSize: '0.9rem' }} 
                fontWeight="medium"
              >
                {time}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ fontSize: '0.9rem' }} 
                color="text.secondary"
              >
                {getSlotStatus(time)}
              </Typography>
            </Button>
          </StyledSlot>
        </Grid>
      ))}
    </Grid>
  );
}