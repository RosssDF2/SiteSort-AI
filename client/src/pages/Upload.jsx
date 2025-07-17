import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Stack,
  Paper,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        alert('Upload success! Redirecting to file details...');
        // TODO: redirect to file details page
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Upload failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        bgcolor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 500,
          textAlign: 'center',
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Upload Your File
        </Typography>

        <Box
          sx={{
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 4,
            my: 2,
            cursor: 'pointer',
            bgcolor: '#fafafa',
          }}
          onClick={() => document.getElementById('upload-input').click()}
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: '#888' }} />
          <Typography mt={1}>
            Drag and drop a file here or click to browse
          </Typography>
        </Box>

        <input
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="upload-input"
        />

        {file && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Selected: {file.name}
          </Typography>
        )}

        <Stack spacing={2} mt={2}>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!file || loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>

          <Button variant="outlined" fullWidth>
            Import from Google Drive
          </Button>

          <Button variant="outlined" fullWidth>
            View Stored Files
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}



export default Upload;
