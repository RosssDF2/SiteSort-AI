// src/layouts/MainLayout.jsx
import React from 'react';
import { Box } from '@mui/material';
import Sidebar from '../components/Sidebar';

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

export default MainLayout;
