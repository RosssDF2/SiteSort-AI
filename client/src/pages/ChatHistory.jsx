import React from 'react';
import TopNav from '../components/TopNav';
//import Sidebar from '../components/Sidebar';
import ChatHistoryContent from '../components/ChatHistoryContent';
import { Box } from '@mui/material';

export default function ChatHistory() {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopNav />
      <Box sx={{ flex: 1, display: 'flex' }}>
        
        <ChatHistoryContent />
      </Box>
    </Box>
  );
}
