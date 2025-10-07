import { useState, useEffect } from "react";
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
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useResetPasswordMutation } from "../../services/api/authApi";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { control, handleSubmit, watch, formState: { errors } } = useForm();
  const [alert, setAlert] = useState(null);
  const [resetPassword, { isLoading, isSuccess }] = useResetPasswordMutation();
  const [token, setToken] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get("token");
    
    if (!token) {
      setAlert({
        type: "error",
        message: "Invalid or missing reset token. Please request a new password reset link.",
      });
      return;
    }
    
    setToken(token);
    console.log("Reset token extracted:", token); // Debug log
  }, [location.search]);

  const onSubmit = async (data) => {
    if (!token) {
      setAlert({
        type: "error",
        message: "Invalid reset token",
      });
      return;
    }

    try {
      console.log("Submitting reset with token:", token); // Debug log
      await resetPassword({ 
        token: token, 
        password: data.password 
      }).unwrap();
      
      setAlert({
        type: "success",
        message: "Password has been reset successfully. You can now sign in with your new password.",
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      
    } catch (error) {
      console.error("Reset password error:", error);
      setAlert({
        type: "error",
        message: error.data?.message || "Failed to reset password. The link may have expired or is invalid.",
      });
    }
  };

  const password = watch("password");

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
          Reset Password
        </Typography>
        
        {alert && (
          <Alert 
            sx={{ width: "100%", mb: 2 }} 
            severity={alert.type}
            onClose={() => !isSuccess && setAlert(null)}
          >
            {alert.message}
          </Alert>
        )}
        
        {!isSuccess && token ? (
          <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
            <Controller
              name="password"
              control={control}
              defaultValue=""
              rules={{
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters"
                }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="New Password"
                  type="password"
                  fullWidth
                  required
                  margin="normal"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={isLoading}
                />
              )}
            />
            <Controller
              name="confirmPassword"
              control={control}
              defaultValue=""
              rules={{
                required: "Please confirm your password",
                validate: value => value === password || "Passwords do not match"
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Confirm Password"
                  type="password"
                  fullWidth
                  required
                  margin="normal"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  disabled={isLoading}
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
                "Reset Password"
              )}
            </Button>
          </form>
        ) : !token && !isSuccess ? (
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              No valid reset token found.
            </Typography>
            <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
              <Button variant="contained" color="primary">
                Request New Reset Link
              </Button>
            </Link>
          </Box>
        ) : null}
        
        {isSuccess && (
          <Link to="/login" style={{ textDecoration: 'none', width: '100%' }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
            >
              Sign In
            </Button>
          </Link>
        )}
      </Box>
    </Container>
  );
}