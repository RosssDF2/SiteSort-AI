import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Alert } from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";
import http from "../http";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await http.post("/auth/reset-password", { token, newPassword: password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  useEffect(() => {
    if (!token) setError("No token provided.");
  }, [token]);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={8}>
      <Typography variant="h4" mb={2}>Reset your password</Typography>

      {success ? (
        <Alert severity="success">Password updated! Redirecting to login…</Alert>
      ) : (
        <Box component="form" onSubmit={handleSubmit} width="100%" maxWidth={400}>
          <TextField
            label="New Password"
            fullWidth
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
          />
          {error && <Alert severity="error">{error}</Alert>}

          <Button type="submit" variant="contained" sx={{ mt: 2 }}>
            Reset Password
          </Button>
        </Box>
      )}
    </Box>
  );
}
