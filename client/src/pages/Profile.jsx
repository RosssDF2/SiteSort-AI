// src/pages/Profile.jsx
import React from 'react';
import { Box, Typography, Grid, Paper, Button, Chip, Avatar, IconButton } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import InfoIcon from '@mui/icons-material/Info';
import SecurityIcon from '@mui/icons-material/Security';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AppsIcon from '@mui/icons-material/Apps';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MainLayout from '../layouts/MainLayout';
import { UserContext } from '../contexts/UserContext';
import { Menu, MenuItem, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SortaBot from '../components/SortaBot';
import GoogleIcon from '@mui/icons-material/Google';


function Profile() {
  const { user } = React.useContext(UserContext);
  const username = user?.username || user?.email?.split('@')[0] || 'John Doe';
  const navigate = useNavigate();
  const [isGoogleLinked, setIsGoogleLinked] = React.useState(user?.isGoogleLinked || false);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  React.useEffect(() => {
  const fetchGoogleLinkStatus = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3001/api/auth/check-google-link", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      setIsGoogleLinked(data.isGoogleLinked);
    }
  };

  fetchGoogleLinkStatus();
}, []);


  return (
    <MainLayout>
      {/* Top Right Icons */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2} mb={3}>
        <IconButton><HelpOutlineIcon /></IconButton>
        <IconButton><AppsIcon /></IconButton>
        <IconButton><SettingsIcon /></IconButton>
        <IconButton onClick={handleClick}>
          <AccountCircleIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box px={2} py={1}>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            <Typography variant="subtitle1">Hi, <span style={{ color: "#10B981" }}>{username}</span></Typography>
          </Box>

          <Divider />
          <MenuItem disabled>➕ Add account</MenuItem>
          <MenuItem disabled>➕ Add account</MenuItem>

          <Box px={2} py={1}>
            <Button variant="outlined" color="error" fullWidth onClick={handleLogout}>
              Sign out
            </Button>
          </Box>
        </Menu>

      </Box>

      {/* Welcome Message with Avatar */}
      <Box textAlign="center" mb={4}>
        <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }} />
        <Typography variant="h4" mb={1}>
          Welcome, <span style={{ color: '#10B981' }}>{username}</span>
        </Typography>
        <Typography color="text.secondary">
          Manage your profile, preferences, and settings to get the most out of your file assistant
        </Typography>
      </Box>

      {/* Centered Cards */}
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <LockIcon color="success" />
              <Typography variant="h6">Password Manager</Typography>
            </Box>
            <Typography mb={2}>
              See, change, or remove passwords you saved in your SiteSort Account.
            </Typography>
            <Button variant="text">Change your password</Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <InfoIcon color="primary" />
              <Typography variant="h6">Personal Info</Typography>
            </Box>
            <Typography mb={2}>
              Update your name and role so we can personalize your experience.
            </Typography>
            <Button variant="text">Review personal information</Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <SettingsIcon color="success" />
              <Typography variant="h6">Account Settings</Typography>
            </Box>
            <Typography mb={2}>
              Manage 2FA, login alerts, and keep your account extra secure.
              You have 2 undone tasks:
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
              {!isGoogleLinked ? (
                <Button
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  onClick={async () => {
                    const token = localStorage.getItem("token");
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
                      alert("❌ Failed to start Google bind: " + (data.error || "Unknown error"));
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
                    const token = localStorage.getItem("token");
                    const res = await fetch("http://localhost:3001/api/auth/google/unbind", {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`
                      }
                    });
                    if (res.ok) {
                      setIsGoogleLinked(false);
                      alert("✅ Google account unlinked.");
                    } else {
                      alert("❌ Failed to unlink.");
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
                  label={user?.is2FAEnabled ? "2FA enabled" : "2FA not enabled"}
                  color={user?.is2FAEnabled ? "success" : "warning"}
                  variant={user?.is2FAEnabled ? "filled" : "outlined"}
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
