import React, { useContext, useState, useEffect } from "react";
import {
    Box,
    Typography,
    Avatar,
    Paper,
    Button,
    TextField,
    Divider,
    IconButton,
    Menu,
    MenuItem
} from "@mui/material";
import { UserContext } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AppsIcon from "@mui/icons-material/Apps";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import HistoryIcon from "@mui/icons-material/History";

function Personalize() {
    const { user, setUser } = useContext(UserContext);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [username, setUsername] = useState(user?.username || "");
    const [gender, setGender] = useState(user?.gender || "");
    const [gmailEmail, setGmailEmail] = useState(
        user?.gmailEmail || user?.googleEmail || ""
    );
    const [accountEmail, setAccountEmail] = useState(user?.accountEmail || user?.email || "");
    const [phone, setPhone] = useState(user?.phone || "");

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();

    useEffect(() => {
        if (!selectedFile) return;
        const url = URL.createObjectURL(selectedFile);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [selectedFile]);

    const handleSubmit = async () => {
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("avatar", selectedFile);
        formData.append("username", username);
        formData.append("gender", gender);
        formData.append("gmailEmail", gmailEmail);
        formData.append("accountEmail", accountEmail);
        formData.append("phone", phone);

        const res = await fetch("http://localhost:3001/api/auth/personalize", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();
        if (res.ok) {
            setUser(data);
            localStorage.setItem("user", JSON.stringify(data));
            navigate("/profile");
        } else {
            alert(data.error || "❌ Failed to personalize profile.");
        }
    };


    const handleClick = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const handleLogout = async () => {
        const token = localStorage.getItem("token");

        // 🔐 Tell backend to log the logout
        if (token) {
            try {
                await fetch("http://localhost:3001/api/auth/logout", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) {
                console.error("Failed to log logout:", err);
            }
        }

        // 🚪 Clear session
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };


    return (
        <MainLayout>
            {/* TOP RIGHT ICONS */}
            

            {/* ENTIRE PERSONALIZE CONTENT AREA */}
            <Box sx={{ maxWidth: 800, mx: "auto", px: { xs: 2, md: 0 } }}>
                {/* Title */}
                <Box textAlign="center" mb={4}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Personal info
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Info about you and your preferences across SiteSort AI services
                    </Typography>
                </Box>

                {/* Description + Illustration */}
                <Box
                    display="flex"
                    flexDirection={{ xs: "column", md: "row" }}
                    alignItems="center"
                    gap={4}
                    mb={6}
                >
                    <Box flex={2}>
                        <Typography variant="h5" fontWeight="bold" mb={1}>
                            Your profile info in SiteSort AI
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Personal info and options to manage it. You can make some of this info, like your
                            contact details, visible to others so they can reach you easily. You can also see a summary of your profiles.
                        </Typography>
                    </Box>
                    <Box flex={1} display="flex" justifyContent="center">
                        <img src="/tree.png" alt="Illustration" style={{ maxWidth: "100%", maxHeight: 220 }} />
                    </Box>
                </Box>

                {/* BASIC INFO CARD */}
                <Paper sx={{ borderRadius: 3, px: 3, py: 4, mb: 4 }}>
                    <Typography variant="h6" mb={1}>Basic info</Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Some info may be visible to other users in SiteSort AI.
                    </Typography>

                    {/* Profile Picture */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" py={2} borderBottom="1px solid #E5E7EB">
                        <Box>
                            <Typography variant="subtitle2">Profile picture</Typography>
                            <Typography variant="body2" color="text.secondary">
                                A profile picture helps personalize your account
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Avatar
                                src={preview || (user?.avatar ? `http://localhost:3001${user.avatar}` : undefined)}
                                sx={{ width: 60, height: 60 }}
                            />
                            <Button
                                variant="outlined"
                                component="label"
                                sx={{ borderColor: "#10B981", color: "#10B981" }}
                            >
                                Upload
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                />
                            </Button>
                        </Box>
                    </Box>

                    {/* Name */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" py={2} borderBottom="1px solid #E5E7EB">
                        <Typography variant="subtitle2">Name</Typography>
                        <TextField
                            variant="standard"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            sx={{ minWidth: 200, input: { textAlign: "right" } }}
                        />
                    </Box>

                    {/* Birthday (static for now) */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" py={2} borderBottom="1px solid #E5E7EB">
                        <Typography variant="subtitle2">Birthday</Typography>
                        <TextField
                            variant="standard"
                            type="date"
                            value={"2005-10-22"}
                            onChange={() => { }}
                            sx={{ minWidth: 200, input: { textAlign: "right" } }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>

                    {/* Gender Dropdown */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" py={2}>
                        <Typography variant="subtitle2">Gender</Typography>
                        <TextField
                            select
                            variant="standard"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            sx={{ minWidth: 200, textAlign: "right" }}
                        >
                            <MenuItem value="Male">Male</MenuItem>
                            <MenuItem value="Female">Female</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                        </TextField>
                    </Box>
                </Paper>

                {/* Contact Info Card */}
                <Paper sx={{ borderRadius: 3, px: 3, py: 4, mb: 4 }}>
                    <Typography variant="h6" mb={1}>Contact info</Typography>

                    {/* Email Row */}
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        py={2}
                        borderBottom="1px solid #E5E7EB"
                    >
                        <Typography variant="subtitle2">Gmail Email</Typography>
                        <TextField
                            variant="standard"
                            value={gmailEmail}
                            placeholder="example@gmail.com"
                            onChange={(e) => setGmailEmail(e.target.value)}
                            InputProps={{ readOnly: true }}
                            sx={{ minWidth: 250, input: { textAlign: "right" } }}
                        />

                    </Box>

                    {/* Second Email Row (optional) */}
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        py={2}
                        borderBottom="1px solid #E5E7EB"
                    >
                        {/* Account Email */}
                        <Typography variant="subtitle2">Account Email</Typography>
                        <TextField
                            variant="standard"
                            placeholder="admin@email.com"
                            value={accountEmail}
                            onChange={(e) => setAccountEmail(e.target.value)}
                            sx={{ minWidth: 250, input: { textAlign: "right" } }}
                        />
                    </Box>

                    {/* Phone Row */}
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        py={2}
                    >
                        <Typography variant="subtitle2">Phone</Typography>
                        <TextField
                            variant="standard"
                            placeholder="e.g. 8123 4567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            sx={{ minWidth: 250, input: { textAlign: "right" } }}
                        />
                    </Box>
                </Paper>


                {/* Save + Cancel Buttons */}
                <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button variant="outlined" color="inherit" onClick={() => navigate("/profile")}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!username}
                        sx={{
                            backgroundColor: "#10B981",
                            "&:hover": { backgroundColor: "#0e9e6f" }
                        }}
                    >
                        Save
                    </Button>
                </Box>
            </Box>
        </MainLayout>
    );
}

export default Personalize;
