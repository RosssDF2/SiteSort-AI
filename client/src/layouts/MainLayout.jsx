// src/layouts/MainLayout.jsx
import React from 'react';
import {
  Box, IconButton, Menu, MenuItem, Typography, Divider, Button
} from '@mui/material';
import Sidebar from '../components/Sidebar';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AppsIcon from '@mui/icons-material/Apps';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useNavigate } from 'react-router-dom';

function MainLayout({ children }) {
  return (
    <Box display="flex">
      <Sidebar />
      <Box component="main" flexGrow={1} p={3} sx={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
        {children}
      </Box>
    </Box>
  );
}

function TopRightMenu({ user }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <Box sx={{ position: 'absolute', top: 16, right: 24, display: 'flex', gap: 2 }}>
      <IconButton><HelpOutlineIcon /></IconButton>
      <IconButton><AppsIcon /></IconButton>
      <IconButton><SettingsIcon /></IconButton>
      <IconButton onClick={handleClick}><AccountCircleIcon /></IconButton>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Box px={2} py={1}>
          <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          <Typography variant="subtitle1">Hi, <span style={{ color: "#10B981" }}>{user?.email?.split('@')[0]}</span></Typography>
        </Box>

        <Divider />
        <MenuItem disabled>➕ Add account</MenuItem>
        <MenuItem disabled>➕ Add account</MenuItem>

        <Box px={2} py={1}>
          <Button
            variant="outlined"
            color="error"
            fullWidth
            onClick={handleLogout}
          >
            Sign out
          </Button>
        </Box>
      </Menu>
    </Box>
  );
}

export default MainLayout;
