import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVerifyEmailMutation } from '../../services/api/authApi';
import { 
  Alert, 
  Box, 
  Button, 
  Container, 
  Typography, 
  CircularProgress,
  Avatar,
  Paper
} from '@mui/material';
import { LockOutlined, CheckCircle, Error } from '@mui/icons-material';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [verifyEmail, { isLoading, isSuccess, error }] = useVerifyEmailMutation();
  const [alert, setAlert] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const queryParams = new URLSearchParams(location.search);
      const token = queryParams.get('token');
      
      if (!token) {
        setAlert({
          type: 'error',
          message: 'No verification token found in the URL. Please check your email for the correct verification link.',
        });
        return;
      }
      
      try {
        await verifyEmail({ token }).unwrap();
        setIsVerified(true);
        setAlert({
          type: 'success',
          message: 'Email verified successfully! You can now log in to your account.',
        });
      } catch (err) {
        console.error('Verification error:', err);
        setAlert({
          type: 'error',
          message: err.data?.message || 'Failed to verify email. The link may have expired or is invalid. Please request a new verification email.',
        });
      }
    };

    verifyToken();
  }, [location.search, verifyEmail]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 500,
            width: '100%',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 56, height: 56 }}>
            <LockOutlined sx={{ fontSize: 30 }} />
          </Avatar>
          
          <Typography component="h1" variant="h4" gutterBottom sx={{ mt: 2, textAlign: 'center' }}>
            Email Verification
          </Typography>

          {isLoading && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <CircularProgress size={40} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Verifying your email...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Please wait while we verify your email address.
              </Typography>
            </Box>
          )}

          {alert && !isLoading && (
            <Alert 
              severity={alert.type} 
              sx={{ 
                mt: 3, 
                width: '100%',
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
              icon={isVerified ? <CheckCircle /> : error ? <Error /> : undefined}
            >
              <Typography variant="h6" gutterBottom>
                {alert.type === 'success' ? 'Verification Successful!' : 'Verification Failed'}
              </Typography>
              {alert.message}
            </Alert>
          )}

          <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            {isSuccess || isVerified ? (
              <>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGoToLogin}
                  sx={{ minWidth: 160 }}
                >
                  Go to Login
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleGoToHome}
                  sx={{ minWidth: 160 }}
                >
                  Go to Home
                </Button>
              </>
            ) : error && !isLoading ? (
              <>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGoToLogin}
                  sx={{ minWidth: 160 }}
                >
                  Go to Login
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleGoToHome}
                  sx={{ minWidth: 160 }}
                >
                  Go to Home
                </Button>
              </>
            ) : null}
          </Box>

          {!isLoading && !alert && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                If you're not automatically redirected, please check your URL or contact support.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}