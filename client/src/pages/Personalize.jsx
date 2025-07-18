import React, { useContext, useState, useEffect } from "react";
import {
    Box,
    Typography,
    Avatar,
    Paper,
    Button,
    TextField
} from "@mui/material";
import MainLayout from "../layouts/MainLayout";
import { UserContext } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";

function Personalize() {
    const { user, setUser } = useContext(UserContext);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [username, setUsername] = useState(user?.username || "");
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

    return (
        <MainLayout>
            <Box display="flex" justifyContent="center" alignItems="center" mt={6}>
                <Paper sx={{ p: 4, width: "100%", maxWidth: 500, borderRadius: 3, boxShadow: 3 }}>
                    <Typography variant="h5" mb={2} textAlign="center">
                        Personalize Your Profile
                    </Typography>

                    <Box display="flex" justifyContent="center" mb={2}>
                        <Avatar
                            src={preview || (user?.avatar ? `http://localhost:3001${user.avatar}` : undefined)}
                            sx={{ width: 100, height: 100 }}
                        />

                    </Box>

                    <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{ mb: 2 }}
                    >
                        Upload Profile Picture
                        <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                        />
                    </Button>

                    <TextField
                        label="Display Name"
                        fullWidth
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        sx={{ mb: 3 }}
                    />

                    <Box display="flex" justifyContent="space-between" gap={2}>
                        <Button
                            variant="outlined"
                            fullWidth
                            color="inherit"
                            onClick={() => navigate("/profile")}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            fullWidth
                            sx={{ backgroundColor: "#10B981", "&:hover": { backgroundColor: "#0e9e6f" } }}
                            onClick={handleSubmit}
                            disabled={!username}
                        >
                            Save
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </MainLayout>
    );
}

export default Personalize;
