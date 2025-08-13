import React, { useState, useMemo } from "react";
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
import axios from "axios";

function ChatHistory({ history, onSelect, onNewChat, onDeleteChat, onUpdateHistory, activeIndex, formatDate }) {
  const [search, setSearch] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuGlobalIndex, setMenuGlobalIndex] = useState(null); // store global index here

  // Filter chats by search term
  const filteredHistory = useMemo(() => {
    return history.filter((chat) =>
      chat.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [history, search]);

  // Group chats by date (yyyy-mm-dd)
  const groupedChats = useMemo(() => {
    const groups = {};
    filteredHistory.forEach((chat) => {
      // Normalize date part only, ignore time
      const dateKey = chat.createdAt ? chat.createdAt.slice(0, 10) : "Unknown Date";
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(chat);
    });

    // Sort dates descending (latest first)
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

    return sortedDates.map(date => ({
      date,
      chats: groups[date]
    }));
  }, [filteredHistory]);

  const handleMenuOpen = (event, globalIndex) => {
    setMenuAnchor(event.currentTarget);
    setMenuGlobalIndex(globalIndex); // store global index
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuGlobalIndex(null);
  };

  const handleEdit = () => {
    if (menuGlobalIndex === null) return;
    const chat = history[menuGlobalIndex];
    setEditIndex(menuGlobalIndex);
    setEditText(chat.title);
    handleMenuClose();
  };

  const confirmEdit = async () => {
    if (!editText.trim() || editIndex === null) {
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
        title: updatedChat.title
      };

      setEditIndex(null);
      setEditText("");
      onUpdateHistory(updatedHistory);
      onSelect(editIndex);
    } catch (err) {
      console.error("❌ Failed to update title:", err.response?.data || err.message);
      setEditIndex(null);
    }
  };

  const handleDelete = () => {
    setConfirmDeleteIndex(menuGlobalIndex);
    handleMenuClose();
  };

  const confirmDelete = () => {
    if (confirmDeleteIndex !== null) {
      onDeleteChat(confirmDeleteIndex);
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
        {groupedChats.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            No chats found.
          </Typography>
        )}
        {groupedChats.map(({ date, chats }) => (
          <Box key={date} sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                pl: 1,
                mb: 1,
                color: "text.secondary",
                fontWeight: 600,
                userSelect: "none"
              }}
            >
              {formatDate ? formatDate(date) : date}
            </Typography>

            <List dense>
              {chats.map((chat) => {
                const globalIndex = history.findIndex(h => h._id === chat._id);
                return (
                  <ListItem
                    key={chat._id}
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                      bgcolor: globalIndex === activeIndex ? "#d1fae5" : "#fff",
                      borderRadius: 1,
                      boxShadow: 1,
                      px: 1,
                      cursor: "pointer"
                    }}
                    onClick={() => onSelect(globalIndex)}
                  >
                    <Typography
                      variant="body2"
                      sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      title={chat.title}
                    >
                      {chat.title}
                    </Typography>

                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, globalIndex); // pass global index here!
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
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
