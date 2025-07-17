import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';

export default function TopNav() {
  return (
    <AppBar position="static" sx={{ backgroundColor: '#1E896B' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 2 }}>
          SiteSort AI
        </Typography>
        <Button color="inherit" component={Link} to="/">
          AI Chat
        </Button>
        <Button color="inherit" component={Link} to="/chat-history">
          Chat History
        </Button>
        <Box>
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>
          <IconButton color="inherit">
            <AccountCircle />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
