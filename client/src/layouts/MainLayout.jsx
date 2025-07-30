// src/layouts/MainLayout.jsx
import React, { useContext, useState } from "react";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Button,
  Avatar,
  Tooltip
} from "@mui/material";
import Sidebar from "../components/Sidebar";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AppsIcon from "@mui/icons-material/Apps";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import HistoryIcon from "@mui/icons-material/History";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";

// 🧭 Navigation icons (replicates Sidebar structure, icon only)
import { Dashboard, Person, Lock, CloudUpload, Info } from '@mui/icons-material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const navItems = [
  { label: 'Profile', icon: <Person fontSize="small" />, path: '/profile' },
  { label: 'Dashboard', icon: <Dashboard fontSize="small" />, path: '/dashboard' },
  { label: 'SiteSort AI', icon: <SmartToyIcon fontSize="small" />, path: '/chatbot' },
  { label: 'AI Upload', icon: <CloudUpload fontSize="small" />, path: '/upload' },
  { label: 'About', icon: <Info fontSize="small" />, path: '/about' },
];

function MainLayout({ children }) {
  const { user } = useContext(UserContext);
  const username = user?.username || user?.email?.split("@")[0] || "User";
  const navigate = useNavigate();
  const location = useLocation();

  const [accountAnchor, setAccountAnchor] = useState(null);
  const [appsAnchor, setAppsAnchor] = useState(null);

  const handleAccountClick = (e) => setAccountAnchor(e.currentTarget);
  const handleAppsClick = (e) => setAppsAnchor(e.currentTarget);
  const handleClose = () => {
    setAccountAnchor(null);
    setAppsAnchor(null);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch("http://localhost:3001/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Failed to log logout:", err);
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <Box display="flex">
      <Sidebar />
      <Box
        component="main"
        flexGrow={1}
        p={3}
        sx={{ backgroundColor: "#F9FAFB", minHeight: "100vh" }}
      >
        {/* Top Right Icons */}
        <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => navigate("/enquiry")}>
            <HelpOutlineIcon />
          </IconButton>

          {/* Apps dropdown */}
          <IconButton onClick={handleAppsClick}>
            <AppsIcon />
          </IconButton>
          <Menu
            anchorEl={appsAnchor}
            open={Boolean(appsAnchor)}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            transformOrigin={{ vertical: "top", horizontal: "center" }}
          >

            <Box px={1} py={1} display="flex" flexWrap="wrap" gap={1} maxWidth={200}>
              {/* Manager-only nav icons */}
              {user?.role === "manager" &&
                navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Tooltip title={item.label} key={item.label} arrow>
                      <IconButton
                        onClick={() => {
                          navigate(item.path);
                          handleClose();
                        }}
                        size="small"
                        sx={{
                          bgcolor: isActive ? "#10B981" : "#f3f4f6",
                          color: isActive ? "white" : "inherit",
                          "&:hover": {
                            bgcolor: isActive ? "#10B981" : "#e5e7eb",
                          },
                          borderRadius: 2,
                        }}
                      >
                        {item.icon}
                      </IconButton>
                    </Tooltip>
                  );
                })}


              {/* Admin-only shortcut to /admin */}
              {user?.role === "admin" && (
                <Tooltip title="Admin Panel" arrow>
                  <IconButton
                    onClick={() => {
                      navigate("/admin");
                      handleClose();
                    }}
                    size="small"
                    sx={{
                      bgcolor: location.pathname === "/admin" ? "#10B981" : "#f3f4f6",
                      color: location.pathname === "/admin" ? "white" : "inherit",
                      "&:hover": {
                        bgcolor: location.pathname === "/admin" ? "#10B981" : "#e5e7eb",
                      },
                      borderRadius: 2,
                    }}
                  >
                    <Lock fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

            </Box>
          </Menu>

          <IconButton onClick={handleAccountClick}><AccountCircleIcon /></IconButton>

          <Menu
            anchorEl={accountAnchor}
            open={Boolean(accountAnchor)}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Box px={2} py={2} display="flex" alignItems="center" gap={2}>
              <Avatar
                src={user?.avatar ? `http://localhost:3001${user.avatar}` : undefined}
                sx={{ width: 48, height: 48 }}
              />
              <Box>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                <Typography variant="subtitle1">
                  Hi, <span style={{ color: "#10B981" }}>{username}</span>
                </Typography>
              </Box>
            </Box>
            <Divider />
            <MenuItem onClick={() => { navigate("/logs"); handleClose(); }}>
              <HistoryIcon sx={{ fontSize: 18, color: "text.secondary", mr: 1 }} />
              View Logs
            </MenuItem>
            <Box px={2} py={1}>
              <Button variant="outlined" color="error" fullWidth onClick={handleLogout}>
                Sign out
              </Button>
            </Box>
          </Menu>
        </Box>

        {children}
      </Box>
    </Box>
  );
}

export default MainLayout;
