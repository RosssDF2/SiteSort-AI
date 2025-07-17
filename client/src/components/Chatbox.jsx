import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';
import MessageBubble from './MessageBubble';

export default function ChatBox() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // FETCH messages from backend (MongoDB)
  useEffect(() => {
    const userId = 'demo-user'; // Replace with real user ID if available
    axios.get(`/api/history?userId=${userId}`)
      .then((res) => {
        setMessages(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Failed to fetch messages", err);
        setMessages([]);
      });
  }, []);

  // SEND message & trigger AI
  const handleSend = async () => {
    if (input.trim() === '') return;
    const userId = 'demo-user'; // Replace with real user ID if available
    const userMsg = { message: input, sender: 'user', userId };
    setMessages((prev) => [...prev, { ...userMsg, text: input }]);
    setInput('');
    setIsTyping(true);
    try {
      // Send user message to backend and get AI response
      const res = await axios.post('/api/assistant', { message: input, userId });
      const aiReply = res.data.response;
      setMessages((prev) => [...prev, { message: aiReply, sender: 'assistant', text: aiReply }]);
    } catch (err) {
      console.error("AI failed:", err);
      setMessages((prev) => [...prev, { text: 'AI failed to respond.', sender: 'assistant' }]);
    } finally {
      setIsTyping(false);
    }
  };

  // DELETE and EDIT features are not implemented in backend, so we disable them for now
  const handleDelete = () => {};
  const startEdit = () => {};
  const handleEditSave = () => {};

  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 3,
      }}
    >
      <Box
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: 2,
          width: '100%',
          maxWidth: '900px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 2,
        }}
      >
        {/* Suggestions */}
        <Box sx={{ marginBottom: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Ask SiteSort
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Example: “Where's the site plan for Project X?”
          </Typography>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: 1,
            marginBottom: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {messages.map((msg, i) =>
            editId === msg.id ? (
              <Box
                key={msg.id || i}
                sx={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <TextField
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  size="small"
                />
                <IconButton onClick={handleEditSave} color="success">
                  <SaveIcon />
                </IconButton>
              </Box>
            ) : (
              <Box
                key={msg.id || i}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <MessageBubble text={msg.text} sender={msg.sender} />
                <Box sx={{ display: 'flex', gap: 0.5, paddingLeft: 1 }}>
                  <IconButton onClick={() => startEdit(msg.id, msg.text)} size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(msg.id)} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )
          )}
          {isTyping && (
            <Box sx={{ alignSelf: 'flex-start', opacity: 0.5 }}>
              <MessageBubble text="ProjectBot is thinking..." sender="bot" />
            </Box>
          )}
        </Box>

        {/* Input */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f1f1f1',
            borderRadius: '24px',
            paddingLeft: 2,
            paddingRight: 1,
          }}
        >
          <TextField
            placeholder="Ask anything"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            variant="standard"
            fullWidth
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: '0.95rem',
                paddingY: 1,
              },
            }}
            sx={{ backgroundColor: 'transparent' }}
          />
          <IconButton onClick={handleSend} color="primary">
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
