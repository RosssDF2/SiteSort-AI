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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileAnalysis, setFileAnalysis] = useState([]); // Array of {file, summary, tags, suggestedFolder, suggestedFolderId}
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [newTag, setNewTag] = useState("");
  const [manualFolder, setManualFolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchUploadHistory();

    // Check for saved state after returning from Google auth
    const savedState = sessionStorage.getItem('uploadState');
    if (savedState) {
      try {
        const { files, analysis, step: savedStep } = JSON.parse(savedState);
        if (files) setSelectedFiles(files);
        if (analysis) setFileAnalysis(analysis);
        if (savedStep) setStep(savedStep);
        sessionStorage.removeItem('uploadState'); // Clear saved state
        
        // If we were in the middle of analyzing, restart the process
        if (savedStep === "analyzing" && files) {
          handleUpload();
        }
      } catch (err) {
        console.error('Error restoring upload state:', err);
        sessionStorage.removeItem('uploadState');
      }
    }

    // Verify token and Google auth status
    const verifyAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = '/login';
        return;
      }

      try {
        await axios.get("http://localhost:3001/api/upload/history", {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        if (err.response?.status === 401 || 
            err.response?.data?.error === "Google not linked" ||
            err.response?.data?.error === "Request had insufficient authentication scopes") {
          localStorage.removeItem("token");
          window.location.href = '/login';
        }
      }
    };

    verifyAuth();
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
    const files = e.target.files;
    if (files?.length) {
      const newFiles = Array.from(files);
      setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.length) {
      const newFiles = Array.from(files);
      setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const handleGoogleAuth = async (response) => {
    // Store the current URL and state before any redirect
    sessionStorage.setItem('returnTo', window.location.pathname);
    
    const needsGoogleAuth = 
      response.data?.error === 'google_auth_required' || 
      response.data?.requiresReauth || 
      (response.data?.error && response.data?.error.includes("Google not linked")) ||
      response.data?.error === 'insufficient_scopes' ||
      response.response?.data?.error === "Request had insufficient authentication scopes" ||
      response.response?.data?.error === "Google account not connected";
    
    if (needsGoogleAuth) {
      console.log("Google auth needed, saving state...");
      
      // Store current state
      const currentState = {
        files: selectedFiles,
        analysis: fileAnalysis,
        step: step,
        timestamp: Date.now() // Add timestamp to prevent stale state
      };
      sessionStorage.setItem('uploadState', JSON.stringify(currentState));
      
      // Initiate Google bind process
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found, redirecting to login");
          window.location.href = '/login';
          return true;
        }

        console.log("Initiating Google bind...");
        const bindResponse = await axios.post(
          "http://localhost:3001/api/auth/bind/initiate",
          {},
          { headers: { Authorization: `Bearer ${token}` }}
        );

        if (bindResponse.data.redirectUrl) {
          console.log("Redirecting to Google auth:", bindResponse.data.redirectUrl);
          window.location.href = bindResponse.data.redirectUrl;
          return true;
        }
      } catch (err) {
        console.error("Google bind error:", err.response?.data || err.message);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          sessionStorage.setItem('loginRedirectReason', 'token_expired');
          window.location.href = '/login';
          return true;
        }
        // Other errors - continue with the upload but log the error
        console.error("Failed to initiate Google bind:", err);
      }
    }
    return false;
  };

  const analyzeFile = async (file) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const formData = new FormData();
      formData.append("file", file);
      
      const parentFolderId = manualFolder || null;
      if (parentFolderId) {
        formData.append("parentFolderId", parentFolderId);
      }

      try {
        const res = await axios.post("http://localhost:3001/api/upload/analyze", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        // Handle Google auth issues
        if (await handleGoogleAuth(res)) {
          return null;
        }

        const { summary, tags, suggestedFolder, suggestedFolderId } = res.data;
        if (!summary || !tags) {
          throw new Error("Invalid response format from server");
        }

        return {
          file,
          summary,
          tags,
          suggestedFolder,
          suggestedFolderId,
          status: 'pending'
        };
      } catch (axiosError) {
        if (axiosError.response) {
          // Handle Google auth issues in error response
          if (await handleGoogleAuth(axiosError.response)) {
            return null;
          }

          if (axiosError.response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = '/login';
            return null;
          }
        }
        throw axiosError;
      }
    } catch (err) {
      console.error(`Analysis failed for ${file.name}:`, err.response?.data || err.message);
      return {
        file,
        error: err.response?.data?.error || "Analysis failed",
        status: 'error'
      };
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    setLoading(true);
    
    try {
      // First check auth token
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      // Check token validity with a quick API call
      try {
        await axios.get("http://localhost:3001/api/upload/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (authError) {
        if (authError.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = '/login';
          return;
        }
      }

      const analysisPromises = selectedFiles.map(file => analyzeFile(file));
      const analysisResults = await Promise.all(analysisPromises);
      
      // Filter out null results (from auth redirects) and update state
      const validResults = analysisResults.filter(result => result !== null);
      if (validResults.length > 0) {
        setFileAnalysis(validResults);
        setStep("analyzed");
      }
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message);
      alert(`❌ Upload failed: ${err.response?.data?.error || err.message}`);
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

  const handleConfirm = async (forceFolderId = null, fileIndex) => {
    const token = localStorage.getItem("token");
    const currentFile = fileAnalysis[fileIndex];

    // If no folder is forced (from suggested folder button) and no manual folder is selected
    if (!forceFolderId && !manualFolder) {
      alert("❌ Please select a folder.");
      return;
    }

    const folderId = forceFolderId || manualFolder;
    const formData = new FormData();
    formData.append("file", currentFile.file);
    formData.append("folderId", folderId);
    formData.append("originalName", currentFile.file.name);
    formData.append("tags", currentFile.tags.join(","));

    try {
      const res = await axios.post("http://localhost:3001/api/upload/confirm", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Update the status of the uploaded file
      const newFileAnalysis = [...fileAnalysis];
      newFileAnalysis[fileIndex].status = 'completed';
      setFileAnalysis(newFileAnalysis);

      // Reset the manual folder selection
      setManualFolder("");
      setCurrentFileIndex(-1);

      // Check if all files are uploaded
      const allCompleted = newFileAnalysis.every(
        file => file.status === 'completed' || file.status === 'error'
      );

      if (allCompleted) {
        await fetchUploadHistory();
        alert("✅ All files have been uploaded!");
      }
    } catch (err) {
      console.error("Confirm failed:", err.response?.data || err.message);
      const newFileAnalysis = [...fileAnalysis];
      newFileAnalysis[fileIndex].status = 'error';
      newFileAnalysis[fileIndex].error = "Upload failed";
      setFileAnalysis(newFileAnalysis);
      alert(`❌ Upload failed for ${fileAnalysis[fileIndex].file.name}`);
    }
  };

  return (
    <MainLayout>
      {step === "initial" && (
        <Box textAlign="center" mt={10}>
          <Typography variant="h3" mb={4}>Upload Files</Typography>
          <Box
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              width: 600,
              minHeight: 250,
              mx: "auto",
              p: 4,
              border: "3px dashed",
              borderColor: dragActive ? '#047857' : '#10B981',
              borderRadius: 4,
              backgroundColor: dragActive ? '#F0FDF4' : '#ffffff',
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              transition: 'all 0.2s ease',
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
              Click to browse or drag and drop files here
              <input type="file" hidden multiple onChange={handleFileChange} />
            </Button>

            {selectedFiles.length > 0 && (
              <Box mt={3} width="100%">
                <Typography variant="h6" mb={2}>Selected Files:</Typography>
                <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                  {selectedFiles.map((file, index) => (
                    <Box 
                      key={index}
                      display="flex" 
                      alignItems="center" 
                      justifyContent="space-between"
                      p={1}
                      sx={{ 
                        borderBottom: index !== selectedFiles.length - 1 ? '1px solid #e5e7eb' : 'none',
                      }}
                    >
                      <Typography>{file.name}</Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setSelectedFiles(files => files.filter((_, i) => i !== index));
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Paper>
              </Box>
            )}
          </Box>

          <Box mt={3}>
            <Button
              variant="contained"
              sx={{ m: 1, backgroundColor: '#10B981', '&:hover': { backgroundColor: '#0f9f76' } }}
              disabled={!selectedFiles.length}
              onClick={handleUpload}
            >
              Analyze Files
            </Button>
          </Box>

          <Typography mt={3} color="text.secondary">
            Supported file types: .pdf, .docx, .txt, Google Docs
          </Typography>
        </Box>
      )}

      {step === "analyzed" && (
        <Box sx={{ ml: { xs: 0, md: '240px' }, pr: 3, mt: 8 }}>
          <Box mb={4} display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h4">File Analysis</Typography>
            <Button 
              startIcon={<UploadFileIcon />}
              onClick={() => {
                setStep("initial");
                setSelectedFiles([]);
                setFileAnalysis([]);
              }}
            >
              Upload More Files
            </Button>
          </Box>

          {fileAnalysis.map((file, index) => (
            <Paper key={index} sx={{ mb: 4, overflow: 'hidden' }}>
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: file.status === 'error' ? '#FEF2F2' : '#F0FDF4',
                  borderBottom: '1px solid #e5e7eb'
                }}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="h6">{file.file.name}</Typography>
                <Chip 
                  label={file.status} 
                  color={file.status === 'error' ? 'error' : file.status === 'completed' ? 'success' : 'default'}
                />
              </Box>

              {file.status !== 'error' ? (
                <Box p={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" mb={2}>AI Summary</Typography>
                      <Typography>{file.summary}</Typography>

                      <Typography variant="h6" mt={3} mb={2}>Tags</Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {file.tags.map((tag, idx) => (
                          <Chip
                            key={idx}
                            label={tag}
                            onDelete={() => {
                              const newAnalysis = [...fileAnalysis];
                              newAnalysis[index].tags = file.tags.filter((_, i) => i !== idx);
                              setFileAnalysis(newAnalysis);
                            }}
                            color="primary"
                          />
                        ))}
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" mb={2}>Folder Recommendation</Typography>
                      <Typography mb={2}>
                        Suggested by AI: <strong>{file.suggestedFolder}</strong>
                      </Typography>
                      
                      <Box display="flex" gap={2} mb={3}>
                        <Button
                          variant="contained"
                          onClick={() => handleConfirm(file.suggestedFolderId, index)}
                          disabled={file.status === 'completed'}
                          sx={{ 
                            backgroundColor: '#059669', 
                            '&:hover': { backgroundColor: '#047857' }
                          }}
                        >
                          {file.status === 'completed' ? 'Uploaded' : 'Upload to Suggested Folder'}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => setCurrentFileIndex(index)}
                          disabled={file.status === 'completed'}
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

                      {currentFileIndex === index && (
                        <>
                          <Typography variant="subtitle1">Select Different Folder</Typography>
                          <FolderSelector onSelect={(folderId) => setManualFolder(folderId)} />

                          <Box mt={4} textAlign="right">
                            <Button
                              variant="contained"
                              onClick={() => handleConfirm(manualFolder, index)}
                              disabled={!manualFolder}
                              sx={{ backgroundColor: '#10B981', '&:hover': { backgroundColor: '#0f9f76' } }}
                            >
                              Confirm Upload
                            </Button>
                          </Box>
                        </>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Box p={3}>
                  <Typography color="error">{file.error}</Typography>
                </Box>
              )}
            </Paper>
          ))}
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
