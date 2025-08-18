// src/components/ProjectFileExplorer.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Button,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Chip,
    Alert,
    CircularProgress,
} from "@mui/material";
import axios from "axios";
import {
    PieChart,
    Pie,
    Tooltip as ReTooltip,
    Legend as ReLegend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    LineChart,
    Line,
    ResponsiveContainer,
    Cell,
} from "recharts";

/* -------------------- Layout constants -------------------- */
const CARD_HEIGHT_DEFAULT = 500;   // normal cards
const CARD_HEIGHT_COMPACT = 500;   // ⬅️ increased from 340 → 420 for budget
const CHART_HEIGHT_DEFAULT = 260;
const CHART_HEIGHT_BUDGET = 200;   // ⬅️ a bit taller pie area

/* -------------------- Shared UI helpers -------------------- */

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28CFE", "#FF6699"];

const riskChip = (text) => {
    const t = (text || "").toLowerCase();
    if (t.includes("high")) return { color: "error", label: text };
    if (t.includes("medium")) return { color: "warning", label: text };
    if (t.includes("low")) return { color: "success", label: text };
    return { color: "default", label: text || "Unspecified" };
};

/** Card shell — no scrolling here; we’ll scroll only the bottom content per-card */
function DashboardCard({ title, subtitle, children, compact = false }) {
    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 2,
                minHeight: compact ? CARD_HEIGHT_COMPACT : CARD_HEIGHT_DEFAULT,
                display: "flex",
                flexDirection: "column",
                overflow: "visible",   // ✅ no inner scroll cutoffs
            }}
        >
            <CardContent
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    p: 2,
                    height: "100%",
                    minHeight: 0,
                    width: "100%",
                }}
            >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {title}{subtitle ? ` — ${subtitle}` : ""}
                </Typography>

                {/* Split: top fixed + bottom scroll */}
                <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                    {children}
                </Box>
            </CardContent>
        </Card>
    );
}


/* -------------------- Charts -------------------- */

