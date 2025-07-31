import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  List,
  ListItem,
  IconButton,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios"; // add this at the top

function ChatHistory({ history, onSelect, onNewChat, onDeleteChat, onUpdateHistory }) {
  const [search, setSearch] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuIndex, setMenuIndex] = useState(null);

  const filteredHistory = history.filter((chat) =>
    chat.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleMenuOpen = (event, index) => {
    setMenuAnchor(event.currentTarget);
    setMenuIndex(index);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuIndex(null);
  };

  const handleEdit = () => {
    const chat = history[menuIndex];
    setEditIndex(menuIndex);
    setEditText(chat.title);
    handleMenuClose();
  };

  const confirmEdit = async () => {
    if (!editText.trim()) {
      setEditIndex(null);
      return;
    }

    const chat = history[editIndex];
    if (!chat || !chat._id) {
      console.error("⛔ Chat missing _id:", chat);
      setEditIndex(null);
      return;
    }

    try {
      const { data: updatedChat } = await axios.put(`/api/chatlog/${chat._id}`, {
        title: editText
      });

      const updatedHistory = [...history];
      updatedHistory[editIndex] = {
        ...updatedHistory[editIndex],
        title: updatedChat.title // ✅ apply new title locally
      };

      // ✅ reflect changes in ChatBot
      setEditIndex(null);
      setEditText("");
      onUpdateHistory(updatedHistory); // ✅ CORRECT
      onSelect(editIndex);
    } catch (err) {
      console.error("❌ Failed to update title:", err.response?.data || err.message);
      setEditIndex(null);
    }
  };


  const handleDelete = () => {
    setConfirmDeleteIndex(menuIndex);
    handleMenuClose();
  };

  const confirmDelete = () => {
    if (typeof confirmDeleteIndex === "number") {
      onDeleteChat(confirmDeleteIndex); // ✅ delegate to ChatBot.jsx
    }
    setConfirmDeleteIndex(null);
  };


  const handleClearAll = () => {
    history.splice(0, history.length);
    onSelect(0);
  };

  return (
    <Box
      width={280}
      height="100vh"
      bgcolor="#f8f9fa"
      p={2}
      display="flex"
      flexDirection="column"
    >
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onNewChat}
        sx={{
          mb: 2,
          textTransform: "none",
          bgcolor: "#10B981",
          '&:hover': { bgcolor: "#0e9b74" }
        }}
      >
        New Chat
      </Button>

      <TextField
        placeholder="Search chats"
        size="small"
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Divider sx={{ mb: 2 }} />
      <Typography
        variant="subtitle1"
        sx={{ mb: 1, color: "text.secondary", fontWeight: 500 }}
      >
        Chats
      </Typography>

      <Box flexGrow={1} overflow="auto">
        <List dense>
          {filteredHistory.map((chat, index) => (
            <ListItem
              key={index}
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
                bgcolor: "#fff",
                borderRadius: 1,
                boxShadow: 1,
                px: 1
              }}
              onClick={() => onSelect(index)}
            >
              <Typography
                variant="body2"
                sx={{ flex: 1, cursor: "pointer" }}
                noWrap
              >
                {chat.title}
              </Typography>

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuOpen(e, index);
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider sx={{ my: 2 }} />
      <Button
        variant="text"
        color="error"
        onClick={handleClearAll}
        sx={{ textTransform: "none" }}
      >
        Clear conversations
      </Button>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>

      <Dialog open={editIndex !== null} onClose={() => setEditIndex(null)}>
        <DialogTitle>Edit Chat Title</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditIndex(null)} sx={{ color: "#10B981" }}>Cancel</Button>
          <Button
            onClick={confirmEdit}
            variant="contained"
            sx={{
              bgcolor: "#10B981",
              color: "#fff",
              "&:hover": { bgcolor: "#0e9b74" }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDeleteIndex !== null}
        onClose={() => setConfirmDeleteIndex(null)}
      >
        <DialogTitle>Delete Chat?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this chat?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteIndex(null)} sx={{ color: "#10B981" }}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ChatHistory;
