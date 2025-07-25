// src/pages/About.jsx
import React, { useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
} from '@mui/material';
import MainLayout from '../layouts/MainLayout';
import { UserContext } from '../contexts/UserContext';
import SortaBot from '../components/SortaBot';

function About() {
  const { user } = useContext(UserContext);
  const username = user?.username || user?.email?.split('@')[0] || 'Guest';

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 800, mx: "auto", px: { xs: 2, md: 0 } }}>
        {/* Title */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            About SiteSort AI
          </Typography>
          <Typography variant="body1" color="text.secondary">
            A modern AI assistant built to streamline construction document workflows
          </Typography>
        </Box>

        {/* Description + Image */}
        <Box
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          alignItems="center"
          gap={4}
          mb={6}
        >
          <Box flex={2}>
            <Typography variant="h5" fontWeight="bold" mb={1}>
              Our Story
            </Typography>
            <Typography variant="body1" color="text.secondary">
              SiteSort AI was developed during the <strong>SCCCI x NYP AI Innovation Challenge</strong> by a passionate team of final-year students. The platform uses cutting-edge AI to help project managers automatically tag, sort, and retrieve important construction documents.
            </Typography>
          </Box>
          <Box flex={1} display="flex" justifyContent="center">
            <img src="/tree.png" alt="SiteSort AI illustration" style={{ maxWidth: "100%", maxHeight: 220 }} />
          </Box>
        </Box>

        {/* Problem Statement */}
        <Paper sx={{ borderRadius: 3, px: 3, py: 4, mb: 4 }}>
          <Typography variant="h6" mb={1}>🚧 The Problem</Typography>
          <Typography variant="body2" color="text.secondary">
            Project managers waste hours manually digging through cluttered inboxes and folders to find RFIs, technical drawings, and submissions. Important files get misplaced or delayed, risking rework and missed deadlines.
          </Typography>
        </Paper>

        {/* Solution */}
        <Paper sx={{ borderRadius: 3, px: 3, py: 4, mb: 4 }}>
          <Typography variant="h6" mb={1}>💡 Our Solution</Typography>
          <Typography variant="body2" color="text.secondary">
            With AI auto-sorting, smart PDF summarization, and a powerful document Q&A chatbot, SiteSort AI helps teams stay organized, compliant, and focused on execution—not admin.
          </Typography>
        </Paper>

        {/* Features */}
        <Paper sx={{ borderRadius: 3, px: 3, py: 4, mb: 4 }}>
          <Typography variant="h6" mb={1}>🔍 Key Features</Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
            <Chip label="📂 AI Auto-Sorting" color="primary" />
            <Chip label="📄 Smart Summarization" color="success" />
            <Chip label="🔎 Document Q&A (RAG)" color="warning" />
            <Chip label="📁 Google Drive Integration" color="secondary" />
            <Chip label="🛡️ Access Controls & Logs" />
          </Box>
        </Paper>

        {/* Industry Context */}
        <Paper sx={{ borderRadius: 3, px: 3, py: 4, mb: 4 }}>
          <Typography variant="h6" mb={1}>🤝 Industry Collaboration</Typography>
          <Typography variant="body2" color="text.secondary">
            Built under real industry guidance from SCCCI and construction stakeholders, SiteSort AI addresses actual pain points in managing project documentation. It’s a collaboration between students, mentors, and professionals—with real impact.
          </Typography>
        </Paper>
      </Box>

      <SortaBot />
    </MainLayout>
  );
}

export default About;
