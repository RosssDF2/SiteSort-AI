// src/pages/Dashboard.jsx
import React, { useEffect, useState, useContext } from "react";
import {
    Typography,
    Grid,
    CircularProgress,
    Card,
    CardContent,
    Alert,
    Box,
    TextField,
    Button,
    Snackbar,
    Select,
    MenuItem,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    List, ListItem, ListItemText,
} from "@mui/material";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import { UserContext } from "../contexts/UserContext";
import ProjectFileExplorer from "../components/ProjectFileExplorer";

const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [type, setType] = useState("");
    const [tasks, setTasks] = useState([]);

    const [insights, setInsights] = useState([]);
    const [newInsight, setNewInsight] = useState("");
    const [viewMode, setViewMode] = useState("basic");

    // Snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    // Dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogTitle, setDialogTitle] = useState("");
    const [dialogContent, setDialogContent] = useState("");
    const [dialogInput, setDialogInput] = useState("");
    const [dialogCallback, setDialogCallback] = useState(null);
    const [isPrompt, setIsPrompt] = useState(false);

    const [analyzingInsights, setAnalyzingInsights] = useState(false);

    const { user } = useContext(UserContext);

    /* ---------------- Dialog helpers ---------------- */
    const showDialog = (title, content, isPromptMode = false, callback = null, initialValue = "") => {
        setDialogTitle(title);
        setDialogContent(content);
        setIsPrompt(isPromptMode);
        setDialogInput(initialValue);
        setDialogCallback(() => callback);
        setDialogOpen(true);
    };


    const handleDialogClose = (result) => {
        setDialogOpen(false);
        if (dialogCallback) {
            if (isPrompt) {
                dialogCallback(result ? dialogInput : null);
            } else {
                dialogCallback(result);
            }
        }
    };

    /* ---------------- Data fetchers ---------------- */
    const fetchDashboard = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Missing token. Please log in again.");
            setLoading(false);
            return;
        }
        try {
            const dashRes = await axios.get("/api/dashboard", { headers: authHeaders() });
            setData(dashRes.data);
        } catch (err) {
            console.error("Dashboard error:", err.response?.data || err.message);
            setError("Failed to load dashboard.");
        }
    };

    const fetchInsights = async () => {
        try {
            const res = await axios.get("/api/insights", { headers: authHeaders() });
            setInsights(res.data || []);
        } catch (err) {
            console.error("Insights fetch error:", err.response?.data || err.message);
            setSnackbarMessage("Failed to load insights.");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
    };



    useEffect(() => {
        (async () => {
            setLoading(true);
            await Promise.all([fetchDashboard(), fetchInsights()]);
            setLoading(false);
        })();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await axios.get("/api/tasks", { headers: authHeaders() });
            setTasks(res.data || []);
        } catch (err) {
            console.error("Task fetch error", err);
        }
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            await Promise.all([fetchDashboard(), fetchInsights(), fetchTasks()]);
            setLoading(false);
        })();
    }, []);

    /* ---------------- Filters ---------------- */
    const handleApply = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/insights", {
                headers: authHeaders(),
                params: { search, type },
            });
            setInsights(res.data || []);
        } catch (err) {
            console.error("Filter error", err);
            setError("Failed to fetch filtered results.");
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- Insight CRUD ---------------- */
    const handleAddInsight = async () => {
        if (!newInsight.trim()) {
            showDialog("Input Required", "Insight summary cannot be empty!");
            return;
        }
        const entry = {
            date: new Date().toLocaleDateString("en-GB"),
            summary: newInsight.trim(),
        };
        try {
            const res = await axios.post("/api/insights", entry, { headers: authHeaders() });
            setInsights([res.data, ...insights]);
            setNewInsight("");
            setSnackbarMessage("Insight added!");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
        } catch (err) {
            console.error(err);
            setSnackbarMessage("Failed to add insight");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
    };

    const handleDeleteInsight = (index) => {
        showDialog("Confirm Delete", "Are you sure you want to delete this insight?", false, async (confirmed) => {
            if (!confirmed) return;
            try {
                const insightId = insights[index]._id;
                await axios.delete(`/api/insights/${insightId}`, { headers: authHeaders() });
                setInsights(insights.filter((_, i) => i !== index));
                setSnackbarMessage("Insight deleted!");
                setSnackbarSeverity("success");
                setSnackbarOpen(true);
            } catch (err) {
                console.error(err);
                setSnackbarMessage("Failed to delete insight");
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
            }
        });
    };

    const handleEditInsight = (index) => {
        showDialog("Edit Insight", "Edit summary:", true, async (edited) => {
            if (edited === null) return;
            if (!edited.trim()) {
                showDialog("Input Required", "Insight summary cannot be empty!");
                return;
            }
            try {
                const insightId = insights[index]._id;
                const res = await axios.put(
                    `/api/insights/${insightId}`,
                    { summary: edited.trim() },
                    { headers: authHeaders() }
                );
                const updated = [...insights];
                updated[index] = res.data;
                setInsights(updated);
                setSnackbarMessage("Insight updated!");
                setSnackbarSeverity("success");
                setSnackbarOpen(true);
            } catch (err) {
                console.error(err);
                setSnackbarMessage("Failed to update insight");
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
            }
        }, insights[index].summary);
    };

    /* ---------------- AI Analyze ---------------- */
    /* ---------------- AI Analyze ---------------- */
    const handleAnalyzeInsights = async () => {
        setAnalyzingInsights(true);
        try {
            const res = await axios.post("/api/insights/analyze", {}, { headers: authHeaders() });
            const aiData = res.data;

            // 👉 Just show the dialog — no inserts here
            showDialog("AI Manager Next Steps", aiData);

            setSnackbarMessage("AI analysis complete.");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
        } catch (err) {
            console.error("Analyze error:", err.response?.data || err.message);
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
            // ✅ Clear tasks from DB
            await axios.delete("/api/tasks/all", { headers: authHeaders() });
            setTasks([]);
            setSnackbarMessage("All tasks completed! TODO list reset.");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
        } catch (err) {
            console.error("Done all error", err);
        }
    };

    /* ---------------- Render ---------------- */
    return (
        <MainLayout>
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

                <Box sx={{ mb: "1rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                    <TextField
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{ flex: 1 }}
                    />
                    <Select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        displayEmpty
                        size="small"
                        sx={{ minWidth: 120 }}
                    >
                        <MenuItem value="">All Types</MenuItem>
                        <MenuItem value="pdf">PDF</MenuItem>
                        <MenuItem value="docx">DOCX</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                    </Select>
                    <Button onClick={handleApply} variant="contained" sx={{ borderRadius: "6px", backgroundColor: "#00796b" }}>
                        Apply
                    </Button>
                </Box>

                {loading ? (
                    <CircularProgress sx={{ m: 4 }} />
                ) : error ? (
                    <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>
                ) : !data ? (
                    <Alert severity="warning" sx={{ m: 4 }}>No dashboard data available.</Alert>
                ) : (
                    <Grid container spacing={3}>
                        {viewMode === "basic" && (
                            <>
                                <Grid item xs={12} md={4}>
                                    <StatCard title="📁 Total Files" value={data.totalFiles} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <StatCard title="📨 RFIs This Week" value={data.rfiCountThisWeek} />
                                </Grid>

                                {/* ✅ TODO List Card */}
                                <Grid item xs={12} md={4}>
                                    <Card sx={{ p: 2, borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", height: "100%" }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>✅ TODO List</Typography>

                                            {tasks.length === 0 ? (
                                                <Typography variant="body2" color="text.secondary">
                                                    No tasks yet.
                                                </Typography>
                                            ) : (
                                                <>
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
                                                                        setTasks(tasks.map(t => t._id === task._id ? res.data : t));
                                                                    }}
                                                                    style={{ marginRight: "10px" }}
                                                                />
                                                                <ListItemText
                                                                    primary={task.description}
                                                                    style={{
                                                                        textDecoration: task.completed ? "line-through" : "none"
                                                                    }}
                                                                />
                                                            </ListItem>
                                                        ))}
                                                    </List>

                                                    {/* ✅ One Done button below all steps */}
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
                            </>
                        )}

                        {viewMode === "advanced" && (
                            <Grid item xs={12}>
                                <ProjectFileExplorer onNewInsight={(insight) => setInsights([insight, ...insights])} />
                            </Grid>
                        )}
                    </Grid>
                )}

                {/* ✅ Insight Logs always visible */}
                <Box mt={6} flexGrow={1} display="flex" flexDirection="column" justifyContent="flex-end">
                    <Card sx={{ minHeight: "45vh", display: "flex", flexDirection: "column", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
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

                            {viewMode === "basic" ? (
                                <Box sx={{ overflowY: "auto", maxHeight: "30vh" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr>
                                                <th align="left" style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>📅 Date</th>
                                                <th align="left" style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>🧠 Insight Summary</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {insights.map((log, index) => (
                                                <tr key={index}>
                                                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{log.date}</td>
                                                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{log.summary}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Box>
                            ) : (
                                <>
                                    <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                                        <TextField
                                            type="text"
                                            placeholder="Enter new insight summary..."
                                            value={newInsight}
                                            onChange={(e) => setNewInsight(e.target.value)}
                                            variant="outlined"
                                            size="small"
                                            sx={{ flex: 1 }}
                                        />
                                        <Button onClick={handleAddInsight} variant="contained" sx={{ borderRadius: "6px", backgroundColor: "#00796b" }}>
                                            Add
                                        </Button>
                                    </Box>

                                    <Box sx={{ overflowY: "auto", maxHeight: "25vh" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead>
                                                <tr>
                                                    <th align="left" style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>📅 Date</th>
                                                    <th align="left" style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>🧠 Insight Summary</th>
                                                    <th align="left" style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>⚙️ Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {insights.map((log, index) => (
                                                    <tr key={index}>
                                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{log.date}</td>
                                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{log.summary}</td>
                                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                                                            <Button onClick={() => handleEditInsight(index)} size="small" sx={{ minWidth: "auto", p: "4px", mr: "4px" }}>✏️</Button>
                                                            <Button onClick={() => handleDeleteInsight(index)} size="small" sx={{ minWidth: "auto", p: "4px" }}>🗑️</Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </Box>
                                </>
                            )}
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
                                                setTasks([...tasks, ...res.data]);

                                                // ✅ Clear insights in DB and local state
                                                await axios.delete("/api/insights/all", { headers: authHeaders() });
                                                setInsights([]);
                                                setSnackbarMessage("Tasks applied to TODO list!");
                                                setSnackbarSeverity("success");
                                                setSnackbarOpen(true);
                                                handleDialogClose(true); // close dialog after applying
                                            } catch (err) {
                                                console.error("Apply tasks error:", err.response?.data || err.message);
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
                            {typeof dialogContent === "string" ? dialogContent : JSON.stringify(dialogContent, null, 2)}
                        </DialogContentText>
                    )}


                    {isPrompt && (
                        <TextField
                            autoFocus
                            margin="normal"
                            label="Insight Summary"
                            multiline
                            rows={6}
                            fullWidth
                            variant="outlined"
                            value={dialogInput}
                            onChange={(e) => setDialogInput(e.target.value)}
                            sx={{ minWidth: "500px" }}
                        />
                    )}
                </DialogContent>



                <DialogActions>
                    {dialogCallback ? (
                        <>
                            <Button onClick={() => handleDialogClose(false)}>Cancel</Button>
                            <Button onClick={() => handleDialogClose(true)} color="error">{isPrompt ? "OK" : "Delete"}</Button>
                        </>
                    ) : (
                        <Button onClick={() => handleDialogClose(true)}>Close</Button>
                    )}
                </DialogActions>
            </Dialog>
        </MainLayout>
    );
};

const StatCard = ({ title, value }) => (
    <Card sx={{ p: 2, borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", height: "100%" }}>
        <CardContent>
            <Typography variant="h4" fontWeight="bold">{value}</Typography>
            <Typography variant="subtitle1" color="text.secondary">{title}</Typography>
        </CardContent>
    </Card>
);

export default Dashboard;
