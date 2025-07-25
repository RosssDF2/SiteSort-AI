// src/pages/Enquiry.jsx
import React, { useState, useContext } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
} from "@mui/material";
import MainLayout from "../layouts/MainLayout";
import { UserContext } from "../contexts/UserContext";

function Enquiry() {
  const { user } = useContext(UserContext);
  const [name, setName] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("✅ Enquiry sent successfully!");
        setSubject("");
        setMessage("");
        alert("✅ Enquiry sent successfully!");
      } else {
        setStatus("❌ Failed to send enquiry.");
        alert("❌ Failed to send enquiry.");
      }
    } catch (error) {
      setStatus("❌ Error sending enquiry.");
      alert("❌ Error sending enquiry.");
      console.error(error);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 700, mx: "auto", px: { xs: 2, md: 0 } }}>
        {/* Title */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Submit an Enquiry
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Reach out to our team with any questions, feedback or support requests.
          </Typography>
        </Box>

        {/* Enquiry Form */}
        <Paper sx={{ borderRadius: 3, px: 3, py: 4 }}>
          <Typography variant="h6" mb={1}>Contact SiteSort AI</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Your message will be sent to: <strong>rosnanda.dhaifullah@gmail.com</strong>
          </Typography>

          <TextField
            fullWidth
            label="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            margin="normal"
            multiline
            rows={5}
          />

          {status && (
            <Typography
              variant="body2"
              color={status.startsWith("✅") ? "success.main" : "error"}
              mt={2}
            >
              {status}
            </Typography>
          )}

          <Box textAlign="right" mt={3}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!email || !message}
              sx={{
                backgroundColor: "#10B981",
                "&:hover": { backgroundColor: "#0e9e6f" }
              }}
            >
              Send Enquiry
            </Button>
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
}

export default Enquiry;
