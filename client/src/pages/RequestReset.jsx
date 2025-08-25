import React, { useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    Slide,
    IconButton,
    InputAdornment
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import http from "../http";
import { useNavigate } from "react-router-dom";

export default function RequestReset() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const [inProp, setInProp] = useState(true);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await http.post("/auth/request-reset", { email });
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.error || "Something went wrong");
        }
    };

    const handleBack = () => {
        setInProp(false); // triggers Slide out
    };

    return (
        <Slide
            in={inProp}
            direction="left"
            timeout={400}
            mountOnEnter
            unmountOnExit
            onExited={() => navigate(-1)}
        >
            <Box
                component="section"
                sx={{
                    position: "fixed",
                    inset: 0,
                    display: "flex",
                    overflow: "hidden",
                }}
            >
                {/* Left form panel */}
                <Box
                    flex={7}
                    bgcolor="#fff"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    p={4}
                    position="relative"
                >
                    {/* Back button */}
                    <Box sx={{ position: "absolute", top: 16, left: 16 }}>
                        <IconButton onClick={handleBack}>
                            <ArrowBackIcon />
                        </IconButton>
                    </Box>

                    <Typography variant="h4" fontWeight={700} mb={2}>
                        Forgot your password?
                    </Typography>
                    <Typography mb={3}>
                        Enter your email and we’ll send you a reset link.
                    </Typography>

                    {sent ? (
                        <Alert severity="success" sx={{ maxWidth: 360 }}>
                            Reset link sent! Please check your email.
                        </Alert>
                    ) : (
                        <Box
                            component="form"
                            onSubmit={handleSubmit}
                            width="100%"
                            maxWidth={360}
                        >
                            <TextField
                                label="Email"
                                fullWidth
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            {error && <Alert severity="error">{error}</Alert>}

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                sx={{
                                    mt: 3,
                                    backgroundColor: "#9C27B0",
                                    borderRadius: 3,
                                    py: 1.2,
                                    "&:hover": { backgroundColor: "#7B1FA2" },
                                }}
                            >
                                Send Reset Link
                            </Button>
                        </Box>
                    )}
                </Box>

                {/* Right green panel */}
                <Box
                    flex={3}
                    bgcolor="#9C27B0"
                    color="white"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    p={4}
                >
                    <Typography variant="h4" fontWeight={700} mb={2}>
                        Reset Your Password
                    </Typography>
                    <Typography mb={4} textAlign="center">
                        A password reset link will be sent to your email.
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={handleBack}
                        sx={{
                            borderColor: "white",
                            color: "white",
                            borderRadius: 3,
                            px: 4,
                            py: 1,
                            "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                        }}
                    >
                        Back to Login
                    </Button>

                </Box>
            </Box>
        </Slide>
    );
}
