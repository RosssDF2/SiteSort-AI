import React, { useState, useContext, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  IconButton,
  Button,
  Stack
} from "@mui/material";
import { UserContext } from "../contexts/UserContext";
import ChatLayout from "../layouts/ChatLayout";
import ChatHistory from "../components/ChatHistory";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InsertChartIcon from "@mui/icons-material/InsertChart";
import SummarizeIcon from "@mui/icons-material/Summarize";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FolderIcon from "@mui/icons-material/Folder";
import axios from "axios";

function ChatBot() {
  const { user } = useContext(UserContext);
  const username = user?.username || user?.email?.split("@")[0] || "Guest";
  const [uploading, setUploading] = useState(false);

  const [history, setHistory] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  // 1) Load saved chats on mount
  useEffect(() => {
    axios.get("/api/chatlog")
      .then(({ data }) => {
        const loaded = data.map((c) => ({
          title: c.title || c.prompt.slice(0, 20),
          messages: c.messages || [
            { sender: "user", text: c.prompt },
            { sender: "ai", text: c.response }
          ]
        }));
        setHistory(loaded);
      })
      .catch((err) => {
        console.error("Failed to load chat history:", err);
      });
  }, []);

  // Auto‑scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const quickPrompts = [
    { label: "List Reports of Project B", icon: <InsertChartIcon /> },
    { label: "Summarize Documents", icon: <SummarizeIcon /> },
    { label: "Analyze May 12 Files", icon: <CalendarTodayIcon /> },
    { label: "Browse by Date", icon: <FolderIcon /> }
  ];

  const startNewChat = () => {
    setMessages([]);
    setActiveIndex(null);
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { sender: "user", text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");

    try {
      const { data } = await axios.post(
        "http://localhost:3001/chat",
        { prompt: text },
        { withCredentials: true }
      );
      const aiMsg = { sender: "ai", text: data };
      const final = [...updated, aiMsg];
      setMessages(final);

      // ✅ Save full chat
      await axios.post(
        "http://localhost:3001/api/chatlog",
        {
          title: updated[0]?.text.slice(0, 20) || "New Chat",
          messages: final
        },
        { withCredentials: true }
      );

      // Update sidebar history
      const title = updated[0]?.text.slice(0, 20) || "New Chat";
      const newHist = [...history];
      if (activeIndex === null) {
        newHist.push({ title, messages: final });
        setActiveIndex(newHist.length - 1);
      } else {
        newHist[activeIndex] = { title, messages: final };
      }
      setHistory(newHist);
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  return (
    <ChatLayout>
      <Box display="flex" height="100vh" overflow="hidden">
        {/* Sidebar */}
        <Box
          sx={{
            width: 300,
            height: "80vh",
            overflowY: "auto",
            borderRight: "1px solid #ddd"
          }}
        >
          <ChatHistory
            history={history}
            activeIndex={activeIndex}
            onSelect={(i) => {
              setActiveIndex(i);
              setMessages(history[i].messages);
            }}
            onNewChat={startNewChat}
          />
        </Box>

        {/* Main Chat Area */}
        <Box sx={{ flex: 1, p: 2 }}>
          <Paper
            elevation={2}
            sx={{
              height: "80vh",
              display: "flex",
              flexDirection: "column",
              position: "relative"
            }}
          >
            {/* Messages */}
            <Box
              ref={scrollRef}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent:
                  messages.length === 0 ? "center" : "flex-start",
                overflowY: "auto",
                bgcolor: "#fafafa"
              }}
            >
              <Container
                maxWidth="sm"
                sx={{ py: 3, maxWidth: 650 }}
              >
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ color: "#10B981", textAlign: "center" }}
                >
                  Chat with SiteSort AI
                </Typography>

                {messages.length === 0 && (
                  <>
                    <Typography
                      variant="body1"
                      color="textSecondary"
                      sx={{ textAlign: "center", mb: 2 }}
                    >
                      Ask anything about your documents or projects.
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={2}
                      justifyContent="center"
                      flexWrap="wrap"
                      sx={{ mb: 3 }}
                    >
                      {quickPrompts.map((qp) => (
                        <Button
                          key={qp.label}
                          variant="outlined"
                          startIcon={qp.icon}
                          onClick={() => sendMessage(qp.label)}
                          sx={{
                            color: "#10B981",
                            borderColor: "#10B981",
                            mb: 1
                          }}
                        >
                          {qp.label}
                        </Button>
                      ))}
                    </Stack>
                  </>
                )}

                {messages.map((msg, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      justifyContent:
                        msg.sender === "user" ? "flex-end" : "flex-start",
                      mb: 1
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1.5,
                        maxWidth: "75%",
                        bgcolor:
                          msg.sender === "user" ? "#e0f7fa" : "#ffffff"
                      }}
                    >
                      <Typography>{msg.text}</Typography>
                    </Paper>
                  </Box>
                ))}
              </Container>
            </Box>

            {/* Floating Input */}
            <Box sx={{ position: "absolute", bottom: 16, width: "100%" }}>
              <Container maxWidth="sm" sx={{ maxWidth: 650 }}>
                <Paper
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 1,
                    borderRadius: 4
                  }}
                >
                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    variant="standard"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && sendMessage(input)
                    }
                    InputProps={{ disableUnderline: true }}
                  />
                  <IconButton component="label">
                    <AttachFileIcon />
                    <input
                      hidden
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        const formData = new FormData();
                        formData.append("file", file);

                        setUploading(true);
                        try {
                          const { data } = await axios.post(
                            "http://localhost:3001/api/chat/upload-summarize",
                            formData,
                            {
                              headers: { "Content-Type": "multipart/form-data" },
                              withCredentials: true
                            }
                          );

                          const userFileMsg = { sender: "user", text: `📎 Uploaded file: ${file.name}` };
                          const aiReplyMsg = { sender: "ai", text: data.summary };

                          const updated = [...messages, userFileMsg, aiReplyMsg];
                          setMessages(updated);

                          // ✅ Save full chat
                          await axios.post(
                            "http://localhost:3001/api/chatlog",
                            {
                              title: updated[0]?.text.slice(0, 20) || "File Upload",
                              messages: updated
                            },
                            { withCredentials: true }
                          );

                          // Update sidebar history
                          const title = updated[0]?.text.slice(0, 20) || "File Upload";
                          const newHist = [...history];
                          if (activeIndex === null) {
                            newHist.push({ title, messages: updated });
                            setActiveIndex(newHist.length - 1);
                          } else {
                            newHist[activeIndex] = { title, messages: updated };
                          }
                          setHistory(newHist);

                        } catch (err) {
                          console.error("Upload error:", err);
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                  </IconButton>
                  <IconButton
                    onClick={() => sendMessage(input)}
                    sx={{ ml: 1, bgcolor: "#10B981", color: "#fff" }}
                  >
                    <SendIcon />
                  </IconButton>
                </Paper>
              </Container>
            </Box>
          </Paper>
        </Box>
      </Box>
    </ChatLayout>
  );
}

export default ChatBot;
