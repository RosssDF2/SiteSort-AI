// src/layouts/ChatLayout.jsx
import React, { useContext, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  Button,
  Tooltip
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AppsIcon from "@mui/icons-material/Apps";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import HistoryIcon from "@mui/icons-material/History";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";

import { Dashboard, Person, Lock, CloudUpload, Info } from "@mui/icons-material";
import SmartToyIcon from "@mui/icons-material/SmartToy";

const navItems = [
  { label: 'Profile', icon: <Person fontSize="small" />, path: '/profile' },
  { label: 'Dashboard', icon: <Dashboard fontSize="small" />, path: '/dashboard' },
  { label: 'SiteSort AI', icon: <SmartToyIcon fontSize="small" />, path: '/chatbot' },
  { label: 'AI Upload', icon: <CloudUpload fontSize="small" />, path: '/upload' },
  { label: 'About', icon: <Info fontSize="small" />, path: '/about' },
];

function ChatLayout({ children }) {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const username = user?.username || user?.email?.split("@")[0] || "User";

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
    <Box sx={{ backgroundColor: "#F9FAFB", minHeight: "100vh" }}>
      {/* Header Row */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        px={3}
        py={2}
        borderBottom="1px solid #e5e7eb"
      >
        {/* Logo + Text */}
        <Box display="flex" alignItems="center" gap={1}>
          <img src="/logo.png" alt="SiteSort AI" style={{ height: 40 }} />
          <Typography variant="h6" fontWeight={700}>
            Site<span style={{ color: "#9C27B0" }}>Sort</span> AI
          </Typography>
        </Box>

        {/* Icons */}
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate("/enquiry")}>
            <HelpOutlineIcon />
          </IconButton>
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
                          bgcolor: isActive ? "#9C27B0" : "#f3f4f6",
                          color: isActive ? "white" : "inherit",
                          "&:hover": {
                            bgcolor: isActive ? "#7B1FA2" : "#e5e7eb",
                          },
                          borderRadius: 2,
                        }}
                      >
                        {item.icon}
                      </IconButton>
                    </Tooltip>
                  );
                })}

              {user?.role === "admin" && (
                <Tooltip title="Admin Panel" arrow>
                  <IconButton
                    onClick={() => {
                      navigate("/admin");
                      handleClose();
                    }}
                    size="small"
                    sx={{
                      bgcolor: location.pathname === "/admin" ? "#9C27B0" : "#f3f4f6",
                      color: location.pathname === "/admin" ? "white" : "inherit",
                      "&:hover": {
                        bgcolor: location.pathname === "/admin" ? "#7B1FA2" : "#e5e7eb",
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
          <IconButton><SettingsIcon /></IconButton>
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
                  Hi, <span style={{ color: "#9C27B0" }}>{username}</span>
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
      </Box>

      <Box px={3} py={4}>
        {children}
      </Box>
    </Box>
  );
}

export default ChatLayout;
