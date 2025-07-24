// src/pages/About.jsx
import React from 'react';
import {
  Box, Typography, Grid, Paper, Avatar, IconButton, Divider, Chip
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AppsIcon from '@mui/icons-material/Apps';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MainLayout from '../layouts/MainLayout';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import SortaBot from '../components/SortaBot';

function About() {
  const { user } = React.useContext(UserContext);
  const navigate = useNavigate();

  const username = user?.username || user?.email?.split('@')[0] || 'Guest';

  return (
    <MainLayout>
      {/* Top Right Icons */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2} mb={3}>
        <IconButton><HelpOutlineIcon /></IconButton>
        <IconButton><AppsIcon /></IconButton>
        <IconButton><SettingsIcon /></IconButton>
        <IconButton>
          <AccountCircleIcon />
        </IconButton>
      </Box>

      {/* Page Header */}
      <Box textAlign="center" mb={4}>
        <Avatar
          src="/logo512.png"
          sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
        />
        <Typography variant="h4" mb={1}>
          About <span style={{ color: '#10B981' }}>SiteSort AI</span>
        </Typography>
        <Typography color="text.secondary" maxWidth={600} mx="auto">
          Built in collaboration with the Singapore Chinese Chamber of Commerce & Industry (SCCCI), SiteSort AI is a next-gen construction document assistant designed to save project managers time and stress by automatically organizing, tagging, and retrieving project files with smart AI.
        </Typography>
      </Box>

      {/* About Cards */}
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              🚧 The Problem
            </Typography>
            <Typography>
              Project managers spend hours manually organizing email attachments like RFIs, technical submissions, and tenders. Important files get lost in inboxes or cluttered folders, slowing down approvals and increasing rework risks.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom color="success.main">
              💡 Our Solution
            </Typography>
            <Typography>
              SiteSort AI auto-sorts uploaded documents into categories using AI, summarizes lengthy PDFs, enables smart filtering, and lets you ask questions about your documents through our powerful RAG-powered assistant.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>
              🔍 Key Features
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
              <Chip label="📂 AI Auto-Sorting" color="primary" />
              <Chip label="📄 Smart Summarization" color="success" />
              <Chip label="🔎 Document Q&A (RAG)" color="warning" />
              <Chip label="📁 Google Drive Integration" color="secondary" />
              <Chip label="🛡️ Access Controls & Logging" />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>
              🤝 Industry Collaboration
            </Typography>
            <Typography>
              This project was developed as part of the <strong>SCCCI x NYP AI Innovation Challenge</strong>, under the guidance of NYP lecturers and in partnership with construction industry stakeholders. It was created by a team of 4 final-year students passionate about solving real-world problems with AI.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <SortaBot />
    </MainLayout>
  );
}

export default About;
