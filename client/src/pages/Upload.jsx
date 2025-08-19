import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Grid, Paper, Chip, TextField, IconButton,
  CircularProgress
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Close";
import MainLayout from "../layouts/MainLayout";
import SortaBot from "../components/SortaBot";
import axios from "axios";

function FolderSelector({ onSelect }) {
  const [levels, setLevels] = useState([[]]);
  const [hoveredPath, setHoveredPath] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchFolders(null, 0);
  }, []);

  const fetchFolders = async (parentId, level) => {
    try {
      const url = parentId
        ? `http://localhost:3001/api/drive/folders-oauth?parentId=${parentId}`
        : `http://localhost:3001/api/drive/folders-oauth`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newLevels = [...levels.slice(0, level), res.data.folders || []];
      setLevels(newLevels);
    } catch (err) {
      console.error("❌ Folder fetch failed:", err.message);
    }
  };

  const handleHover = (folder, level) => {
    const path = [...hoveredPath.slice(0, level), folder.id];
    setHoveredPath(path);
    fetchFolders(folder.id, level + 1);
  };

  const handleSelect = (folder) => {
    setSelectedFolder(folder);
    onSelect(folder.id);
  };

  return (
    <Box display="flex" gap={2} mt={2}>
      {levels.map((folders, level) => (
        <Box key={level} minWidth={200}>
          <Paper elevation={2} sx={{ p: 1 }}>
            {folders.map((folder) => (
              <Box
                key={folder.id}
                onMouseEnter={() => handleHover(folder, level)}
                onClick={() => handleSelect(folder)}
                sx={{
                  p: 1,
                  cursor: "pointer",
                  backgroundColor: selectedFolder?.id === folder.id ? "#DCFCE7" : "transparent",
                  "&:hover": { backgroundColor: "#ECFDF5" },
                }}
              >
                {folder.name}
              </Box>
            ))}
          </Paper>
        </Box>
      ))}
    </Box>
  );
}

