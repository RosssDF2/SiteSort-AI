// src/pages/Dashboard.jsx
import React, { useEffect, useState, useContext } from "react";
import {
    Typography,
    Grid,
    CircularProgress,
    Card,
    CardHeader,
    CardContent,
    Alert,
    Box,
    Button,
    Snackbar,
    Select,
    MenuItem,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Divider,
    IconButton,
} from "@mui/material";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import { UserContext } from "../contexts/UserContext";
import ProjectFileExplorer from "../components/ProjectFileExplorer";
import { Backdrop } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const Dashboard = () => {
    // --- Global state you already had ---
    const [insights, setInsights] = useState([]);
    const [viewMode, setViewMode] = useState("basic");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogTitle, setDialogTitle] = useState("");
    const [dialogContent, setDialogContent] = useState("");
    const [dialogCallback, setDialogCallback] = useState(null);
    const [isPrompt, setIsPrompt] = useState(false);
    const [analyzingInsights, setAnalyzingInsights] = useState(false);
    const [tasks, setTasks] = useState([]);
    const { user } = useContext(UserContext);

    // --- NEW: Projects & project-driven stats for BASIC ---
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [projectLoading, setProjectLoading] = useState(false);
    const [projectStats, setProjectStats] = useState({
        totalFiles: 0,
        rfiCount: 0,
        rfiMessages: [],
        rfqCount: 0,
        rfqMessages: [],
    });
    // Message panel state (appears when clicking an RFI/RFQ file)
    const [messagePanel, setMessagePanel] = useState({
        open: false,
        category: "",     // "RFI" | "RFQ"
        fileName: "",
        messages: [],
    });

    const openMessages = (category, fileName, messages = []) => {
        setMessagePanel({ open: true, category, fileName, messages });
    };
    const closeMessages = () => {
        setMessagePanel((p) => ({ ...p, open: false }));
    };


    // ----- Dialog helpers -----
    const showDialog = (title, content, isPromptMode = false, callback = null) => {
        setDialogTitle(title);
        setDialogContent(content);
        setIsPrompt(isPromptMode);
        setDialogCallback(() => callback);
        setDialogOpen(true);
    };
    const handleDialogClose = (result) => {
        setDialogOpen(false);
        if (dialogCallback) dialogCallback(result);
    };

    // ----- Initial loads (insights & tasks) -----
    const fetchInsights = async () => {
        try {
            const res = await axios.get("/api/insights", { headers: authHeaders() });
            setInsights(res.data || []);
        } catch (err) {
            setSnackbarMessage("Failed to load insights.");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
    };
    const fetchTasks = async () => {
        try {
            const res = await axios.get("/api/tasks", { headers: authHeaders() });
            setTasks(res.data || []);
        } catch (err) {
            console.error("Task fetch error", err);
        }
    };

    // ----- NEW: Projects + stats -----
    const fetchProjects = async () => {
        try {
            const res = await axios.get("/api/projects", { headers: authHeaders() });
            setProjects(res.data || []);
        } catch (err) {
            console.error("Projects error:", err.response?.data || err.message);
        }
    };

    // in Dashboard.jsx, replace fetchProjectStats:
    const fetchProjectStats = async (projectId) => {
        if (!projectId) return;
        setProjectLoading(true);
        try {
            const res = await axios.get(`/api/search-firman/summary`, {
                params: { folderId: projectId },
                headers: authHeaders(),
            });
            const { counts, rfi = [], rfq = [] } = res.data || {};
            setProjectStats({
                totalFiles: counts?.totalFiles || 0,
                rfiCount: counts?.rfiCount || 0,
                rfqCount: counts?.rfqCount || 0,
                // keep originals for your side boxes if you still want them:
                rfiMessages: rfi.flatMap(f => f.messages || []),
                rfqMessages: rfq.flatMap(f => f.messages || []),
                // add folder trees for Project Activity:
                rfiTree: rfi, // [{fileName, messages}]
                rfqTree: rfq, // [{fileName, messages}]
            });
        } catch (err) {
            setSnackbarMessage("Failed to load project dashboard.");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            setProjectStats({
                totalFiles: 0, rfiCount: 0, rfqCount: 0,
                rfiMessages: [], rfqMessages: [], rfiTree: [], rfqTree: [],
            });
        } finally {
            setProjectLoading(false);
        }
    };

    useEffect(() => {
        (async () => {
            await Promise.all([fetchInsights(), fetchTasks(), fetchProjects()]);
        })();
    }, []);

    // when project changes, load its stats
    useEffect(() => {
        if (selectedProjectId) fetchProjectStats(selectedProjectId);
    }, [selectedProjectId]);

    // ----- AI Analyze -----
    const handleAnalyzeInsights = async () => {
        setAnalyzingInsights(true);
        try {
            const res = await axios.post("/api/insights/analyze", {}, { headers: authHeaders() });
            showDialog("AI Manager Next Steps", res.data);
            setSnackbarMessage("AI analysis complete.");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
        } catch (err) {
            showDialog("AI Analysis Failed", "Could not analyze insights. Please try again.");
            setSnackbarMessage("AI analysis failed.");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        } finally {
            setAnalyzingInsights(false);
        }
    };

    const handleSnackbarClose = (_, reason) => {
        if (reason === "clickaway") return;
        setSnackbarOpen(false);
    };

    const allCompleted = tasks.length > 0 && tasks.every((t) => t.completed);
    const handleDoneAll = async () => {
        if (!allCompleted) {
            setSnackbarMessage("Please complete all tasks before clicking Done.");
            setSnackbarSeverity("warning");
            setSnackbarOpen(true);
            return;
        }
        try {
            await axios.delete("/api/tasks/all", { headers: authHeaders() });
            setTasks([]);
            setSnackbarMessage("All tasks completed! TODO list reset.");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
        } catch (err) {
            console.error("Done all error", err);
        }
    };

    return (
        <MainLayout>
            {/* Top mode toggle */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: "1rem",
                    ml: "240px",
                    pr: "2rem",
                }}
            >
                <Typography variant="h4"></Typography>
                <div>
                    <Button
                        onClick={() => setViewMode("basic")}
                        variant={viewMode === "basic" ? "contained" : "outlined"}
                        sx={{
                            mr: 1,
                            borderRadius: "6px",
                            backgroundColor: viewMode === "basic" ? "#00796b" : undefined,
                            color: viewMode === "basic" ? "#fff" : undefined,
                        }}
                    >
                        Basic
                    </Button>
                    <Button
                        onClick={() => setViewMode("advanced")}
                        variant={viewMode === "advanced" ? "contained" : "outlined"}
                        sx={{
                            borderRadius: "6px",
                            backgroundColor: viewMode === "advanced" ? "#00796b" : undefined,
                            color: viewMode === "advanced" ? "#fff" : undefined,
                        }}
                    >
                        Advance
                    </Button>
                </div>
            </Box>

            <Box
                sx={{
                    p: "2rem",
                    ml: "240px",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100vh",
                }}
            >
                <Typography variant="h4" gutterBottom>
                    Interactive Dashboard
                </Typography>

                {/* NEW: Project picker (drives BASIC). Hidden in Advanced if you want; I keep it visible always. */}
                <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
                    <Typography variant="subtitle1">Project:</Typography>
                    <Select
                        size="small"
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        displayEmpty
                        sx={{ minWidth: 260 }}
                    >
                        <MenuItem value="">
                            <em>Select a project…</em>
                        </MenuItem>
                        {projects.map((p) => (
                            <MenuItem key={p.id} value={p.id}>
                                {p.name || p.title || p.id}
                            </MenuItem>
                        ))}

                    </Select>
                </Box>

                {/* Removed old search/type/apply strip entirely (and thus also in Advanced) */}

                <Grid container spacing={3}>
                    {viewMode === "basic" && (
                        <Grid container spacing={2}>
                            {/* LEFT: Project Activity (scrollable, files clickable) */}
                            <Grid item xs={12} md={5}>
                                <Card
                                    sx={{
                                        p: 2,
                                        borderRadius: "12px",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                        height: 300, // fixed uniform height
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <CardContent sx={{ flexGrow: 1, overflowY: "auto", pt: 0 }}>
                                        {!selectedProjectId ? (
                                            <Alert severity="info">Pick a project to view its dashboard.</Alert>
                                        ) : projectLoading ? (
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 1 }}>
                                                <CircularProgress />
                                            </Box>
                                        ) : (
                                            <>
                                                <Typography variant="h6" gutterBottom sx={{ pt: 1 }}>
                                                    📊 Project Activity
                                                </Typography>

                                                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 1 }}>
                                                    <MiniStat label="Total Files" value={projectStats.totalFiles} />
                                                    <MiniStat label="RFIs" value={projectStats.rfiCount} />
                                                    <MiniStat label="RFQs" value={projectStats.rfqCount} />
                                                </Box>

                                                {/* Folder tree (files only, clickable) */}
                                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                                                    {/* RFIs */}
                                                    <Box>
                                                        <Typography variant="subtitle1" gutterBottom>📂 RFIs</Typography>
                                                        {projectStats.rfiTree?.length ? (
                                                            <List dense sx={{ m: 0 }}>
                                                                {projectStats.rfiTree.map((f, idx) => (
                                                                    <ListItem disableGutters key={idx} sx={{ py: 0.25 }}>
                                                                        <ListItemButton
                                                                            onClick={() => openMessages("RFI", f.fileName, f.messages || [])}
                                                                            sx={{ borderRadius: 1 }}
                                                                        >
                                                                            <ListItemText
                                                                                primaryTypographyProps={{ variant: "body2" }}
                                                                                primary={`📄 ${f.fileName}`}
                                                                            />
                                                                        </ListItemButton>
                                                                    </ListItem>
                                                                ))}
                                                            </List>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">No RFI files.</Typography>
                                                        )}
                                                    </Box>

                                                    {/* RFQs */}
                                                    <Box>
                                                        <Typography variant="subtitle1" gutterBottom>📂 RFQs</Typography>
                                                        {projectStats.rfqTree?.length ? (
                                                            <List dense sx={{ m: 0 }}>
                                                                {projectStats.rfqTree.map((f, idx) => (
                                                                    <ListItem disableGutters key={idx} sx={{ py: 0.25 }}>
                                                                        <ListItemButton
                                                                            onClick={() => openMessages("RFQ", f.fileName, f.messages || [])}
                                                                            sx={{ borderRadius: 1 }}
                                                                        >
                                                                            <ListItemText
                                                                                primaryTypographyProps={{ variant: "body2" }}
                                                                                primary={`📄 ${f.fileName}`}
                                                                            />
                                                                        </ListItemButton>
                                                                    </ListItem>
                                                                ))}
                                                            </List>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">No RFQ files.</Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* MIDDLE: Dynamic Messages Panel (appears when a file is clicked) */}
                            <Grid item xs={12} md={4}>
                                <Card
                                    sx={{
                                        p: 0,
                                        borderRadius: "12px",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                        height: 300, // same height
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <CardHeader
                                        title={
                                            messagePanel.open
                                                ? `${messagePanel.category === "RFI" ? "📨 RFI" : "📧 RFQ"} — ${messagePanel.fileName}`
                                                : "Select an RFI/RFQ file to view messages"
                                        }
                                        action={
                                            messagePanel.open ? (
                                                <IconButton onClick={closeMessages} aria-label="close">
                                                    <CloseIcon />
                                                </IconButton>
                                            ) : null
                                        }
                                        sx={{ pb: 0 }}
                                    />
                                    <Divider />
                                    <CardContent sx={{ flexGrow: 1, overflowY: "auto", pt: 1 }}>
                                        {messagePanel.open ? (
                                            messagePanel.messages?.length ? (
                                                <List dense sx={{ m: 0 }}>
                                                    {messagePanel.messages.map((msg, idx) => (
                                                        <ListItem key={idx} sx={{ py: 0.5, px: 0 }}>
                                                            <Box
                                                                sx={{
                                                                    bgcolor: "grey.100",
                                                                    border: "1px solid",
                                                                    borderColor: "grey.200",
                                                                    borderRadius: 2,
                                                                    px: 1,
                                                                    py: 0.75,
                                                                    width: "100%",
                                                                    wordBreak: "break-word",
                                                                    whiteSpace: "pre-wrap",
                                                                }}
                                                            >
                                                                <Typography variant="body2">{msg}</Typography>
                                                            </Box>
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    No messages found in this file.
                                                </Typography>
                                            )
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Click a file under Project Activity to open its messages here.
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* RIGHT: TODO List */}
                            <Grid item xs={12} md={3}>
                                <Card
                                    sx={{
                                        p: 2,
                                        borderRadius: "12px",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                        height: 300, // same height
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                                        <Typography variant="h6" gutterBottom>
                                            ✅ TODO List
                                        </Typography>

                                        {tasks.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary">
                                                No tasks yet.
                                            </Typography>
                                        ) : (
                                            <>
                                                <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
                                                    <List dense>
                                                        {tasks.map((task) => (
                                                            <ListItem key={task._id}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={task.completed}
                                                                    onChange={async () => {
                                                                        const res = await axios.put(
                                                                            `/api/tasks/${task._id}`,
                                                                            { completed: !task.completed },
                                                                            { headers: authHeaders() }
                                                                        );
                                                                        setTasks((prev) =>
                                                                            prev.map((t) => (t._id === task._id ? res.data : t))
                                                                        );
                                                                    }}
                                                                    style={{ marginRight: "10px" }}
                                                                />
                                                                <ListItemText
                                                                    primary={task.description}
                                                                    style={{
                                                                        textDecoration: task.completed ? "line-through" : "none",
                                                                    }}
                                                                />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </Box>

                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    fullWidth
                                                    sx={{ mt: 2, borderRadius: "8px" }}
                                                    disabled={!allCompleted}
                                                    onClick={handleDoneAll}
                                                >
                                                    Done
                                                </Button>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}


                    {viewMode === "advanced" && (
                        <Grid item xs={12}>
                            <ProjectFileExplorer onNewInsight={(insight) => setInsights([insight, ...insights])} />
                        </Grid>
                    )}
                </Grid>



                {/* Insight Logs (unchanged) */}
                <Box mt={6}>
                    <Card
                        sx={{
                            minHeight: "45vh",
                            display: "flex",
                            flexDirection: "column",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        }}
                    >
                        <CardContent sx={{ flexGrow: 1 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                <Typography variant="h6">📝 Insight Logs</Typography>
                                <Box display="flex" gap={1}>
                                    <Button
                                        onClick={handleAnalyzeInsights}
                                        variant="contained"
                                        disabled={analyzingInsights || insights.length === 0}
                                        sx={{ borderRadius: "6px", backgroundColor: "#3949ab" }}
                                    >
                                        {analyzingInsights ? "Analyzing…" : "AI Analyze"}
                                    </Button>
                                </Box>
                            </Box>

                            <Box sx={{ overflowY: "auto", maxHeight: "30vh" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr>
                                            <th align="left" style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>
                                                📅 Date
                                            </th>
                                            <th align="left" style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>
                                                🧠 Insight Summary
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {insights.map((log, index) => (
                                            <tr key={index}>
                                                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{log.date}</td>
                                                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                                    {log.summary}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* Snackbar */}
            <Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            {/* Dialog */}
            <Dialog open={dialogOpen} onClose={() => handleDialogClose(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogContent>
                    {dialogTitle.includes("AI Manager Next Steps") && typeof dialogContent === "object" ? (
                        <Box>
                            {/* Summary */}
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                {dialogContent.summary}
                            </Typography>

                            {/* Risks */}
                            {dialogContent.risks?.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1">⚠️ Risks:</Typography>
                                    <List dense>
                                        {dialogContent.risks.map((risk, idx) => (
                                            <ListItem key={idx}>
                                                <ListItemText primary={risk} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}

                            {/* Next Steps */}
                            {dialogContent.nextSteps?.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle1">📌 Next Steps:</Typography>
                                    <List dense>
                                        {dialogContent.nextSteps.map((step, idx) => (
                                            <ListItem key={idx}>
                                                <ListItemText primary={step} />
                                            </ListItem>
                                        ))}
                                    </List>
                                    <Button
                                        variant="contained"
                                        sx={{ mt: 2, backgroundColor: "#00796b" }}
                                        onClick={async () => {
                                            try {
                                                const res = await axios.post(
                                                    "/api/tasks/bulk",
                                                    { tasks: dialogContent.nextSteps },
                                                    { headers: authHeaders() }
                                                );
                                                setTasks((prev) => [...prev, ...res.data]);

                                                await axios.delete("/api/insights/all", { headers: authHeaders() });
                                                setInsights([]);
                                                setSnackbarMessage("Tasks applied to TODO list!");
                                                setSnackbarSeverity("success");
                                                setSnackbarOpen(true);
                                                handleDialogClose(true);
                                            } catch (err) {
                                                setSnackbarMessage("Failed to apply tasks");
                                                setSnackbarSeverity("error");
                                                setSnackbarOpen(true);
                                            }
                                        }}
                                    >
                                        Apply to TODO List
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <DialogContentText component="div" sx={{ whiteSpace: "pre-wrap" }}>
                            {typeof dialogContent === "string"
                                ? dialogContent
                                : JSON.stringify(dialogContent, null, 2)}
                        </DialogContentText>
                    )}
                </DialogContent>

                <DialogActions>
                    {dialogCallback ? (
                        <>
                            <Button onClick={() => handleDialogClose(false)}>Cancel</Button>
                            <Button onClick={() => handleDialogClose(true)} color="error">
                                {isPrompt ? "OK" : "Delete"}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => handleDialogClose(true)}>Close</Button>
                    )}
                </DialogActions>
            </Dialog>
            {/* Global loading overlay when switching projects */}
            <Backdrop
                open={projectLoading}
                sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 2, backdropFilter: "blur(2px)" }}
            >
                <CircularProgress color="inherit" />
            </Backdrop>

        </MainLayout>
    );
};

const MiniStat = ({ label, value }) => (
    <Box
        sx={{
            p: 2,
            borderRadius: "10px",
            border: "1px solid #eee",
            minWidth: 140,
        }}
    >
        <Typography variant="h5" fontWeight="bold">
            {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
            {label}
        </Typography>
    </Box>
);

const Section = ({ title, children }) => (
    <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
            {title}
        </Typography>
        {children}
    </Box>
);

export default Dashboard;
