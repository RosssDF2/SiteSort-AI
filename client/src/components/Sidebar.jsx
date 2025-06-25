// src/components/Sidebar.jsx
import React from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Dashboard, Person, Lock, CloudUpload, Info } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography } from '@mui/material';


const navItems = [
  { label: 'Profile', icon: <Person />, path: '/profile' },
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { label: 'SiteSort AI', icon: <Lock />, path: '/sitesort-ai' },
  { label: 'AI Upload', icon: <CloudUpload />, path: '/upload' },
  { label: 'About', icon: <Info />, path: '/about' },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box
      sx={{
        width: 220,
        height: '100vh',
        backgroundColor: '#F9FAFB',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
      }}
    >
      <Box mb={4} pt={4} display="flex" alignItems="center" justifyContent="center" gap={1}>
        <img
          src="/logo.png"
          alt="SiteSort AI"
          style={{ width: 50, height: 50, objectFit: "contain" }}
        />
        <Typography variant="h6" fontWeight={700}>
          Site<span style={{ color: "#10B981" }}>Sort</span> AI
        </Typography>
      </Box>


      <List>
        {navItems.map((item) => (
          <ListItem
            key={item.label}
            button
            onClick={() => navigate(item.path)}
            sx={{
              backgroundColor: location.pathname === item.path ? '#10B981' : 'transparent',
              color: location.pathname === item.path ? 'white' : 'black',
              borderRadius: 2,
              mx: 2,
              mb: 1,
              '&:hover': {
                backgroundColor: location.pathname === item.path ? '#10B981' : '#f0f0f0',
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'white' : '#6b7280' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default Sidebar;