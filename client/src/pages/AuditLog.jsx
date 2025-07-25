import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AppsIcon from "@mui/icons-material/Apps";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import MainLayout from "../layouts/MainLayout";

function AuditLog() {
  const { user } = useContext(UserContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3001/api/logs", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setLogs(data.logs || []);
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = async () => {
    const token = localStorage.getItem("token");

    // 🔐 Tell backend to log the logout
    if (token) {
      try {
        await fetch("http://localhost:3001/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to log logout:", err);
      }
    }

    // 🚪 Clear session
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };


  return (
    <MainLayout>

      {/* CONTENT */}
      <Box sx={{ maxWidth: 800, mx: "auto", px: { xs: 2, md: 0 } }}>
        {/* Title */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Activity Logs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track recent activity and access history in your SiteSort AI account
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
              Overview of Your Activity
            </Typography>
            <Typography variant="body1" color="text.secondary">
              See when and where your account was accessed, and track any key actions such as login, logout, profile edits and file uploads.
            </Typography>
          </Box>
          <Box flex={1} display="flex" justifyContent="center">
            <img src="/tree.png" alt="Illustration" style={{ maxWidth: "100%", maxHeight: 220 }} />
          </Box>
        </Box>

        {/* Logs Table */}
        <Paper sx={{ borderRadius: 3, px: 3, py: 3 }}>
          {loading ? (
            <Box textAlign="center" my={4}><CircularProgress /></Box>
          ) : logs.length === 0 ? (
            <Typography textAlign="center" py={4}>No activity logs found.</Typography>
          ) : (
            <TableContainer sx={{
              maxHeight: 400,
              overflowY: "auto",
              borderRadius: 2,
              '&::-webkit-scrollbar': {
                width: '8px'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#ccc',
                borderRadius: '4px'
              }
            }}>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        {log.action}
                        {log.metadata?.fieldsChanged?.length > 0 && (
                          <Typography variant="caption" color="text.secondary" ml={1}>
                            ({log.metadata.fieldsChanged.join(", ")})
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </MainLayout>
  );
}

export default AuditLog;
