// src/pages/Profile.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Box, Typography, Grid, Paper, Button, Chip, Avatar
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import InfoIcon from '@mui/icons-material/Info';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import GoogleIcon from '@mui/icons-material/Google';
import MainLayout from '../layouts/MainLayout';
import SortaBot from '../components/SortaBot';
import { UserContext } from '../contexts/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';

function Profile() {
  const { user } = useContext(UserContext);
  const username = user?.username || user?.email?.split('@')[0] || 'John Doe';
  const navigate = useNavigate();

  const [isGoogleLinked, setIsGoogleLinked] = useState(user?.isGoogleLinked || false);
  const [googleBindError, setGoogleBindError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const errorHandled = useRef(false);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlError = queryParams.get('error');

  useEffect(() => {
    const fetchGoogleLinkStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch("http://localhost:3001/api/auth/check-google-link", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setIsGoogleLinked(data.isGoogleLinked);
          
          // Update user in localStorage if status changed
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (currentUser.isGoogleLinked !== data.isGoogleLinked) {
            localStorage.setItem('user', JSON.stringify({
              ...currentUser,
              isGoogleLinked: data.isGoogleLinked
            }));
          }
        } else {
          console.error('Failed to fetch Google link status:', await res.text());
        }
      } catch (err) {
        console.error('Error checking Google link status:', err);
      }
    };
    fetchGoogleLinkStatus();
  }, [user?._id]); // Re-run when user changes

  useEffect(() => {
    if (urlError === 'google_already_bound' && !errorHandled.current) {
      setGoogleBindError("⚠️ This Google account is already linked to another SiteSort user.");
      errorHandled.current = true;
      window.history.replaceState({}, "", location.pathname);
    }
  }, [urlError, location.pathname]);

  return (
    <MainLayout>
      {/* Welcome Message */}
      <Box 
        textAlign="center" 
        mb={4} 
        sx={{
          py: 3,
          borderRadius: 2
        }}
      >
        <Avatar
          src={user?.avatar ? `http://localhost:3001${user.avatar}` : undefined}
          sx={{ 
            width: 80, 
            height: 80, 
            mx: 'auto', 
            mb: 2,
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        />
        <Typography variant="h4" mb={1} fontWeight="600">
          Welcome, <span style={{ color: '#10B981' }}>{username}</span>
        </Typography>
        <Typography color="text.secondary" variant="body1" sx={{ maxWidth: 500, mx: 'auto' }}>
          Manage your profile, preferences, and settings to get the most out of your file assistant
        </Typography>
      </Box>

      {/* Cards */}
      <Grid container spacing={3} justifyContent="center" sx={{ px: { xs: 2, md: 3 } }}>
        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 3, 
              height: '100%',
              borderRadius: 2, 
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 6px 24px rgba(0,0,0,0.12)'
              }
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <LockIcon color="success" sx={{ fontSize: 24 }} />
              <Typography variant="h6" fontWeight="600">Password Manager</Typography>
            </Box>
            <Typography mb={3} color="text.secondary" variant="body1">
              See, change, or remove passwords you saved in your SiteSort Account.
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="space-between" mt="auto">
              <Button
                variant="text"
                sx={{ 
                  color: '#10B981',
                  '&:hover': {
                    backgroundColor: 'rgba(16, 185, 129, 0.1)'
                  }
                }}
                onClick={async () => {
                  try {
                    const res = await fetch("http://localhost:3001/api/auth/request-reset", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: user.email })
                    });

                    const data = await res.json();
                    setResetMessage(res.ok
                      ? "📩 Password reset link sent to your email."
                      : "❌ " + (data.error || "Failed to send reset link."));
                  } catch {
                    setResetMessage("❌ Error sending request.");
                  }
                }}
              >
                Change your password
              </Button>
              {resetMessage && (
                <Typography
                  ml={2}
                  fontSize={14}
                  color={resetMessage.startsWith("📩") ? "success.main" : "error"}
                >
                  {resetMessage}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 4, 
              borderRadius: 4, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 6px 24px rgba(0,0,0,0.12)'
              }
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <InfoIcon color="success" sx={{ fontSize: 24 }} />
              <Typography variant="h6" fontWeight="600">Personal Info</Typography>
            </Box>
            <Typography mb={3} color="text.secondary" variant="body1">
              Update your name and role so we can personalize your experience.
            </Typography>
            <Box sx={{ mt: 'auto' }}>
              <Button 
              variant="contained" 
              onClick={() => navigate("/personalize")}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                py: 1,
                backgroundColor: '#10B981',
                '&:hover': {
                  backgroundColor: '#0f9c6b'
                }
              }}
            >
              Review personal information
            </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 4, 
              borderRadius: 4, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 6px 24px rgba(0,0,0,0.12)'
              }
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <SettingsIcon color="success" sx={{ fontSize: 24 }} />
              <Typography variant="h6" fontWeight="600">Security Settings</Typography>
            </Box>
            <Typography mb={3} color="text.secondary" variant="body1">
              {isGoogleLinked
                ? "Your account is protected with Google login and 2FA. You can unlink your account below."
                : "Keep your account secure by enabling Google login and 2FA. It only takes a few seconds."}
            </Typography>
            {googleBindError && (
              <Typography color="error" mb={2}>
                {googleBindError}
              </Typography>
            )}
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
              {!isGoogleLinked ? (
                <Button
                  variant="contained"
                  startIcon={<GoogleIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                    py: 1.5,
                    backgroundColor: '#10B981',
                    '&:hover': {
                      backgroundColor: '#0f9c6b'
                    }
                  }}
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      if (!token) {
                        alert("❌ You must be logged in to bind your Google account");
                        return;
                      }

                      // Save binding state before starting
                      localStorage.setItem('bindingInProgress', 'true');
                      localStorage.setItem('bindReturnUrl', window.location.href);
                      localStorage.setItem('bindStartTime', Date.now().toString());

                      const res = await fetch("http://localhost:3001/api/auth/bind/initiate", {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json"
                        },
                        credentials: "include"
                      });
                      
                      const data = await res.json();
                      if (res.ok && data.redirectUrl) {
                        window.location.href = `http://localhost:3001${data.redirectUrl}`;
                      } else {
                        localStorage.removeItem('bindingInProgress');
                        localStorage.removeItem('bindReturnUrl');
                        localStorage.removeItem('bindStartTime');
                        alert("❌ Failed to start Google bind: " + (data.error || "Unknown error"));
                      }
                    } catch (err) {
                      console.error('Error initiating Google bind:', err);
                      localStorage.removeItem('bindingInProgress');
                      localStorage.removeItem('bindReturnUrl');
                      localStorage.removeItem('bindStartTime');
                      alert("❌ Failed to start Google bind. Please try again.");
                    }
                  }}
                >
                  Bind Google Account
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      if (!token) {
                        alert("❌ You must be logged in to unlink your Google account");
                        return;
                      }

                      const res = await fetch("http://localhost:3001/api/auth/google/unbind", {
                        method: "POST",
                        headers: { 
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json"
                        },
                        credentials: "include"
                      });

                      const data = await res.json();
                      if (res.ok) {
                        setIsGoogleLinked(false);
                        
                        // Update user in localStorage
                        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                        localStorage.setItem('user', JSON.stringify({
                          ...currentUser,
                          isGoogleLinked: false
                        }));
                        
                        alert("✅ Google account unlinked successfully.");
                      } else {
                        alert("❌ Failed to unlink: " + (data.error || "Unknown error"));
                      }
                    } catch (err) {
                      console.error('Error unlinking Google account:', err);
                      alert("❌ Failed to unlink Google account. Please try again.");
                    }
                  }}
                >
                  Unlink Google
                </Button>
              )}
              <Box display="flex" gap={1}>
                <Chip
                  icon={<GoogleIcon />}
                  label={isGoogleLinked ? "Google linked" : "Google not bound"}
                  color={isGoogleLinked ? "success" : "warning"}
                  variant={isGoogleLinked ? "filled" : "outlined"}
                />
                <Chip
                  icon={<SecurityIcon />}
                  label={isGoogleLinked && user?.role === "manager" ? "2FA enabled" : "2FA not enabled"}
                  color={isGoogleLinked && user?.role === "manager" ? "success" : "warning"}
                  variant={isGoogleLinked && user?.role === "manager" ? "filled" : "outlined"}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      <SortaBot />
    </MainLayout>
  );
}

export default Profile;
