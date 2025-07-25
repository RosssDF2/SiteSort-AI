import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Box, Typography, Paper } from "@mui/material";
import { UserContext } from "../contexts/UserContext";

const ChatHistory = () => {
  const [messages, setMessages] = useState([]);
  const { user } = useContext(UserContext);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axios.get("/api/chatlog", {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to fetch chat logs", err);
      }
    };
    fetchChats();
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>🗨️ Chat History</Typography>
      {messages.map((msg, idx) => (
        <Box key={idx} mb={2}>
          <Paper elevation={3} sx={{ p: 2, background: "#f3f3f3" }}>
            <Typography variant="body2" color="textSecondary">{new Date(msg.timestamp).toLocaleString()}</Typography>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>🧑‍💼 You:</Typography>
            <Typography>{msg.prompt}</Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>🤖 Sorta:</Typography>
            <Typography>{msg.response}</Typography>
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

export default ChatHistory;
