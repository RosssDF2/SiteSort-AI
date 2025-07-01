import React, { useEffect, useState, useContext } from "react";
import {
    Typography,
    Grid,
    CircularProgress,
    Card,
    CardContent,
    Alert,
    Box,
} from "@mui/material";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import { UserContext } from "../contexts/UserContext";

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [type, setType] = useState("");
    const [insights, setInsights] = useState([]);
    const [newInsight, setNewInsight] = useState("");
    const [viewMode, setViewMode] = useState("basic");

    const { user } = useContext(UserContext);

    const handleApply = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/dashboard", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                params: { search, type },
            });
            setData(res.data);
        } catch (err) {
            console.error("Filter error", err);
            setError("Failed to fetch filtered results.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddInsight = () => {
        const newEntry = {
            date: new Date().toLocaleDateString("en-GB"),
            summary: newInsight,
        };
        setInsights([...insights, newEntry]);
        setNewInsight("");
    };

    const handleDeleteInsight = (index) => {
        setInsights(insights.filter((_, i) => i !== index));
    };

    const handleEditInsight = (index) => {
        const edited = prompt("Edit summary:", insights[index].summary);
        if (edited !== null) {
            const updated = [...insights];
            updated[index].summary = edited;
            setInsights(updated);
        }
    };

    useEffect(() => {
        const getDashboard = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return setError("Missing token. Please log in again.");
                const res = await axios.get("/api/dashboard", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.data) return setError("No data received from server.");
                setData(res.data);
                setInsights(res.data.insightLogs || []);
            } catch (err) {
                console.error("❌ Dashboard error:", err);
                setError("Failed to load dashboard. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        getDashboard();
    }, []);

    return (
        <MainLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <Typography variant="h4"></Typography>
                <div>
                    <button onClick={() => setViewMode("basic")} style={{ padding: "8px 12px", marginRight: "8px", background: viewMode === "basic" ? "#00796b" : "#eee", color: viewMode === "basic" ? "#fff" : "#333", border: "none", borderRadius: "6px" }}>Basic</button>
                    <button onClick={() => setViewMode("advanced")} style={{ padding: "8px 12px", background: viewMode === "advanced" ? "#00796b" : "#eee", color: viewMode === "advanced" ? "#fff" : "#333", border: "none", borderRadius: "6px" }}>Advance</button>
                </div>
            </div>

            <div style={{ padding: "2rem", marginLeft: "240px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                <Typography variant="h4" gutterBottom>Interactive Dashboard</Typography>
                <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                    <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc", flex: 1 }} />
                    <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}>
                        <option value="">All Types</option>
                        <option value="pdf">PDF</option>
                        <option value="docx">DOCX</option>
                        <option value="other">Other</option>
                    </select>
                    <button onClick={handleApply} style={{ padding: "8px 16px", borderRadius: "6px", background: "#00796b", color: "#fff", border: "none" }}>Apply</button>
                </div>

                {loading ? <CircularProgress sx={{ m: 4 }} /> : error ? <Alert severity="error" sx={{ m: 4 }}>{error}</Alert> : !data ? <Alert severity="warning" sx={{ m: 4 }}>No dashboard data available.</Alert> : (
                    <>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}><StatCard title="📁 Total Files" value={data.totalFiles} /></Grid>
                            <Grid item xs={12} md={4}><StatCard title="📨 RFIs This Week" value={data.rfiCountThisWeek} /></Grid>
                            {viewMode === "advanced" && (
                                <>
                                    <Grid item xs={12} md={6}>
                                        <Card sx={{ height: "100%" }}>
                                            <CardContent>
                                                <Typography variant="h6">📂 Top Folders</Typography>
                                                <Typography>{data.topFolders?.length ? data.topFolders.map(f => `${f.name} (${f.count})`).join(", ") : "No folders"}</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Card sx={{ height: "100%" }}>
                                            <CardContent>
                                                <Typography variant="h6">🧠 AI Insight</Typography>
                                                <Typography>{data.aiInsight || "No insights available"}</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </>
                            )}
                        </Grid>

                        <Box mt={6} flexGrow={1} display="flex" flexDirection="column" justifyContent="flex-end">
                            <Card sx={{ minHeight: "45vh", display: "flex", flexDirection: "column" }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" gutterBottom>📝 Insight Logs</Typography>
                                    {viewMode === "basic" ? (
                                        <Box sx={{ overflowY: "auto", maxHeight: "30vh" }}>
                                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                <thead>
                                                    <tr><th align="left">📅 Date</th><th align="left">🧠 Insight Summary</th></tr>
                                                </thead>
                                                <tbody>
                                                    {insights.map((log, index) => (
                                                        <tr key={index}><td>{log.date}</td><td>{log.summary}</td></tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </Box>
                                    ) : (
                                        <>
                                            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                                                <input type="text" placeholder="Enter new insight summary..." value={newInsight} onChange={(e) => setNewInsight(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }} />
                                                <button onClick={handleAddInsight} style={{ padding: "8px 16px", borderRadius: "6px", background: "#00796b", color: "#fff", border: "none" }}>Add</button>
                                            </Box>
                                            <Box sx={{ overflowY: "auto", maxHeight: "25vh" }}>
                                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                    <thead>
                                                        <tr><th align="left">📅 Date</th><th align="left">🧠 Insight Summary</th><th align="left">⚙️ Actions</th></tr>
                                                    </thead>
                                                    <tbody>
                                                        {insights.map((log, index) => (
                                                            <tr key={index}>
                                                                <td>{log.date}</td>
                                                                <td>{log.summary}</td>
                                                                <td>
                                                                    <button onClick={() => handleEditInsight(index)}>✏️</button>
                                                                    <button onClick={() => handleDeleteInsight(index)}>🗑️</button>
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
            </div>
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
