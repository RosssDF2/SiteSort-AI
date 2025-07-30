import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Grid, Paper, Chip, TextField, IconButton,
  FormControl, InputLabel, Select, MenuItem, CircularProgress
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Close";
import MainLayout from "../layouts/MainLayout";
import SortaBot from "../components/SortaBot";
import axios from "axios";

function Upload() {
  const [step, setStep] = useState("initial");
  const [selectedFile, setSelectedFile] = useState(null);
  const [summary, setSummary] = useState("AI-generated summary will appear here...");
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [suggestedFolder, setSuggestedFolder] = useState("General");
  const [manualFolder, setManualFolder] = useState("");
  const [availableFolders, setAvailableFolders] = useState([]);
  const [loading, setLoading] = useState(false);

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

      const res = await axios.post("http://localhost:3001/api/upload/analyze", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const { summary, tags, suggestedFolder } = res.data;
      setSummary(summary);
      setTags(tags);
      setSuggestedFolder(suggestedFolder);
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

  const handleConfirm = async () => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", selectedFile);

    const matchedFolder = availableFolders.find(
      (f) => f.name.toLowerCase() === suggestedFolder.toLowerCase()
    );

    const finalFolderId = manualFolder || matchedFolder?.id;

    if (!finalFolderId) {
      console.error("❌ No folder matched. Manual:", manualFolder, "Suggested:", suggestedFolder);
      alert("❌ Cannot determine folder to upload. Please select one manually.");
      return;
    }

    formData.append("folderId", finalFolderId);
    formData.append("originalName", selectedFile.name);

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
    } catch (err) {
      console.error("Confirm failed:", err.response?.data || err.message);
      alert("❌ Confirm upload failed.");
    }
  };


  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:3001/api/drive/folders-oauth", {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true, // just in case your backend uses session checks
        });
        setAvailableFolders(res.data.folders);
      } catch (err) {
        console.error("❌ Failed to fetch folders:", err.response?.data || err.message);
        alert("❌ Failed to fetch Google Drive folders. Make sure your Google is linked.");
      }
    };

    fetchFolders();
  }, []);



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
            <Button
              variant="outlined"
              sx={{
                m: 1,
                borderColor: '#10B981',
                color: '#10B981',
                '&:hover': { backgroundColor: '#f0fdf4', borderColor: '#10B981' },
              }}
            >
              Import from Google Drive
            </Button>
            <Button
              variant="outlined"
              sx={{
                m: 1,
                borderColor: '#10B981',
                color: '#10B981',
                '&:hover': { backgroundColor: '#f0fdf4', borderColor: '#10B981' },
              }}
            >
              View stored files
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
                <FormControl fullWidth>
                  <InputLabel>Change folder</InputLabel>
                  <Select
                    value={manualFolder}
                    onChange={(e) => setManualFolder(e.target.value)}
                    label="Change folder"
                  >
                    <MenuItem value="">Use AI Suggested</MenuItem>
                    {availableFolders.map((folder) => (
                      <MenuItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box mt={4} textAlign="right">
                  <Button
                    variant="contained"
                    onClick={handleConfirm}
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

      <SortaBot />
    </MainLayout>
  );
}

export default Upload;