const ChartBox = ({ children, height = CHART_HEIGHT_DEFAULT }) => (
    <Box sx={{ height, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
            {children}
        </ResponsiveContainer>
    </Box>
);

// Budget: smaller pie with outside labels + connector lines
const BudgetPie = ({ used, remaining, height = CHART_HEIGHT_BUDGET }) => {
    const data = useMemo(
        () => [
            { name: "Used", value: Number(used) || 0 },
            { name: "Remaining", value: Number(remaining) || 0 },
        ],
        [used, remaining]
    );

    const renderLabel = ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`;

    return (
        <ChartBox height={height}>
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="60%"  // small radius for compact card
                    paddingAngle={2}
                    label={renderLabel}
                    labelLine           // connector lines
                >
                    {data.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                </Pie>
                <ReTooltip />
                <ReLegend />
            </PieChart>
        </ChartBox>
    );
};

const ResourcesBar = ({ rows }) => {
    const header = rows?.[0] || [];
    const body = rows?.slice(1) || [];
    const labelIdx = 0;
    const usedIdx = header.findIndex((h) => String(h).toLowerCase().includes("used"));
    const valueIdx = usedIdx !== -1 ? usedIdx : 1;

    const data = body.map((r, i) => ({
        name: r[labelIdx],
        value: Number(String(r[valueIdx]).replace(/[^\d.-]/g, "")) || 0,
        fill: COLORS[i % COLORS.length],
    }));

    return (
        <ChartBox>
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="value">
                    {data.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                    ))}
                </Bar>
                <ReTooltip />
                <ReLegend />
            </BarChart>
        </ChartBox>
    );
};

const TrendLine = ({ rows }) => {
    const body = rows?.slice(1) || [];
    const data = body.map((r) => ({
        name: r[0],
        value: Number(String(r[1]).replace(/[^\d.-]/g, "")) || 0,
    }));

    return (
        <ChartBox>
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Line type="monotone" dataKey="value" stroke="#0088FE" strokeWidth={2} dot={{ r: 3 }} />
                <ReTooltip />
                <ReLegend />
            </LineChart>
        </ChartBox>
    );
};

/** Simple, scrollable table (keeps card height consistent) */
const SimpleTable = ({ rows, maxHeight = 140 }) => {
    if (!rows || !rows.length) return null;
    const header = rows[0];
    const body = rows.slice(1);
    return (
        <Box sx={{ overflowX: "auto", overflowY: "auto", maxHeight, borderRadius: 1 }}>
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
                <Box component="thead" sx={{ position: "sticky", top: 0, backgroundColor: "background.paper", zIndex: 1 }}>
                    <Box component="tr">
                        {header.map((h, i) => (
                            <Box
                                component="th"
                                key={i}
                                sx={{
                                    textAlign: "left",
                                    p: 1,
                                    borderBottom: "1px solid",
                                    borderColor: "divider",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {h}
                            </Box>
                        ))}
                    </Box>
                </Box>
                <Box component="tbody">
                    {body.map((row, rIdx) => (
                        <Box component="tr" key={rIdx}>
                            {row.map((cell, cIdx) => (
                                <Box
                                    component="td"
                                    key={cIdx}
                                    sx={{
                                        p: 1,
                                        borderBottom: "1px solid",
                                        borderColor: "divider",
                                        verticalAlign: "top",
                                        fontSize: 13,
                                    }}
                                >
                                    {cell}
                                </Box>
                            ))}
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

/* -------------------- Main component -------------------- */

export default function ProjectFileExplorer({ onNewInsight }) {
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState("");
    const [loadingProjects, setLoadingProjects] = useState(false);

    const [documents, setDocuments] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                setLoadingProjects(true);
                const res = await axios.get("/api/projects");
                setProjects(res.data || []);
            } catch {
                setError("Failed to load projects");
            } finally {
                setLoadingProjects(false);
            }
        };
        load();
    }, []);

    const analyze = async () => {
        if (!projectId) {
            setError("Select a project first");
            return;
        }
        setError("");
        setAnalyzing(true);
        setDocuments([]);
        try {
            const res = await axios.get(`/api/search-firman/summary`, {
                params: { folderId: projectId },
            });
            const docs = (res.data && res.data.documents) || [];
            setDocuments(docs);
        } catch {
            setError("AI analysis failed");
        } finally {
            setAnalyzing(false);
        }
    };

    // Force Budget then Resources side-by-side
    const CATEGORY_ORDER = ["budget", "resources", "site report", "qa", "plans", "progress", "contingency", "unknown"];
    const sortedDocs = [...documents].sort((a, b) => {
        const ca = CATEGORY_ORDER.indexOf((a.category || "unknown").toLowerCase());
        const cb = CATEGORY_ORDER.indexOf((b.category || "unknown").toLowerCase());
        return (ca === -1 ? 999 : ca) - (cb === -1 ? 999 : cb);
    });

    return (
        <Box>
            {/* Controls */}
            <Card sx={{ borderRadius: 3, mb: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        📁 Project File Explorer (AI)
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="proj-label">Project</InputLabel>
                                <Select
                                    labelId="proj-label"
                                    label="Project"
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    disabled={loadingProjects}
                                >
                                    {projects.map((p) => (
                                        <MenuItem key={p.id} value={p.id}>
                                            {p.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md="auto">
                            <Button variant="contained" onClick={analyze} disabled={!projectId || analyzing}>
                                {analyzing ? "Analyzing..." : "Analyze"}
                            </Button>
                        </Grid>
                    </Grid>

                    {loadingProjects && (
                        <Box sx={{ display: "flex", gap: 1, mt: 2, alignItems: "center" }}>
                            <CircularProgress size={18} />
                            <Typography variant="body2">Loading projects…</Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Results */}
            {analyzing && (
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2">AI is parsing your PDFs…</Typography>
                </Box>
            )}

            {!analyzing && documents.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                    No parsed documents yet. Select a project and click Analyze.
                </Typography>
            )}

            <Grid container spacing={2} alignItems="stretch">
                {/* Budget → full width */}
                {sortedDocs.find((d) => (d.category || "").toLowerCase() === "budget") && (
                    <Grid item xs={12} md={12} sx={{ width: "63%" }}>
                        {(() => {
                            const doc = sortedDocs.find(
                                (d) => (d.category || "").toLowerCase() === "budget"
                            );
                            const hasTable = Array.isArray(doc.table) && doc.table.length > 1;

                            return (
                                <Box sx={{ width: "100%" }}>
                                    <DashboardCard
                                        title={doc.fileName}
                                        subtitle={doc.category || "Unknown"}
                                        compact
                                        sx={{ width: "100%" }}   // make card fill full width
                                    >
                                        <Box sx={{ flex: 0 }}>
                                            <BudgetPie
                                                used={doc?.metrics?.used}
                                                remaining={doc?.metrics?.remaining}
                                            />
                                        </Box>

                                        <Box sx={{ flex: 1, minHeight: 0 }}>
                                            {hasTable && <SimpleTable rows={doc.table} />}

                                            {/* Updates & Risks (stacked) */}
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Updates
                                                </Typography>
                                                {(doc.updates || []).length === 0 ? (
                                                    <Typography variant="body2" color="text.secondary">None.</Typography>
                                                ) : (
                                                    <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                                                        {doc.updates.map((u, i) => (
                                                            <li key={i}><Typography variant="body2">{u}</Typography></li>
                                                        ))}
                                                    </ul>
                                                )}

                                                <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
                                                    Risks
                                                </Typography>
                                                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                                    {(doc.risks || []).length === 0 && (
                                                        <Typography variant="body2" color="text.secondary">None.</Typography>
                                                    )}
                                                    {(doc.risks || []).map((r, i) => {
                                                        const rc = riskChip(r);
                                                        return <Chip key={i} label={rc.label} color={rc.color} size="small" variant="outlined" />;
                                                    })}
                                                </Box>
                                            </Box>


                                            {doc.insight && (
                                                <Alert severity="info" sx={{ mt: 1 }}>
                                                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                                        AI Insight
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>{doc.insight}</Typography>

                                                    {/* Add Insight Button */}
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={async () => {
                                                            try {
                                                                const today = new Date().toLocaleDateString("en-GB");
                                                                const res = await axios.post(
                                                                    "/api/insights",
                                                                    { date: today, summary: doc.insight },
                                                                    {
                                                                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                                                                    }
                                                                );

                                                                // ✅ Immediately push into parent log
                                                                if (typeof onNewInsight === "function") {
                                                                    onNewInsight(res.data);
                                                                }

                                                                alert("✅ Insight saved to log!");
                                                            } catch (err) {
                                                                console.error("❌ Failed to save insight", err);
                                                                alert("❌ Failed to save insight");
                                                            }
                                                        }}
                                                    >
                                                        ➕ Add to Insight Log
                                                    </Button>


                                                </Alert>
                                            )}

                                        </Box>
                                    </DashboardCard>
                                </Box>
                            );
                        })()}
                    </Grid>
                )}


                {/* All other docs (Resources + Safety Audit + etc.) → 2 per row */}
                {sortedDocs
                    .filter((d) => {
                        const cat = (d.category || "").toLowerCase();
                        return cat !== "budget" && cat !== "rfi" && cat !== "rfq";
                    })
                    .map((doc, idx) => {

                        const cat = (doc.category || "Unknown").toLowerCase();
                        const hasTable = Array.isArray(doc.table) && doc.table.length > 1;

                        return (
                            <Grid
                                item
                                xs={12}
                                md={cat === "site report" ? 12 : 6}
                                key={`${doc.fileName}-${idx}`}
                                sx={{ display: "flex", width: cat === "site report" ? "60%" : "auto" }}
                            >
                                <DashboardCard
                                    title={doc.fileName}
                                    subtitle={doc.category || "Unknown"}
                                    sx={cat === "site report" ? { width: "100%" } : {}}
                                >
                                    <Box sx={{ flex: 0 }}>
                                        {cat === "resources" && hasTable && <ResourcesBar rows={doc.table} />}
                                        {["site report", "qa", "plans", "progress", "safety audit"].includes(cat) && hasTable && (
                                            <TrendLine rows={doc.table} />
                                        )}
                                    </Box>

                                    {/* Scrollable details */}
                                    <Box sx={{ flex: 1, minHeight: 0 }}>
                                        {hasTable && <SimpleTable rows={doc.table} />}

                                        {/* Updates & Risks (stacked) */}
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Updates
                                            </Typography>
                                            {(doc.updates || []).length === 0 ? (
                                                <Typography variant="body2" color="text.secondary">None.</Typography>
                                            ) : (
                                                <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                                                    {doc.updates.map((u, i) => (
                                                        <li key={i}><Typography variant="body2">{u}</Typography></li>
                                                    ))}
                                                </ul>
                                            )}

                                            <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
                                                Risks
                                            </Typography>
                                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                                {(doc.risks || []).length === 0 && (
                                                    <Typography variant="body2" color="text.secondary">None.</Typography>
                                                )}
                                                {(doc.risks || []).map((r, i) => {
                                                    const rc = riskChip(r);
                                                    return <Chip key={i} label={rc.label} color={rc.color} size="small" variant="outlined" />;
                                                })}
                                            </Box>
                                        </Box>


                                        {doc.insight && (
                                            <Alert severity="info" sx={{ mt: 1 }}>
                                                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                                    AI Insight
                                                </Typography>
                                                <Typography variant="body2" sx={{ mb: 1 }}>{doc.insight}</Typography>

                                                {/* Add Insight Button */}
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={async () => {
                                                        try {
                                                            const today = new Date().toLocaleDateString("en-GB");
                                                            const res = await axios.post(
                                                                "/api/insights",
                                                                { date: today, summary: doc.insight },
                                                                {
                                                                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                                                                }
                                                            );

                                                            // ✅ Immediately push into parent log
                                                            if (typeof onNewInsight === "function") {
                                                                onNewInsight(res.data);
                                                            }

                                                            alert("✅ Insight saved to log!");
                                                        } catch (err) {
                                                            console.error("❌ Failed to save insight", err);
                                                            alert("❌ Failed to save insight");
                                                        }
                                                    }}
                                                >
                                                    ➕ Add to Insight Log
                                                </Button>
                                            </Alert>
                                        )}

                                    </Box>
                                </DashboardCard>
                            </Grid>
                        );
                    })}
            </Grid>


        </Box>
    );
}
