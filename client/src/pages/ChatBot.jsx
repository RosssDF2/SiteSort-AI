import React, { useState, useContext, useEffect, useRef } from "react";
import {
  Box, Container, Typography, Paper, TextField, IconButton,
  Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, List, ListItem, ListItemText,
  ListItemIcon, Chip, Divider, Breadcrumbs, Link, Switch, FormControlLabel, 
  Tooltip, CircularProgress, Snackbar, Alert
} from "@mui/material";

import { UserContext } from "../contexts/UserContext";
import ChatLayout from "../layouts/ChatLayout";
import ChatHistory from "../components/ChatHistory";
import SendIcon from "@mui/icons-material/Send";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InsertChartIcon from "@mui/icons-material/InsertChart";
import SummarizeIcon from "@mui/icons-material/Summarize";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FolderIcon from "@mui/icons-material/Folder";
import DescriptionIcon from "@mui/icons-material/Description";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GetAppIcon from "@mui/icons-material/GetApp";
import DownloadIcon from "@mui/icons-material/Download";
import PreviewIcon from "@mui/icons-material/Preview";
import { Link as RouterLink } from "react-router-dom";
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

  // Add CSS for spinner animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // File browser state
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [projectFiles, setProjectFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  
  // Folder navigation state
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [navigationPath, setNavigationPath] = useState([]); // Array of {id, name} for breadcrumb
  
  // Attached files state (for chat context)
  const [attachedFiles, setAttachedFiles] = useState([]); // Files attached to current chat session
  const [loadingFileContent, setLoadingFileContent] = useState(false);
  const [autoClearFiles, setAutoClearFiles] = useState(true); // Auto-clear files after AI response

  // Dialog state for saving AI response
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [lastAIMessageIndex, setLastAIMessageIndex] = useState(null);

  // Edit message state
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [isProcessingEdit, setIsProcessingEdit] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Helper: format date string "YYYY-MM-DD" to "13 Aug 2025"
  const formatDate = (dateStr) => {
    const options = { day: "numeric", month: "short", year: "numeric" };
    return new Date(dateStr).toLocaleDateString("en-GB", options);
  };

  // Helper: check if message is a summary or report
  const isSummaryOrReport = (message) => {
    if (!message) return false;
    const isAIMessage = message.sender === "ai";
    const hasSummaryKeywords = message.metadata?.userQuery?.toLowerCase().includes('summary') || 
                              message.metadata?.userQuery?.toLowerCase().includes('report');
    return isAIMessage && hasSummaryKeywords;
  };

  // Handle PDF operations with error handling and loading states
  const handlePdfOperation = async (msg, operation = 'download') => {
    try {
      setPdfLoading(true);
      
      // Validate message and PDF data
      if (!msg) {
        throw new Error('Message data is missing');
      }
      
      if (!msg.pdf) {
        // If PDF is not available, try to regenerate it
        const endpoint = msg.metadata?.fileCount ? '/api/chat/chat-with-files' : '/api/chat/chat';
        const payload = {
          prompt: msg.text,
          files: msg.metadata?.filesAnalyzed?.map(name => ({ fileName: name })) || []
        };
        
        setSnackbarMessage('Regenerating PDF...');
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
        
        const { data } = await axios.post(endpoint, payload);
        if (!data.pdf) {
          throw new Error('Failed to regenerate PDF');
        }
        msg = { ...msg, ...data };
      }

      // Convert base64 to binary
      const binaryStr = atob(msg.pdf);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      if (operation === 'download') {
        const a = document.createElement('a');
        a.href = url;
        a.download = msg.filename || 'SiteSort_Analysis.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setSnackbarMessage('PDF downloaded successfully');
        setSnackbarSeverity('success');
      } else {
        window.open(url, '_blank');
        setSnackbarMessage('PDF opened in new tab');
        setSnackbarSeverity('info');
      }

      URL.revokeObjectURL(url);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('PDF operation failed:', error);
      setSnackbarMessage(error.message || 'Failed to process PDF. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setPdfLoading(false);
    }
  };

  // Load projects when file dialog opens
  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const { data } = await axios.get("http://localhost:3001/api/projects");
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Load files for selected project or folder
  const loadProjectFiles = async (projectName, folderId = null) => {
    if (!projectName && !folderId) return;
    setLoadingFiles(true);
    try {
      let url;
      if (folderId) {
        // Loading files from a specific folder
        url = `http://localhost:3001/api/files/folder?folder=${folderId}`;
      } else {
        // Loading files from project root
        url = `http://localhost:3001/api/files?project=${encodeURIComponent(projectName)}`;
      }
      
      const { data } = await axios.get(url);
      setProjectFiles(data);
    } catch (err) {
      console.error("Failed to load project files:", err);
      setProjectFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  // Navigate into a folder
  const navigateToFolder = async (folder) => {
    const newPath = [...navigationPath, { id: folder.id, name: folder.name }];
    setNavigationPath(newPath);
    setCurrentFolderId(folder.id);
    await loadProjectFiles(null, folder.id);
  };

  // Navigate back to parent folder or project root
  const navigateBack = async (targetIndex = -1) => {
    if (targetIndex === -1) {
      // Go back one level
      const newPath = navigationPath.slice(0, -1);
      setNavigationPath(newPath);
      
      if (newPath.length === 0) {
        // Back to project root
        setCurrentFolderId(null);
        await loadProjectFiles(selectedProject);
      } else {
        // Back to parent folder
        const parentFolder = newPath[newPath.length - 1];
        setCurrentFolderId(parentFolder.id);
        await loadProjectFiles(null, parentFolder.id);
      }
    } else {
      // Navigate to specific breadcrumb level
      const newPath = navigationPath.slice(0, targetIndex + 1);
      setNavigationPath(newPath);
      
      if (targetIndex === -1 || newPath.length === 0) {
        setCurrentFolderId(null);
        await loadProjectFiles(selectedProject);
      } else {
        const targetFolder = newPath[newPath.length - 1];
        setCurrentFolderId(targetFolder.id);
        await loadProjectFiles(null, targetFolder.id);
      }
    }
  };

  // Handle project selection
  const handleProjectChange = (projectName) => {
    setSelectedProject(projectName);
    setSelectedFiles([]);
    setProjectFiles([]);
    setCurrentFolderId(null);
    setNavigationPath([]);
    if (projectName) {
      loadProjectFiles(projectName);
    }
  };

  // Toggle file selection
  const toggleFileSelection = (file) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  // Select all selectable files
  const selectAllFiles = () => {
    const selectableFiles = projectFiles.filter(file => isFileSelectable(file));
    setSelectedFiles(selectableFiles);
  };

  // Clear all selected files
  const clearSelection = () => {
    setSelectedFiles([]);
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType) => {
    if (mimeType === 'application/vnd.google-apps.folder') return <FolderIcon sx={{ color: '#10B981' }} />;
    if (mimeType === 'application/pdf') return <PictureAsPdfIcon sx={{ color: '#f44336' }} />;
    if (mimeType.includes('text') || mimeType === 'application/vnd.google-apps.document') return <DescriptionIcon sx={{ color: '#2196f3' }} />;
    return <DescriptionIcon sx={{ color: '#757575' }} />;
  };

  // Check if an item is selectable (not a folder)
  const isFileSelectable = (item) => {
    return item.mimeType !== 'application/vnd.google-apps.folder';
  };

  // Remove a specific attached file
  const removeAttachedFile = (fileId) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Start editing a message
  const startEditMessage = (messageIndex, currentText) => {
    setEditingMessageIndex(messageIndex);
    setEditText(currentText);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingMessageIndex(null);
    setEditText("");
  };

  // Save edited message and regenerate response
  const saveEditedMessage = async () => {
    if (!editText.trim() || isProcessingEdit) return;

    setIsProcessingEdit(true);
    const messageIndex = editingMessageIndex;
    
    // Update the user message
    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      text: editText.trim()
    };

    // Remove all AI responses after this message
    const messagesToKeep = updatedMessages.slice(0, messageIndex + 1);
    
    setMessages(messagesToKeep);
    setEditingMessageIndex(null);
    setEditText("");

    // Regenerate AI response with the edited message
    const userMessage = editText.trim();
    const updatedMessagesWithAI = [
      ...messagesToKeep,
      { sender: "ai", text: "Thinking..." }
    ];
    setMessages(updatedMessagesWithAI);

    try {
      let endpoint = "http://localhost:3001/api/chat/chat";
      let payload = { prompt: userMessage };

      // Use attached files if available
      const filesToUse = attachedFiles.length > 0 ? attachedFiles.map(f => ({
        fileName: f.fileName,
        content: f.content
      })) : null;

      if (filesToUse && filesToUse.length > 0) {
        endpoint = "http://localhost:3001/api/chat/chat-with-files";
        payload.files = filesToUse;
      }

      const { data: reply } = await axios.post(endpoint, payload, { withCredentials: true });

      const finalMessages = [
        ...messagesToKeep,
        { sender: "ai", text: reply }
      ];
      
      setMessages(finalMessages);
      
      // Auto-clear attached files after AI response (if files were used and auto-clear is enabled)
      if (attachedFiles.length > 0 && autoClearFiles) {
        setAttachedFiles([]);
      }
      
      // Update or create chat history
      if (activeIndex !== null) {
        // Update existing chat
        const chatUpdateData = {
          title: finalMessages[0]?.text.slice(0, 20) || "Edited Chat",
          messages: finalMessages
        };
        
        await axios.put(
          `http://localhost:3001/api/chatlog/${history[activeIndex]._id}/messages`,
          chatUpdateData,
          { withCredentials: true }
        );
        
        // Update local history
        const updatedHistory = [...history];
        updatedHistory[activeIndex] = { 
          ...updatedHistory[activeIndex], 
          title: chatUpdateData.title,
          messages: finalMessages,
          updatedAt: new Date().toISOString()
        };
        setHistory(updatedHistory);
      } else {
        // Create new chat (if somehow we're editing without an active chat)
        const { data } = await axios.post(
          "http://localhost:3001/api/chatlog",
          {
            title: finalMessages[0]?.text.slice(0, 20) || "New Chat",
            messages: finalMessages,
            createdAt: new Date().toISOString()
          },
          { withCredentials: true }
        );
        
        const newHistory = [data, ...history];
        setHistory(newHistory);
        setActiveIndex(0);
      }

      // Auto-clear files if enabled
      if (autoClearFiles) {
        setAttachedFiles([]);
      }

    } catch (err) {
      console.error("Error regenerating response:", err);
      
      let errorMessage = "Sorry, I encountered an error while processing your edited message. Please try again.";
      
      // Provide more specific error messages
      if (err.response?.status === 401) {
        errorMessage = "Session expired. Please refresh the page and try again.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error occurred. Please try again in a moment.";
      } else if (!navigator.onLine) {
        errorMessage = "No internet connection. Please check your connection and try again.";
      }
      
      const errorMessages = [
        ...messagesToKeep,
        { sender: "ai", text: errorMessage }
      ];
      setMessages(errorMessages);
      
      // Still try to save the user's edited message even if AI response failed
      if (activeIndex !== null) {
        try {
          const chatUpdateData = {
            title: messagesToKeep[0]?.text.slice(0, 20) || "Edited Chat",
            messages: messagesToKeep
          };
          
          await axios.put(
            `http://localhost:3001/api/chatlog/${history[activeIndex]._id}/messages`,
            chatUpdateData,
            { withCredentials: true }
          );
          
          // Update local history with at least the edited message
          const updatedHistory = [...history];
          updatedHistory[activeIndex] = { 
            ...updatedHistory[activeIndex], 
            title: chatUpdateData.title,
            messages: messagesToKeep,
            updatedAt: new Date().toISOString()
          };
          setHistory(updatedHistory);
        } catch (saveErr) {
          console.error("Failed to save edited message:", saveErr);
        }
      }
    } finally {
      setIsProcessingEdit(false);
    }
  };

  // Clear all attached files
  const clearAllAttachedFiles = () => {
    setAttachedFiles([]);
  };

  // Close file dialog and reset state
  const closeFileDialog = () => {
    setFileDialogOpen(false);
    setSelectedFiles([]);
    setSelectedProject("");
    setProjectFiles([]);
    setCurrentFolderId(null);
    setNavigationPath([]);
  };

  // Handle file attachment with retry logic
  const handleAttachFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    setFileDialogOpen(false);
    setLoadingFileContent(true);

    const maxRetries = 3; // Maximum number of retry attempts
    const newAttachedFiles = [];
    const failedFiles = [];
    
    for (const file of selectedFiles) {
      let attempts = 0;
      let success = false;
      
      while (attempts < maxRetries && !success) {
        try {
          attempts++;
          console.log(`Attempting to load ${file.name} (Attempt ${attempts}/${maxRetries})`);
          
          const { data } = await axios.get(`http://localhost:3001/api/files/content/${file.id}`, {
            timeout: 30000, // 30-second timeout
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          // Validate the response data
          if (!data || !data.content) {
            throw new Error('Invalid response data');
          }
          
          newAttachedFiles.push({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            content: data.content,
            fileName: data.fileName
          });
          
          success = true;
          console.log(`Successfully loaded ${file.name}`);
          
        } catch (err) {
          console.error(`Attempt ${attempts} failed for ${file.name}:`, err);
          
          if (attempts === maxRetries) {
            failedFiles.push({
              name: file.name,
              error: err.response?.data?.error || 
                    err.response?.data?.message || 
                    err.message || 
                    'Unknown error occurred'
            });
          } else {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          }
        }
      }
    }

    // Update attached files with successfully loaded ones
    if (newAttachedFiles.length > 0) {
      setAttachedFiles(prev => {
        // Remove any duplicates based on file ID
        const existingIds = new Set(prev.map(f => f.id));
        const uniqueNewFiles = newAttachedFiles.filter(f => !existingIds.has(f.id));
        return [...prev, ...uniqueNewFiles];
      });
    }

    // Show error message if any files failed
    if (failedFiles.length > 0) {
      const errorMessage = failedFiles.map(f => 
        `• ${f.name}: ${f.error}`
      ).join('\n');
      
      alert(`Some files could not be loaded:\n${errorMessage}\n\nPlease try again or select different files.`);
    }

    // Reset state
    setLoadingFileContent(false);
    setSelectedFiles([]);
    setSelectedProject("");
    setProjectFiles([]);
    setCurrentFolderId(null);
    setNavigationPath([]);
  };

  // Load chat history, map and sort by newest first
  useEffect(() => {
    axios.get("/api/chatlog")
      .then(({ data }) => {
        const loaded = data.map((c) => ({
          _id: c._id,
          title: c.title || c.prompt?.slice(0, 20),
          messages: c.messages || [
            { sender: "user", text: c.prompt },
            { sender: "ai", text: c.response }
          ],
          createdAt: c.createdAt || new Date().toISOString()
        })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHistory(loaded);
      })
      .catch((err) => {
        console.error("Failed to load chat history:", err);
      });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const quickPrompts = [
    { label: "Summarize attached files", icon: <SummarizeIcon /> },
    { label: "Find key insights", icon: <InsertChartIcon /> },
    { label: "Compare documents", icon: <CalendarTodayIcon /> },
    { label: "Browse more files", icon: <FolderIcon /> }
  ];

  const deleteChat = async (index) => {
    const chat = history[index];
    if (!chat || !chat._id) {
      console.error("⛔ Chat not found or missing _id:", chat);
      return;
    }
    const confirmed = window.confirm("Delete this chat permanently?");
    if (!confirmed) return;
    try {
      await axios.delete(`/api/chatlog/${chat._id}`);
      const updated = [...history];
      updated.splice(index, 1);
      setHistory(updated);
      if (activeIndex === index) {
        setMessages([]);
        setActiveIndex(null);
      }
    } catch (err) {
      console.error("❌ Failed to delete:", err.response?.data || err.message);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveIndex(null);
    setAttachedFiles([]); // Clear attached files when starting new chat
  };

  const sendMessage = async (text, fileContext = null) => {
    if (!text.trim()) return;
    console.log("🚀 Starting sendMessage with:", text);
    const userMsg = { 
      sender: "user", 
      text,
      timestamp: new Date().toISOString()
    };
    console.log("👤 Created user message:", userMsg);
    const updated = [...messages, userMsg];
    console.log("📝 Updating messages array, new length:", updated.length);
    setMessages(updated);
    setInput("");

    try {
      let endpoint = "http://localhost:3001/api/chat/chat";
      let payload = { prompt: text };

      // Use attached files if available, or provided fileContext
      const filesToUse = fileContext || (attachedFiles.length > 0 ? attachedFiles.map(f => ({
        fileName: f.fileName,
        content: f.content
      })) : null);

      if (filesToUse && filesToUse.length > 0) {
        endpoint = "http://localhost:3001/api/chat/chat-with-files";
        payload.files = filesToUse;
      }

      const { data } = await axios.post(endpoint, payload, { withCredentials: true });

      console.log("🤖 Received AI response:", data);
      const aiMsg = { 
        sender: "ai", 
        text: data.text || data, // Support both new and old response format
        pdf: data.pdf,
        filename: data.filename,
        timestamp: data.timestamp || new Date().toISOString(),
        metadata: {
          ...(data.metadata || {}),
          userQuery: text
        }
      };
      console.log("📝 Creating AI message object:", aiMsg);
      const final = [...updated, aiMsg];
      console.log("🔄 Setting messages array, length:", final.length);
      setMessages(final);
      console.log("💬 Messages updated, opening save dialog...");

      // Auto-clear attached files after AI response (if files were used and auto-clear is enabled)
      if (attachedFiles.length > 0 && autoClearFiles) {
        setAttachedFiles([]);
      }

      // Save or update chat log
      let savedChat;
      const newHist = [...history];
      
      if (activeIndex === null) {
        // Creating new chat
        const { data } = await axios.post(
          "http://localhost:3001/api/chatlog",
          {
            title: updated[0]?.text.slice(0, 20) || "New Chat",
            messages: final,
            createdAt: new Date().toISOString()
          },
          { withCredentials: true }
        );
        savedChat = data;
        newHist.unshift({ _id: savedChat._id, title: savedChat.title, messages: final, createdAt: savedChat.createdAt });
        setActiveIndex(0);
      } else {
        // Updating existing chat
        const existingChatId = history[activeIndex]._id;
        const { data } = await axios.put(
          `http://localhost:3001/api/chatlog/${existingChatId}/messages`,
          {
            title: history[activeIndex].title, // Keep existing title
            messages: final
          },
          { withCredentials: true }
        );
        savedChat = data;
        newHist[activeIndex] = { _id: savedChat._id, title: savedChat.title, messages: final, createdAt: savedChat.createdAt };
      }
      
      setHistory(newHist);

      // Show save dialog for all AI responses
      console.log("📝 Opening save dialog...");
      const aiMessageIndex = final.length - 1;
      console.log("💾 Setting lastAIMessageIndex to:", aiMessageIndex);
      setLastAIMessageIndex(aiMessageIndex);
      console.log("🔓 Opening save dialog (setSaveDialogOpen to true)");
      setSaveDialogOpen(true);
      console.log("✅ Dialog state updates complete");
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  // Handle saving AI message as summary or report
  const handleSave = async (type) => {
    console.log("💾 Attempting to save message...", { type, lastAIMessageIndex });
    if (lastAIMessageIndex === null) {
      console.warn("❌ No message selected for saving");
      alert("Error: No message selected for saving");
      return;
    }
    const msg = messages[lastAIMessageIndex];
    if (!msg || msg.sender !== "ai") {
      console.warn("❌ Invalid message for saving:", msg);
      alert("Error: Invalid message for saving");
      return;
    }

    try {
      console.log("🔄 Sending POST request to save as", type);
      const response = await axios.post(`http://localhost:3001/api/${type}`, {
        content: msg.text,
        chatId: history[activeIndex]?._id || null,
        timestamp: new Date().toISOString()
      });
      console.log("✅ Save successful:", response.data);

      alert(`Successfully saved as ${type}!`);
      setSaveDialogOpen(false);
      setLastAIMessageIndex(null);
    } catch (err) {
      console.error("❌ Failed to save:", err);
      alert(`Error saving as ${type}: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDownloadPDF = async (messageText, messageIndex) => {
    try {
      console.log('Starting PDF download...', {
        messageLength: messageText.length,
        messageIndex,
        attachedFilesCount: attachedFiles.length
      });

      const response = await axios.post('http://localhost:3001/api/pdf/generate-report-pdf', {
        title: `AI Report - ${new Date().toLocaleDateString()}`,
        aiResponse: messageText,
        userQuery: messageIndex > 0 ? messages[messageIndex - 1]?.text || "" : "",
        filesAnalyzed: attachedFiles.map(file => file.name) || [],
        chatId: history[activeIndex]?._id || null,
        timestamp: new Date().toISOString()
      }, {
        responseType: 'blob' // Important for binary data
      });

      console.log('PDF response received:', response.status, response.headers['content-type']);

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.setAttribute('download', `SiteSort-AI-Report-${timestamp}.pdf`);
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
      
      console.log('PDF downloaded successfully');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status:', error.response.status);
      }
      alert('Failed to generate PDF report. Please try again.');
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
            onDeleteChat={deleteChat}
            onUpdateHistory={setHistory}
            formatDate={formatDate}
          />
        </Box>

        {/* Main Chat Area */}
        <Box sx={{ flex: 1, p: 2 }}>
          <Paper
            elevation={0}
            sx={{
              height: "80vh",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              borderRadius: 3,
              border: "1px solid #e5e7eb",
              background: "linear-gradient(135deg, #fefefe 0%, #f8fffe 100%)",
              overflow: "hidden"
            }}
          >
            {/* Messages */}
            <Box
              ref={scrollRef}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: messages.length === 0 ? "center" : "flex-start",
                overflowY: "auto",
                bgcolor: "transparent",
                paddingBottom: "140px", // Add padding to prevent overlap with input area
                scrollbarWidth: "thin",
                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "transparent",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "#d1d5db",
                  borderRadius: "10px",
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  background: "#9ca3af",
                }
              }}
            >
              <Container maxWidth="sm" sx={{ py: 3, pb: 2, maxWidth: 650 }}>
                <Box sx={{ 
                  textAlign: "center", 
                  mb: 4,
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}>
                  <Typography
                    variant="h3"
                    gutterBottom
                    sx={{ 
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      mb: 1
                    }}
                  >
                    SiteSort AI
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{ 
                      color: "#6b7280",
                      fontWeight: 400,
                      fontSize: "1rem"
                    }}
                  >
                    Your intelligent file analysis assistant
                  </Typography>
                </Box>

                {/* Navigation buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
                  <Button 
                    component={RouterLink} 
                    to="/reports" 
                    variant="outlined" 
                    sx={{ 
                      color: "#10B981", 
                      borderColor: "#10B981",
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 500,
                      px: 3,
                      py: 1,
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        bgcolor: "#10B981",
                        color: "white",
                        transform: "translateY(-1px)",
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
                      }
                    }}
                  >
                    📊 View Reports
                  </Button>
                  <Button 
                    component={RouterLink} 
                    to="/summaries" 
                    variant="outlined" 
                    sx={{ 
                      color: "#10B981", 
                      borderColor: "#10B981",
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 500,
                      px: 3,
                      py: 1,
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        bgcolor: "#10B981",
                        color: "white",
                        transform: "translateY(-1px)",
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
                      }
                    }}
                  >
                    📝 View Summaries
                  </Button>
                </Box>

                {messages.length === 0 && (
                  <>
                    <Box sx={{ 
                      textAlign: "center", 
                      mb: 4,
                      p: 3,
                      bgcolor: "rgba(16, 185, 129, 0.05)",
                      borderRadius: 3,
                      border: "1px solid rgba(16, 185, 129, 0.1)"
                    }}>
                      <Typography
                        variant="h6"
                        sx={{ 
                          color: "#10B981", 
                          mb: 2,
                          fontWeight: 600
                        }}
                      >
                        Welcome, {username}! 👋
                      </Typography>
                      <Typography
                        variant="body1"
                        color="textSecondary"
                        sx={{ 
                          mb: 2,
                          lineHeight: 1.6
                        }}
                      >
                        Attach files using the 📎 button, then ask questions about them. 
                        Files will appear as tabs above the input area for easy management.
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ 
                          color: "#6b7280",
                          fontStyle: "italic"
                        }}
                      >
                        Try one of the quick actions below to get started:
                      </Typography>
                    </Box>
                    <Box
                      sx={{ 
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 2,
                        mb: 3 
                      }}
                    >
                      {quickPrompts.map((qp) => (
                        <Button
                          key={qp.label}
                          variant="contained"
                          startIcon={qp.icon}
                          onClick={() => sendMessage(qp.label)}
                          sx={{ 
                            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                            color: "white",
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 500,
                            px: 3,
                            py: 1.5,
                            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                              transform: "translateY(-2px)",
                              boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)"
                            }
                          }}
                        >
                          {qp.label}
                        </Button>
                      ))}
                    </Box>
                  </>
                )}

                {messages.map((msg, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                      mb: 2,
                      alignItems: "flex-end"
                    }}
                  >
                    {/* AI Avatar */}
                    {msg.sender === "ai" && (
                      <Box sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: "50%", 
                        bgcolor: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                        background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        mr: 1,
                        mb: 0.5,
                        fontSize: "14px"
                      }}>
                        🤖
                      </Box>
                    )}
                    
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        maxWidth: "75%",
                        borderRadius: msg.sender === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                        background: msg.sender === "user" 
                          ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" 
                          : "#ffffff",
                        color: msg.sender === "user" ? "white" : "#374151",
                        border: msg.sender === "ai" ? "1px solid #e5e7eb" : "none",
                        boxShadow: msg.sender === "user" 
                          ? "0 2px 12px rgba(16, 185, 129, 0.2)" 
                          : "0 2px 12px rgba(0, 0, 0, 0.05)",
                        position: 'relative',
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-1px)",
                          boxShadow: msg.sender === "user" 
                            ? "0 4px 16px rgba(16, 185, 129, 0.3)" 
                            : "0 4px 16px rgba(0, 0, 0, 0.1)"
                        }
                      }}
                    >
                      {msg.text.includes('📎') && (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1,
                          p: 1,
                          bgcolor: msg.sender === "user" ? "rgba(255,255,255,0.1)" : "rgba(16, 185, 129, 0.1)",
                          borderRadius: 1,
                          border: `1px solid ${msg.sender === "user" ? "rgba(255,255,255,0.2)" : "rgba(16, 185, 129, 0.2)"}`
                        }}>
                          <AttachFileIcon sx={{ 
                            fontSize: 16, 
                            mr: 1, 
                            color: msg.sender === "user" ? "white" : '#10B981' 
                          }} />
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: msg.sender === "user" ? "rgba(255,255,255,0.8)" : "#6b7280",
                              fontWeight: 500
                            }}
                          >
                            Files attached
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Message content - editable for user messages */}
                      {editingMessageIndex === idx ? (
                        <Box sx={{ mt: 1 }}>
                          <TextField
                            fullWidth
                            multiline
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                borderRadius: 2,
                                '& fieldset': {
                                  borderColor: 'rgba(255,255,255,0.3)',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgba(255,255,255,0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: 'white',
                                },
                              },
                              '& .MuiInputBase-input': {
                                color: '#374151',
                                fontSize: '0.95rem',
                                lineHeight: 1.6,
                              }
                            }}
                          />
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'flex-end' }}>
                            <IconButton 
                              onClick={cancelEdit}
                              size="small"
                              sx={{ 
                                color: 'rgba(255,255,255,0.8)',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                              }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              onClick={saveEditedMessage}
                              disabled={!editText.trim() || isProcessingEdit}
                              size="small"
                              sx={{ 
                                color: 'rgba(255,255,255,0.8)',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                                '&:disabled': { color: 'rgba(255,255,255,0.3)' }
                              }}
                            >
                              {isProcessingEdit ? (
                                <Box 
                                  sx={{ 
                                    width: 16, 
                                    height: 16, 
                                    border: '2px solid rgba(255,255,255,0.3)', 
                                    borderTop: '2px solid rgba(255,255,255,0.8)', 
                                    borderRadius: '50%', 
                                    animation: 'spin 1s linear infinite' 
                                  }} 
                                />
                              ) : (
                                <CheckIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ position: 'relative' }}>
                          <Typography sx={{ 
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.6,
                            fontSize: "0.95rem",
                            mb: msg.sender === "ai" ? 2 : 0
                          }}>
                            {msg.text}
                          </Typography>
                          
                          {msg.sender === "ai" && (
                            <Box sx={{ mt: 2 }}>
                              <Box sx={{ 
                                display: 'flex', 
                                gap: 1, 
                                alignItems: 'center',
                                position: 'relative' 
                              }}>
                                <Button
                                  variant="outlined"
                                  startIcon={pdfLoading ? <CircularProgress size={16} /> : <DownloadIcon />}
                                  size="small"
                                  onClick={() => handlePdfOperation(msg, 'download')}
                                  disabled={pdfLoading}
                                  sx={{
                                    color: '#10B981',
                                    borderColor: '#10B981',
                                    '&:hover': {
                                      borderColor: '#059669',
                                      backgroundColor: 'rgba(16, 185, 129, 0.1)'
                                    },
                                    '&:disabled': {
                                      borderColor: '#E5E7EB',
                                      color: '#9CA3AF'
                                    }
                                  }}
                                >
                                  {pdfLoading ? 'Processing...' : 'Download as PDF'}
                                </Button>
                                <Button
                                  variant="text"
                                  startIcon={<PreviewIcon />}
                                  size="small"
                                  onClick={() => handlePdfOperation(msg, 'preview')}
                                  disabled={pdfLoading}
                                  sx={{
                                    color: '#6B7280',
                                    '&:hover': {
                                      backgroundColor: 'rgba(107, 114, 128, 0.1)'
                                    }
                                  }}
                                >
                                  Preview
                                </Button>
                                {msg.metadata?.fileCount > 0 && (
                                  <Tooltip title={`Analysis includes ${msg.metadata.fileCount} file(s)`} arrow>
                                    <Chip
                                      size="small"
                                      label={`${msg.metadata.fileCount} file(s)`}
                                      sx={{
                                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10B981',
                                        border: '1px solid #10B981',
                                        fontWeight: 500
                                      }}
                                    />
                                  </Tooltip>
                                )}
                              </Box>
                            </Box>
                          )}
                          
                          {/* Edit button for user messages */}
                          {msg.sender === "user" && (
                            <IconButton
                              onClick={() => startEditMessage(idx, msg.text)}
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                opacity: 0,
                                transition: 'opacity 0.2s ease-in-out',
                                color: 'rgba(255,255,255,0.7)',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                '&:hover': {
                                  backgroundColor: 'rgba(255,255,255,0.2)',
                                  color: 'white'
                                },
                                '.MuiPaper-root:hover &': {
                                  opacity: 1
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          
                          {/* PDF Download button for AI messages */}
                          {msg.sender === "ai" && msg.pdfUrl && (
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              onClick={() => window.open(msg.pdfUrl, '_blank')}
                              sx={{ mt: 1 }}
                            >
                              Download PDF
                            </Button>
                          )}
                        </Box>
                      )}
                      
                      {/* Timestamp */}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: "block",
                          mt: 1,
                          color: msg.sender === "user" ? "rgba(255,255,255,0.7)" : "#9ca3af",
                          fontSize: "0.75rem"
                        }}
                      >
                        {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Typography>
                    </Paper>
                    
                    {/* User Avatar */}
                    {msg.sender === "user" && (
                      <Box sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: "50%", 
                        bgcolor: "#f3f4f6",
                        border: "2px solid #10B981",
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        ml: 1,
                        mb: 0.5,
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#10B981"
                      }}>
                        {username.charAt(0).toUpperCase()}
                      </Box>
                    )}
                  </Box>
                ))}
              </Container>
            </Box>

            {/* Input */}
            <Box sx={{ 
              position: "absolute", 
              bottom: 16, 
              width: "100%",
              zIndex: 10,
              background: "linear-gradient(transparent, rgba(255,255,255,0.95) 20%, rgba(255,255,255,1) 60%)",
              backdropFilter: "blur(8px)",
              paddingTop: 3
            }}>
              <Container maxWidth="sm" sx={{ maxWidth: 650 }}>
                
                {/* Attached Files Display */}
                {attachedFiles.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        borderRadius: 3, 
                        bgcolor: 'rgba(16, 185, 129, 0.05)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        backdropFilter: "blur(8px)"
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="body2" color="#10B981" sx={{ mr: 2, fontWeight: 600 }}>
                          📎 {attachedFiles.length} file(s) attached
                        </Typography>
                        <Button 
                          size="small" 
                          onClick={clearAllAttachedFiles}
                          sx={{ 
                            fontSize: '0.75rem', 
                            minWidth: 'auto', 
                            p: 0.5, 
                            mr: 1,
                            color: "#6b7280",
                            textTransform: "none",
                            "&:hover": {
                              color: "#ef4444"
                            }
                          }}
                        >
                          Clear all
                        </Button>
                        <Tooltip title="Automatically clear files after AI responds" arrow>
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={autoClearFiles}
                                onChange={(e) => setAutoClearFiles(e.target.checked)}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#10B981',
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#10B981',
                                  },
                                }}
                              />
                            }
                            label={
                              <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 500 }}>
                                Auto-clear
                              </Typography>
                            }
                            sx={{ ml: 1, mr: 0 }}
                          />
                        </Tooltip>
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {attachedFiles.map((file) => (
                          <Chip
                            key={file.id}
                            icon={getFileIcon(file.mimeType)}
                            label={file.name}
                            onDelete={() => removeAttachedFile(file.id)}
                            size="small"
                            sx={{ 
                              bgcolor: 'white',
                              border: '1px solid #10B981',
                              borderRadius: 2,
                              fontWeight: 500,
                              '& .MuiChip-deleteIcon': {
                                color: '#10B981',
                                '&:hover': {
                                  color: '#ef4444'
                                }
                              },
                              '& .MuiChip-icon': {
                                color: '#10B981'
                              },
                              transition: "all 0.2s ease-in-out",
                              "&:hover": {
                                bgcolor: 'rgba(16, 185, 129, 0.05)',
                                transform: "translateY(-1px)"
                              }
                            }}
                          />
                        ))}
                      </Stack>
                    </Paper>
                  </Box>
                )}

                <Paper
                  elevation={0}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 1.5,
                    borderRadius: 4,
                    border: "2px solid #e5e7eb",
                    bgcolor: "white",
                    transition: "all 0.2s ease-in-out",
                    "&:focus-within": {
                      borderColor: "#10B981",
                      boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.1)"
                    },
                    "&:hover": {
                      borderColor: "#10B981"
                    }
                  }}
                >
                  <TextField
                    fullWidth
                    placeholder={
                      loadingFileContent ? "Loading files..." :
                      uploading ? "Processing..." : 
                      attachedFiles.length > 0 ? `Ask about ${attachedFiles.length} attached file(s)...` :
                      "Type a message..."
                    }
                    variant="standard"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !uploading && !loadingFileContent && sendMessage(input)
                    }
                    disabled={uploading || loadingFileContent}
                    InputProps={{ 
                      disableUnderline: true,
                      sx: {
                        fontSize: "1rem",
                        "& input::placeholder": {
                          color: "#9ca3af",
                          opacity: 1
                        }
                      }
                    }}
                    sx={{
                      "& .MuiInput-input": {
                        py: 0.5
                      }
                    }}
                  />
                  <IconButton 
                    onClick={() => {
                      setFileDialogOpen(true);
                      loadProjects();
                    }}
                    disabled={uploading || loadingFileContent}
                    sx={{ 
                      color: attachedFiles.length > 0 ? '#10B981' : '#6b7280',
                      bgcolor: attachedFiles.length > 0 ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                      borderRadius: 2,
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                        color: '#10B981',
                        transform: "scale(1.05)"
                      }
                    }}
                  >
                    <AttachFileIcon />
                    {loadingFileContent && (
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          width: 20, 
                          height: 20, 
                          border: '2px solid #10B981', 
                          borderTop: '2px solid transparent', 
                          borderRadius: '50%', 
                          animation: 'spin 1s linear infinite' 
                        }} 
                      />
                    )}
                  </IconButton>
                  <IconButton
                    onClick={() => sendMessage(input)}
                    disabled={uploading || loadingFileContent || !input.trim()}
                    sx={{ 
                      ml: 1, 
                      background: input.trim() ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" : "#e5e7eb",
                      color: input.trim() ? "#fff" : "#9ca3af",
                      borderRadius: 2,
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        background: input.trim() ? "linear-gradient(135deg, #059669 0%, #047857 100%)" : "#d1d5db",
                        transform: input.trim() ? "scale(1.05)" : "none",
                        boxShadow: input.trim() ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "none"
                      },
                      "&:disabled": {
                        background: "#e5e7eb",
                        color: "#9ca3af"
                      }
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </Paper>
              </Container>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* File Browser Dialog */}
      <Dialog 
        open={fileDialogOpen} 
        onClose={closeFileDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Files from Storage</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Choose files from your project storage to analyze with AI. Click on folders to browse their contents, then select documents and files for analysis.
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Project</InputLabel>
              <Select
                value={selectedProject}
                onChange={(e) => handleProjectChange(e.target.value)}
                disabled={loadingProjects}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.name}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {selectedProject && (
            <Box>
              {/* Breadcrumb Navigation */}
              <Box sx={{ mb: 2 }}>
                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => {
                      setNavigationPath([]);
                      setCurrentFolderId(null);
                      loadProjectFiles(selectedProject);
                    }}
                    sx={{ textDecoration: 'none' }}
                  >
                    {selectedProject}
                  </Link>
                  {navigationPath.map((pathItem, index) => (
                    <Link
                      key={pathItem.id}
                      component="button"
                      variant="body2"
                      onClick={() => {
                        const newPath = navigationPath.slice(0, index + 1);
                        setNavigationPath(newPath);
                        setCurrentFolderId(pathItem.id);
                        loadProjectFiles(null, pathItem.id);
                      }}
                      sx={{ textDecoration: 'none' }}
                    >
                      {pathItem.name}
                    </Link>
                  ))}
                </Breadcrumbs>
                
                {navigationPath.length > 0 && (
                  <Button
                    startIcon={<ArrowBackIcon />}
                    size="small"
                    onClick={() => navigateBack()}
                    sx={{ mt: 1 }}
                  >
                    Back
                  </Button>
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {navigationPath.length > 0 
                    ? `Files in ${navigationPath[navigationPath.length - 1].name}`
                    : `Files in ${selectedProject}`
                  }
                </Typography>
                
                {/* Selection controls */}
                {projectFiles.filter(file => isFileSelectable(file)).length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      onClick={selectAllFiles}
                      sx={{ 
                        textTransform: 'none',
                        fontSize: '0.8rem',
                        color: '#10B981',
                        '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)' }
                      }}
                    >
                      Select All
                    </Button>
                    {selectedFiles.length > 0 && (
                      <Button 
                        size="small" 
                        onClick={clearSelection}
                        sx={{ 
                          textTransform: 'none',
                          fontSize: '0.8rem',
                          color: '#ef4444',
                          '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' }
                        }}
                      >
                        Clear ({selectedFiles.length})
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
              
              {selectedFiles.length > 0 && (
                <Box sx={{ 
                  mb: 2, 
                  p: 2, 
                  bgcolor: 'rgba(16, 185, 129, 0.05)', 
                  borderRadius: 2,
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 600 }}>
                      📎 {selectedFiles.length} file(s) selected
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Click files below to select/deselect
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {selectedFiles.map((file) => (
                      <Chip
                        key={file.id}
                        icon={getFileIcon(file.mimeType)}
                        label={file.name}
                        onDelete={() => toggleFileSelection(file)}
                        size="small"
                        sx={{
                          bgcolor: 'white',
                          border: '1px solid #10B981',
                          borderRadius: 2,
                          '& .MuiChip-deleteIcon': {
                            color: '#10B981',
                            '&:hover': { color: '#ef4444' }
                          }
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {loadingFiles ? (
                <Typography>Loading files...</Typography>
              ) : (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {projectFiles.map((file) => {
                    const isSelected = selectedFiles.some(f => f.id === file.id);
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    const isSelectable = isFileSelectable(file);
                    
                    return (
                      <ListItem
                        key={file.id}
                        button
                        onClick={() => {
                          if (isFolder) {
                            navigateToFolder(file);
                          } else if (isSelectable) {
                            toggleFileSelection(file);
                          }
                        }}
                        sx={{
                          bgcolor: isSelected 
                            ? 'rgba(16, 185, 129, 0.1)' 
                            : 'transparent',
                          border: isSelected 
                            ? '2px solid #10B981' 
                            : '2px solid transparent',
                          borderRadius: 1,
                          mb: 0.5,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': { 
                            bgcolor: isSelected 
                              ? 'rgba(16, 185, 129, 0.15)' 
                              : 'rgba(0, 0, 0, 0.04)',
                            transform: 'translateX(4px)'
                          },
                          cursor: 'pointer'
                        }}
                      >
                        <ListItemIcon>
                          {getFileIcon(file.mimeType)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ 
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected ? '#10B981' : 'inherit'
                              }}>
                                {file.name}
                              </Typography>
                              {isFolder && (
                                <Chip 
                                  label="📁 Click to open" 
                                  size="small" 
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                  color="primary"
                                />
                              )}
                              {isSelected && !isFolder && (
                                <Chip 
                                  label="✓ Selected" 
                                  size="small" 
                                  sx={{ 
                                    fontSize: '0.7rem', 
                                    height: 20,
                                    bgcolor: '#10B981',
                                    color: 'white'
                                  }}
                                />
                              )}
                              {!isFolder && !isSelected && isSelectable && (
                                <Chip 
                                  label="Click to select" 
                                  size="small" 
                                  sx={{ 
                                    fontSize: '0.7rem', 
                                    height: 20,
                                    bgcolor: 'transparent',
                                    border: '1px solid #e0e0e0',
                                    color: '#9ca3af'
                                  }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            isFolder 
                              ? "Folder - Click to browse contents"
                              : `Modified: ${new Date(file.modifiedTime).toLocaleDateString()}`
                          }
                        />
                      </ListItem>
                    );
                  })}
                  {projectFiles.length === 0 && !loadingFiles && (
                    <ListItem>
                      <ListItemText primary="No files found in this location" />
                    </ListItem>
                  )}
                </List>
              )}
            </Box>
          )}
        </DialogContent>
        
        {/* Helper text */}
        <Box sx={{ px: 3, pb: 1 }}>
          <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
            💡 Tip: You can select multiple files by clicking on them. Selected files will appear as tabs above the chat input.
          </Typography>
        </Box>
        
        <DialogActions>
          <Button onClick={closeFileDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleAttachFiles}
            disabled={selectedFiles.length === 0 || loadingFileContent}
            variant="contained"
            sx={{ bgcolor: "#10B981" }}
          >
            {loadingFileContent ? "Loading..." : `Add ${selectedFiles.length} file(s) to chat`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save AI Response Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save AI Response</DialogTitle>
        <DialogContent>
          <Typography>
            Would you like to save this AI response as a Summary or Report?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleSave("summaries")} color="primary">
            Save as Summary
          </Button>
          <Button onClick={() => handleSave("reports")} color="primary">
            Save as Report
          </Button>
          <Button onClick={() => setSaveDialogOpen(false)} color="inherit">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </ChatLayout>
  );
}

export default ChatBot;
