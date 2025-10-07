import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  Container,
  Avatar,
  CircularProgress,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Link } from "react-router-dom";
import { useForgotPasswordMutation } from "../../services/api/authApi";

export default function ForgotPassword() {
  const { control, handleSubmit, formState: { errors } } = useForm();
  const [alert, setAlert] = useState(null);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const onSubmit = async (data) => {
    try {
      setAlert(null); // Clear previous alerts
      await forgotPassword(data.email).unwrap();
      
      setAlert({
        type: "success",
        message: "Password reset link sent to your email. Please check your inbox (and spam folder). The link will expire in 30 minutes.",
      });
      
    } catch (error) {
      console.error("Forgot password error:", error);
      
      let errorMessage = "Failed to send reset link. Please try again.";
      
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.status === 404) {
        errorMessage = "No account found with this email address.";
      } else if (error.status === 429) {
        errorMessage = "Too many requests. Please try again later.";
      } else if (error.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      setAlert({
        type: "error",
        message: errorMessage,
      });
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" gutterBottom>
          Forgot Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          Enter your email address and we'll send you a link to reset your password.
        </Typography>
        
        {alert && (
          <Alert 
            sx={{ width: "100%", mb: 2 }} 
            severity={alert.type}
            onClose={() => setAlert(null)}
          >
            {alert.message}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
          <Controller
            name="email"
            control={control}
            defaultValue=""
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address"
              }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email Address"
                type="email"
                fullWidth
                required
                margin="normal"
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            )}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size="1.5rem" color="inherit" />
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>

        <Box sx={{ mt: 2, width: '100%', textAlign: 'center' }}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="text" color="primary" fullWidth>
              Back to Sign In
            </Button>
          </Link>
        </Box>

        <Box sx={{ mt: 1, width: '100%', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{" "}
            <Link to="/register" style={{ textDecoration: 'none', color: 'primary.main' }}>
              Sign up
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}