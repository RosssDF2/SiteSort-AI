import React, { useEffect, useState, useContext } from "react";
import {
    Typography,
    Grid,
    CircularProgress,
    Card,
    CardContent,
    Alert,
    Box,
    TextField, // Added for consistency with MUI
    Button,    // Added for consistency with MUI
    Snackbar,  // Added for notifications
    Select,    // Added for consistency with MUI
    MenuItem,  // Added for consistency with MUI
    Dialog,    // For custom prompt/alert
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import { UserContext } from "../contexts/UserContext";
import ProjectFileExplorer from "../components/ProjectFileExplorer";
import BudgetChart from "../components/BudgetChart";


// --- Hardcoded PDF Content for Demonstration ---
// This content is extracted from your "Project Budget 1.pdf".
// In a real application, this would come from a backend PDF parser.
const PROJECT_BUDGET_PDF_CONTENT = `
--- PAGE 1 ---

Value /

Category / Descriptio Amount

Date

n

Paid

PROJECT BUDGET SUMMARY

Total Project Budget

Amount

Used

Amount Remaining

Notes/
 Vendor

$50,000 Your overall project allocation

$30,000 Calculated automatically below

$20,000

EXPENSE

LOG

Descriptio Amount

Date

n

Paid

Initial

material

Vendor/More Details

1/6/2025 purchase

$5,000 Supplier A

Labor for

Contractor

$10,000 B

15/6/2025 excavation

Electrical

25/6/2025 supplies

$2,000 Supplier C

Concrete

Concrete

1/7/2025 delivery

$13,000 Co.

TOTAL EXPENSES:

$30,000
`;

// IMPORTANT: Replace with your actual OpenRouter API Key.
// For production, this should be stored securely on your backend.
const OPENROUTER_API_KEY = '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';
const OPENROUTER_MODEL = 'openai/gpt-3.5-turbo'; // Or any other model you prefer on OpenRouter

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [type, setType] = useState("");
    const [insights, setInsights] = useState([]);
    const [newInsight, setNewInsight] = useState("");
    const [viewMode, setViewMode] = useState("basic");

    // State for AI insight and its loading status
    const [aiInsight, setAiInsight] = useState("No insights available");
    const [loadingAiInsight, setLoadingAiInsight] = useState(false);

    // State for Snackbar notifications
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    // State for custom dialog (replaces prompt/alert)
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogTitle, setDialogTitle] = useState('');
    const [dialogContent, setDialogContent] = useState('');
    const [dialogInput, setDialogInput] = useState('');
    const [dialogCallback, setDialogCallback] = useState(null);
    const [isPrompt, setIsPrompt] = useState(false);


    const { user } = useContext(UserContext);

    // Custom dialog handler for prompt/alert replacement
    const showDialog = (title, content, isPrompt = false, callback = null, initialValue = '') => {
        setDialogTitle(title);
        setDialogContent(content);
        setIsPrompt(isPrompt);
        setDialogInput(initialValue);
        setDialogCallback(() => callback);
        setDialogOpen(true);
    };

    const handleDialogClose = (result) => {
        setDialogOpen(false);

        if (dialogCallback) {
            if (isPrompt) {
                dialogCallback(result ? dialogInput : null); // for Edit
            } else {
                dialogCallback(result); // for Confirm Delete
            }
        }
    };
    const handleApply = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/insights", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                params: { search, type },
            });
            setData(res.data);
            // Assuming AI insight might also come from backend if you decide to move it there later
            setAiInsight(res.data.aiInsight || "No insights available");
        } catch (err) {
            console.error("Filter error", err);
            setError("Failed to fetch filtered results.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddInsight = async () => {
        if (newInsight.trim() === "") {
            showDialog("Input Required", "Insight summary cannot be empty!");
            return;
        }

        const entry = {
            date: new Date().toLocaleDateString("en-GB"),
            summary: newInsight,
        };

        try {
            const res = await axios.post("/api/insights", entry, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
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
            if (confirmed) {
                try {
                    const insightId = insights[index]._id;
                    await axios.delete(`/api/insights/${insightId}`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    });

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
            }
        });
    };

    const handleEditInsight = (index) => {
        showDialog("Edit Insight", "Edit summary:", true, async (edited) => {
            if (edited !== null && edited.trim() !== "") {
                try {
                    const insightId = insights[index]._id;
                    const res = await axios.put(`/api/insights/${insightId}`, { summary: edited }, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    });

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
            } else if (edited !== null) {
                showDialog("Input Required", "Insight summary cannot be empty!");
            }
        }, insights[index].summary);
    };
    // Function to generate AI insight directly from frontend using hardcoded PDF content
    const generateAIInsight = async () => {
        if (!PROJECT_BUDGET_PDF_CONTENT.trim()) {
            setSnackbarMessage('No PDF content available to generate insight.');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            return;
        }

        if (OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY_HERE' || !OPENROUTER_API_KEY) {
            setSnackbarMessage('Please replace "YOUR_OPENROUTER_API_KEY_HERE" with your actual OpenRouter API key in Dashboard.jsx!');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        setLoadingAiInsight(true);
        setAiInsight('Generating insight...'); // Provide immediate feedback

        try {
            // --- AI Model Integration (OpenRouter API) ---
            const prompt = `Analyze the following construction project budget document content.
            Provide a concise summary of the project's financial status and 2-3 key insights related to expenses or remaining budget.
            
            Document Content:
            "${PROJECT_BUDGET_PDF_CONTENT}"
            
            Summary:
            Insights:
            1.
            2.
            3.
            `;

            const openRouterPayload = {
                model: OPENROUTER_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                // You can add other parameters like temperature, max_tokens, etc.
                // temperature: 0.7,
                // max_tokens: 200,
            };

            const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    // Optional: Add your app's URL for OpenRouter analytics
                    // 'HTTP-Referer': 'http://localhost:3000', // Replace with your actual app URL
                    // 'X-Title': 'SiteSort AI Dashboard', // A title for your app
                },
                body: JSON.stringify(openRouterPayload),
            });

            if (!openRouterResponse.ok) {
                const errorData = await openRouterResponse.json();
                console.error('OpenRouter API error response:', errorData);
                throw new Error(`OpenRouter API error! Status: ${openRouterResponse.status}, Message: ${errorData.message || 'Unknown error'}`);
            }

            const openRouterResult = await openRouterResponse.json();

            if (openRouterResult.choices && openRouterResult.choices.length > 0 && openRouterResult.choices[0].message) {
                const insightText = openRouterResult.choices[0].message.content;
                setAiInsight(insightText);
                setSnackbarMessage('AI Insight generated successfully!');
                setSnackbarSeverity('success');
            } else {
                setAiInsight('Failed to get a valid insight from AI.');
                setSnackbarMessage('OpenRouter response format unexpected.');
                setSnackbarSeverity('error');
            }

        } catch (error) {
            console.error('Error generating AI insight:', error);
            setAiInsight('Error generating insight. Please check your API key and network connection.');
            setSnackbarMessage(`Error: ${error.message}`);
            setSnackbarSeverity('error');
        } finally {
            setLoadingAiInsight(false);
            setSnackbarOpen(true);
        }
    };


    useEffect(() => {
        const fetchDashboardAndInsights = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Missing token. Please log in again.");
                setLoading(false);
                return;
            }

            try {
                const dashRes = await axios.get("/api/dashboard", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("✅ Dashboard response:", dashRes.data);
                setData(dashRes.data);

                const insightRes = await axios.get("/api/insights", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("✅ Insight response:", insightRes.data);
                setInsights(insightRes.data);
            } catch (err) {
                console.error("❌ Error fetching dashboard or insights:", err.response?.data || err.message);
                setError("Failed to load dashboard and insights.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardAndInsights();
    }, []);


    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    return (
        <MainLayout>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", ml: "240px", pr: "2rem" }}>
                <Typography variant="h4"></Typography>
                <div>
                    <Button
                        onClick={() => setViewMode("basic")}
                        variant={viewMode === "basic" ? "contained" : "outlined"}
                        sx={{ mr: 1, borderRadius: "6px", backgroundColor: viewMode === "basic" ? "#00796b" : undefined, color: viewMode === "basic" ? "#fff" : undefined }}
                    >
                        Basic
                    </Button>
                    <Button
                        onClick={() => setViewMode("advanced")}
                        variant={viewMode === "advanced" ? "contained" : "outlined"}
                        sx={{ borderRadius: "6px", backgroundColor: viewMode === "advanced" ? "#00796b" : undefined, color: viewMode === "advanced" ? "#fff" : undefined }}
                    >
                        Advance
                    </Button>
                </div>
            </Box>

            <Box sx={{ padding: "2rem", marginLeft: "240px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                <Typography variant="h4" gutterBottom>Interactive Dashboard</Typography>
                <Box sx={{ marginBottom: "1rem", display: "flex", gap: "1rem", alignItems: "center" }}>
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
                        inputProps={{ 'aria-label': 'Select type' }}
                        size="small"
                        sx={{ minWidth: 120 }}
                    >
                        <MenuItem value="">All Types</MenuItem>
                        <MenuItem value="pdf">PDF</MenuItem>
                        <MenuItem value="docx">DOCX</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                    </Select>
                    <Button onClick={handleApply} variant="contained" sx={{ borderRadius: "6px", backgroundColor: "#00796b" }}>Apply</Button>
                </Box>

                {loading ? <CircularProgress sx={{ m: 4 }} /> : error ? <Alert severity="error" sx={{ m: 4 }}>{error}</Alert> : !data ? <Alert severity="warning" sx={{ m: 4 }}>No dashboard data available.</Alert> : (
                    <>
                        <Grid container spacing={3}>
                            {viewMode === "basic" && (
                                <>
                                    <Grid item xs={12} md={4}>
                                        <StatCard title="📁 Total Files" value={data.totalFiles} />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <StatCard title="📨 RFIs This Week" value={data.rfiCountThisWeek} />
                                    </Grid>
                                </>
                            )}


                            {viewMode === "advanced" && (
                                <>
                                    <Grid item xs={12}>
                                        <ProjectFileExplorer />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <BudgetChart />
                                    </Grid>



                                </>
                            )}
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Card sx={{ height: "100%", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                                <CardContent>
                                    <Typography variant="h6">🧠 AI Insight</Typography>
                                    {loadingAiInsight ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 60 }}>
                                            <CircularProgress size={24} />
                                        </Box>
                                    ) : (
                                        <Typography>{aiInsight}</Typography>
                                    )}
                                    <Button
                                        variant="contained"
                                        onClick={generateAIInsight}
                                        disabled={loadingAiInsight}
                                        sx={{ mt: 2, borderRadius: "6px", backgroundColor: "#ED6C02", '&:hover': { backgroundColor: "#E65100" } }}
                                    >
                                        {loadingAiInsight ? <CircularProgress size={20} color="inherit" /> : 'Generate AI Insight'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Box mt={6} flexGrow={1} display="flex" flexDirection="column" justifyContent="flex-end">
                            <Card sx={{ minHeight: "45vh", display: "flex", flexDirection: "column", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" gutterBottom>📝 Insight Logs</Typography>
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
                                                <Button onClick={handleAddInsight} variant="contained" sx={{ borderRadius: "6px", backgroundColor: "#00796b" }}>Add</Button>
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
                    </>
                )}
            </Box>

            {/* Snackbar for notifications */}
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            {/* Custom Dialog for prompt/alert */}
            <Dialog open={dialogOpen} onClose={() => handleDialogClose(false)}>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {dialogContent}
                    </DialogContentText>
                    {isPrompt && (
                        <TextField
                            autoFocus
                            margin="dense"
                            id="dialog-input"
                            label="Input"
                            type="text"
                            fullWidth
                            variant="standard"
                            value={dialogInput}
                            onChange={(e) => setDialogInput(e.target.value)}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    {dialogCallback ? (
                        // If there's a callback (confirm or prompt), show Cancel + Confirm button
                        <>
                            <Button onClick={() => handleDialogClose(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleDialogClose(true)}
                                color="error"
                            >
                                {isPrompt ? 'OK' : 'Delete'}
                            </Button>
                        </>
                    ) : (
                        // If no callback (simple alert), show single Close button
                        <Button onClick={() => handleDialogClose(true)}>
                            Close
                        </Button>
                    )}
                </DialogActions>

            </Dialog>
        </MainLayout>
    );
};

const StatCard = ({ title, value }) => (
    <Card sx={{ padding: 2, borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", height: "100%" }}>
        <CardContent>
            <Typography variant="h4" fontWeight="bold">{value}</Typography>
            <Typography variant="subtitle1" color="text.secondary">{title}</Typography>
        </CardContent>
    </Card>
);

export default Dashboard;
