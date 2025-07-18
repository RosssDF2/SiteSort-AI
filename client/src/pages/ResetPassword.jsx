import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Alert, Paper } from "@mui/material";
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
        <Box
            component="section"
            sx={{
                position: "fixed",
                inset: 0,
                display: "flex",
                overflow: "hidden",
                backgroundColor: "#f9f9f9"
            }}
        >
            {/* Top Left Logo */}
            <Box
                position="absolute"
                top={16}
                left={16}
                display="flex"
                alignItems="center"
                gap={1}
                zIndex={10}
            >
                <img src="/logo.png" alt="SiteSort AI" width={56} height={56} />
                <Typography variant="h6" fontWeight={700}>
                    SiteSort AI
                </Typography>
            </Box>

            {/* Center Form */}
            <Box
                m="auto"
                width="100%"
                maxWidth={420}
                p={4}
                component={Paper}
                elevation={3}
                sx={{
                    borderRadius: 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center"
                }}
            >
                <Typography variant="h4" mb={1} fontWeight={700}>
                    Reset your password
                </Typography>
                <Typography color="text.secondary" mb={3}>
                    Choose a strong new password to protect your account.
                </Typography>

                {success ? (
                    <Alert severity="success" sx={{ width: "100%" }}>
                        ✅ Password updated! Redirecting to login…
                    </Alert>
                ) : (
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        width="100%"
                        maxWidth={360}
                    >
                        <TextField
                            label="New Password"
                            fullWidth
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                        />
                        {error && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            sx={{
                                mt: 3,
                                py: 1.2,
                                borderRadius: 3,
                                backgroundColor: "#10B981",
                                "&:hover": { backgroundColor: "#0f9c6b" }
                            }}
                        >
                            Reset Password
                        </Button>
                    </Box>
                )}
            </Box>
        </Box>
    );

}