function Upload() {
  const [step, setStep] = useState("initial");
  const [selectedFile, setSelectedFile] = useState(null);
  const [summary, setSummary] = useState("AI-generated summary will appear here...");
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [suggestedFolder, setSuggestedFolder] = useState("General");
  const [suggestedFolderId, setSuggestedFolderId] = useState(null);
  const [manualFolder, setManualFolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);

  useEffect(() => {
    fetchUploadHistory();
  }, []);

  const fetchUploadHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3001/api/upload/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUploadHistory(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch history:", err.message);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      // Get current folder structure for smart analysis
      const parentFolderId = manualFolder || null;
      if (parentFolderId) {
        formData.append("parentFolderId", parentFolderId);
      }

      const res = await axios.post("http://localhost:3001/api/upload/analyze", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.requiresReauth) {
        alert(res.data.message);
        // Redirect to Google re-authentication
        window.location.href = '/api/auth/google/login';
        return;
      }

      const { summary, tags, suggestedFolder, suggestedFolderId } = res.data;
      setSummary(summary);
      setTags(tags);
      setSuggestedFolder(suggestedFolder);
      setSuggestedFolderId(suggestedFolderId);
      setStep("analyzed");
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message);
      alert("❌ Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTagDelete = (tagToDelete) => {
    setTags(tags.filter((tag) => tag !== tagToDelete));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleConfirm = async (forceFolderId = null) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("folderId", forceFolderId || manualFolder);
    formData.append("originalName", selectedFile.name);
    formData.append("tags", tags.join(","));

    // If no folder is forced (from suggested folder button) and no manual folder is selected
    if (!forceFolderId && !manualFolder) {
      alert("❌ Please select a folder.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3001/api/upload/confirm", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("✅ File uploaded to Google Drive!");
      setStep("initial");
      setSelectedFile(null);
      setTags([]);
      setManualFolder("");
      await fetchUploadHistory(); // ⬅️ Refresh history
    } catch (err) {
      console.error("Confirm failed:", err.response?.data || err.message);
      alert("❌ Confirm upload failed.");
    }
  };

  return (
    <MainLayout>
      {step === "initial" && (
        <Box textAlign="center" mt={10}>
          <Typography variant="h3" mb={4}>Upload a File</Typography>
          <Box
            sx={{
              width: 600,
              height: 250,
              mx: "auto",
              p: 4,
              border: "3px dashed #10B981",
              borderRadius: 4,
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <UploadFileIcon sx={{ fontSize: 50, color: "#10B981", mb: 1 }} />
            <Button
              component="label"
              sx={{
                fontSize: 16,
                textTransform: "none",
                color: "#10B981",
                "&:hover": { opacity: 0.8 },
              }}
            >
              {selectedFile ? selectedFile.name : "Click to browse or drag and drop a file here"}
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
          </Box>

          <Box mt={3}>
            <Button
              variant="contained"
              sx={{ m: 1, backgroundColor: '#10B981', '&:hover': { backgroundColor: '#0f9f76' } }}
              disabled={!selectedFile}
              onClick={handleUpload}
            >
              Upload
            </Button>
          </Box>

          <Typography mt={3} color="text.secondary">
            Supported file types: .pdf, .docx, .txt, Google Docs
          </Typography>
        </Box>
      )}

      {step === "analyzed" && (
        <Box sx={{ ml: { xs: 0, md: '240px' }, pr: 3, mt: 8 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h6">AI Summary</Typography>
                {isEditingSummary ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    onBlur={() => setIsEditingSummary(false)}
                  />
                ) : (
                  <Box display="flex" alignItems="center">
                    <Typography sx={{ flexGrow: 1 }}>{summary}</Typography>
                    <IconButton onClick={() => setIsEditingSummary(true)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}

                <Typography mt={3} variant="h6">Tags</Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleTagDelete(tag)}
                      color="primary"
                    />
                  ))}
                </Box>
                <Box mt={2} display="flex" gap={1}>
                  <TextField
                    size="small"
                    label="Add tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                  />
                  <Button onClick={handleAddTag}>Add</Button>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h6">Folder Recommendation</Typography>
                <Typography mb={2}>Suggested by AI: <strong>{suggestedFolder}</strong></Typography>
                
                <Box display="flex" gap={2} mb={3}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setManualFolder(suggestedFolderId);
                      handleConfirm(suggestedFolderId);
                    }}
                    sx={{ 
                      backgroundColor: '#059669', 
                      '&:hover': { backgroundColor: '#047857' }
                    }}
                  >
                    Upload to Suggested Folder
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setManualFolder("")}
                    sx={{ 
                      borderColor: '#059669',
                      color: '#059669',
                      '&:hover': { 
                        borderColor: '#047857',
                        backgroundColor: '#F0FDF4'
                      }
                    }}
                  >
                    Choose Different Folder
                  </Button>
                </Box>

                <Typography variant="subtitle1">Or Select Different Folder</Typography>
                <FolderSelector onSelect={(folderId) => setManualFolder(folderId)} />

                <Box mt={4} textAlign="right">
                  <Button
                    variant="contained"
                    onClick={() => handleConfirm()}
                    disabled={!manualFolder}
                    sx={{ backgroundColor: '#10B981', '&:hover': { backgroundColor: '#0f9f76' } }}
                  >
                    Confirm Upload
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {loading && (
        <Box textAlign="center" mt={10}>
          <CircularProgress color="success" />
          <Typography mt={2}>Analyzing file with AI...</Typography>
        </Box>
      )}

      <Box mt={10} ml={{ xs: 0, md: '240px' }} pr={3} px={4}>
        <Typography variant="h5" mb={2}>📜 Upload History</Typography>
        {uploadHistory.map((entry, i) => (
          <Paper key={i} sx={{ p: 2, mb: 2, backgroundColor: "#F0FDF4" }}>
            <Typography fontWeight="bold">{entry.filename}</Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(entry.createdAt).toLocaleString()}
            </Typography>
            <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
              {entry.tags.map((tag, idx) => (
                <Chip key={idx} label={tag} size="small" color="primary" />
              ))}
            </Box>
          </Paper>
        ))}
      </Box>

      <SortaBot />
    </MainLayout>
  );
}

export default Upload;
