// src/pages/ChatBot.jsx
import React, { useState, useContext } from "react";
import {
  Box,
  Typography,
  Avatar,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import { UserContext } from "../contexts/UserContext";
import ChatLayout from "../layouts/ChatLayout"; // ✅ use ChatLayout here
import axios from "axios";
import ChatHistory from "../components/ChatHistory";

function ChatBot() {
  const { user } = useContext(UserContext);
  const username = user?.username || user?.email?.split("@")[0] || "John Doe";
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChat, setActiveChat] = useState(0);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { sender: "zara", text: "Hi there! I'm ZARA. How can I help with your files today?" }
  ]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    const newMessages = [...messages, { sender: "user", text: userMessage }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await axios.post("http://localhost:3001/chat", {
        prompt: userMessage,
      });

      const aiReply = res.data;
      const updated = [...newMessages, { sender: "zara", text: aiReply }];
      setMessages(updated);

      // Save to chat history
      const updatedHistory = [...chatHistory];
      updatedHistory[activeChat] = { title: updated[1]?.text?.slice(0, 20) || "Chat", messages: updated };
      setChatHistory(updatedHistory);
    } catch (error) {
      console.error("❌ Error:", error);
    }
  };


  return (
    <ChatLayout>
      <Box display="flex">
        {/* Chat History Sidebar */}
        <ChatHistory
          history={chatHistory}
          onSelect={(index) => {
            setMessages(chatHistory[index].messages);
            setActiveChat(index);
          }}
        />

        {/* Main Chat UI */}
        <Box flex={1} px={4} py={2}>
          <Box textAlign="center" mb={4}>
            <Avatar
              src="/zara-avatar.png"
              sx={{ width: 80, height: 80, mx: "auto", mb: 2 }}
            />
            <Typography variant="h4" mb={1}>
              Chat with <span style={{ color: "#10B981" }}>ZARA</span>
            </Typography>
            <Typography color="text.secondary">
              Ask me anything about your documents, and I’ll help you find what you need.
            </Typography>
          </Box>

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

            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type your question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button variant="contained" onClick={handleSend}>
                Send
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </ChatLayout>
  );

}

export default ChatBot;
