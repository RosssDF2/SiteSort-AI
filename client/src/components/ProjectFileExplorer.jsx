import React, { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    Typography,
    MenuItem,
    Select,
    CircularProgress,
    Box,
    Button,
    Collapse,
    List,
    ListItem,
    ListItemText
} from "@mui/material";
import axios from "axios";
import BudgetChart from "./BudgetChart"; // adjust the path if needed

const ProjectFileExplorer = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState({});
    const [folderContents, setFolderContents] = useState({});
    const [summaryLoading, setSummaryLoading] = useState({});
    const [budgetData, setBudgetData] = useState(null);

    // Fetch project list
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await axios.get("/api/projects");
                setProjects(res.data);
            } catch (err) {
                console.error("Error fetching projects:", err);
            }
        };
        fetchProjects();
    }, []);

    // Fetch root folders when project is selected
    useEffect(() => {
        if (!selectedProject) return;

        const fetchFolders = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/files`, {
                    params: { project: selectedProject }
                });
                setFolders(res.data);
            } catch (err) {
                console.error("Error fetching folders:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFolders();
    }, [selectedProject]);

    // Toggle folder and fetch inner files/folders
    const handleToggleFolder = async (folderId) => {
        setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));

        if (!folderContents[folderId]) {
            try {
                const res = await axios.get(`/api/files/folder`, {
                    params: { folder: folderId }
                });
                setFolderContents((prev) => ({ ...prev, [folderId]: res.data }));
            } catch (err) {
                console.error("Error fetching folder contents:", err);
            }
        }
    };

    const generateBudgetSummary = async (folderId) => {
        try {
            const res = await axios.get("/api/budget/summary", {
                params: { folderId }
            });
            const { total, used, remaining } = res.data;
            alert(`📊 Budget Summary:
Total: $${total.toLocaleString()}
Used: $${used.toLocaleString()}
Remaining: $${remaining.toLocaleString()}`);
        } catch (err) {
            console.error("❌ Budget summary error:", err);
            alert("❌ Failed to extract budget summary.");
        }
    };


    const generateSummary = async (item) => {
        setSummaryLoading((prev) => ({ ...prev, [item.id]: true }));
        try {
            const res = await axios.post("/api/ai/summarize", {
                fileId: item.id,
                fileName: item.name,
                mimeType: item.mimeType
            });

            alert(`🧠 AI Summary for ${item.name}:\n\n${res.data.summary}`);
        } catch (err) {
            console.error("Error generating summary:", err);
            alert("❌ Failed to generate summary.");
        } finally {
            setSummaryLoading((prev) => ({ ...prev, [item.id]: false }));
        }
    };

    const handleTestBudgetExtraction = async () => {
        if (!selectedProject) {
            alert("Please select a project first.");
            return;
        }

        try {
            console.log("🔍 Selected project:", selectedProject);

            const res1 = await axios.get("/api/files", {
                params: { project: selectedProject }
            });

            const financialsFolder = res1.data.find(f => f.name === "Financials");
            if (!financialsFolder) return alert("❌ No 'Financials' folder found.");

            const res2 = await axios.get("/api/files/folder", {
                params: { folder: financialsFolder.id }
            });

            const budgetFolder = res2.data.find(f => f.name === "Budget Estimates");
            if (!budgetFolder) return alert("❌ No 'Budget Estimates' folder found.");

            const res3 = await axios.get("/api/budget/summary", {
                params: { folderId: budgetFolder.id }
            });

            const { total, used, remaining } = res3.data;

            setBudgetData([
                { name: "Used", value: used },
                { name: "Remaining", value: remaining }
            ]);

            console.log("✅ Budget data:", res3.data);
        } catch (err) {
            console.error("❌ Budget AI error", err);
            alert("❌ AI Budget Extraction Failed:\n" + (err.response?.data?.error || err.message));
        }
    };



    return (
        <Card sx={{ mt: 4, borderRadius: "12px" }}>
            <CardContent>
                <Typography variant="h6">📁 Project File Explorer</Typography>

                <Box sx={{ my: 2, display: "flex", gap: 2 }}>
                    <Select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        displayEmpty
                        sx={{ width: 300 }}
                    >
                        <MenuItem value="">Select Project</MenuItem>
                        {projects.map((p) => (
                            <MenuItem key={p.id} value={p.name}>
                                {p.name}
                            </MenuItem>
                        ))}
                    </Select>

                    <Button
                        onClick={handleTestBudgetExtraction}
                        variant="contained"
                        sx={{ borderRadius: "8px", backgroundColor: "#ED6C02" }}
                    >
                        Test Budget AI Extract
                    </Button>
                </Box>
                {budgetData && <BudgetChart data={budgetData} />}

                {loading ? (
                    <CircularProgress />
                ) : (
                    <List>
                        {folders.map((folder) => (
                            <Box key={folder.id}>

                                <ListItem
                                    button
                                    onClick={() => handleToggleFolder(folder.id)}
                                    sx={{ borderBottom: "1px solid #eee" }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <Typography variant="body1">📂 {folder.name}</Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>


                                <Collapse in={expandedFolders[folder.id]} timeout="auto" unmountOnExit>
                                    <List sx={{ pl: 4 }}>
                                        {(folderContents[folder.id] || []).map((item) => (
                                            <ListItem key={item.id} sx={{ borderBottom: "1px dashed #eee" }} alignItems="flex-start">
                                                <ListItemText
                                                    primary={`${item.mimeType.includes("folder") ? "📁" : "📄"} ${item.name}`}
                                                    secondary={
                                                        <>
                                                            <Typography component="span" variant="body2" color="text.secondary">
                                                                Modified: {new Date(item.modifiedTime).toLocaleDateString()}<br />
                                                            </Typography>
                                                            <a href={item.webViewLink} target="_blank" rel="noopener noreferrer">
                                                                View on Drive
                                                            </a>
                                                            {!item.mimeType.includes("folder") && (
                                                                <Box sx={{ mt: 1 }}>
                                                                    <Button
                                                                        size="small"
                                                                        variant="outlined"
                                                                        disabled={summaryLoading[item.id]}
                                                                        onClick={() => generateSummary(item)}
                                                                    >
                                                                        {summaryLoading[item.id] ? "Loading..." : "🧠 Generate Summary"}
                                                                    </Button>
                                                                </Box>
                                                            )}
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Collapse>
                            </Box>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};

export default ProjectFileExplorer;
