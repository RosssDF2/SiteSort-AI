// src/pages/ChatBot.jsx
import React, { useState, useContext } from "react";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AppsIcon from "@mui/icons-material/Apps";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import HistoryIcon from "@mui/icons-material/History";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import MainLayout from "../layouts/MainLayout";
import SortaBot from "../components/SortaBot";
import axios from "axios"; // make sure this is imported at the top
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";



function ChatBot() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const username = user?.username || user?.email?.split("@")[0] || "John Doe";

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Basic chatbot input/output logic
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { sender: "zara", text: "Hi there! I'm ZARA. How can I help with your files today?" }
  ]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");

    try {
      const res = await axios.post("http://localhost:3001/chat", {
        prompt: userMessage,
      });

      const aiReply = res.data;
      setMessages((prev) => [...prev, { sender: "zara", text: aiReply }]);
    } catch (error) {
      console.error("❌ Error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "zara", text: "Sorry, something went wrong with the AI response." }
      ]);
    }
  };

  return (
    <MainLayout>
      {/* Top-right icons */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2} mb={3}>
        <IconButton><HelpOutlineIcon /></IconButton>
        <IconButton><AppsIcon /></IconButton>
        <IconButton><SettingsIcon /></IconButton>
        <IconButton onClick={handleClick}>
          <AccountCircleIcon />
        </IconButton>

        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
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
          <MenuItem onClick={() => navigate("/logs")}>
            <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
            View Logs
          </MenuItem>
          <Box px={2} py={1}>
            <Button variant="outlined" color="error" fullWidth onClick={handleLogout}>
              Sign out
            </Button>
          </Box>
        </Menu>
      </Box>

      {/* Chatbot Greeting */}
      <Box textAlign="center" mb={4}>
        <Avatar
          src="/zara-avatar.png"
          sx={{ width: 80, height: 80, mx: "auto", mb: 2 }}
        />
        <Typography variant="h4" mb={1}>
          Chat with <span style={{ color: "#10B981" }}>Sort-AI</span>
        </Typography>
        <Typography color="text.secondary">
          Ask me anything about your documents, and I’ll help you find what you need.
        </Typography>
      </Box>

      {/* Chat Interface */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3, maxWidth: 800, mx: "auto" }}>
        <List sx={{ maxHeight: 300, overflowY: "auto", mb: 2 }}>
          {messages.map((msg, idx) => (
            <ListItem key={idx} sx={{ justifyContent: msg.sender === "user" ? "flex-end" : "flex-start" }}>
              <ListItemText
                primary={msg.text}
                sx={{
                  maxWidth: "70%",
                  bgcolor: msg.sender === "user" ? "#e0f7fa" : "#f3f4f6",
                  p: 1.5,
                  borderRadius: 2
                }}
              />
            </ListItem>
          ))}
        </List>

        <Box display="flex" alignItems="center" gap={1}>
          {/* Upload button */}
          <IconButton component="label" sx={{ bgcolor: "#f0f0f0", borderRadius: 2 }}>
            <AttachFileIcon />
            <input
              type="file"
              hidden
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setMessages((prev) => [...prev, { sender: "user", text: `[Uploaded: ${file.name}]` }]);
                  // TODO: handle file upload logic here
                }
              }}
            />
          </IconButton>

          {/* Chat input */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          {/* Send button as icon */}
          <IconButton
            color="primary"
            onClick={handleSend}
            sx={{
              bgcolor: "#10B981",
              color: "white",
              borderRadius: 2,
              "&:hover": { bgcolor: "#0EA76C" }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>

      </Paper>


    </MainLayout>
  );
}

export default ChatBot;
