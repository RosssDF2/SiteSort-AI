import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  IconButton,
  Stack,
  TextField,
  Chip,
  Tooltip,
  Divider,
  CircularProgress,
  Button,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Link } from "react-router-dom";
import http from "../http";

const groupByDate = (items) => {
  const options = { day: "numeric", month: "short", year: "numeric" };
  return items.reduce((acc, item) => {
    const label = new Date(item.timestamp).toLocaleDateString("en-GB", options);
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});
};

function Reports() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/reports");
      setReports(data || []);
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) => r.content.toLowerCase().includes(q));
  }, [reports, search]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const dateBuckets = Object.keys(grouped);

  const handleDelete = async (_id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await http.delete(`/reports/${_id}`);
      setReports((prev) => prev.filter((r) => r._id !== _id));
    } catch (err) {
      console.error("Failed to delete report", err);
    }
  };

  const handleCopy = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // ignore
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" sx={{ color: "#9C27B0", fontWeight: 700 }}>
          Saved Reports
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            component={Link}
            to="/chatbot"
            variant="outlined"
            sx={{ borderColor: "#9C27B0", color: "#9C27B0" }}
          >
            Back to Chat
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={load}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2.5, mb: 2, borderRadius: 3, boxShadow: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            size="small"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Chip
            label={`${filtered.length} ${filtered.length === 1 ? "report" : "reports"}`}
            sx={{ bgcolor: "#F3E5F5", color: "#7B1FA2", fontWeight: 600 }}
          />
        </Stack>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <Typography variant="body1" color="text.secondary">
            No reports found.
          </Typography>
        </Paper>
      ) : (
        <List sx={{ p: 0 }}>
          {dateBuckets.map((dateLabel, i) => (
            <Box key={dateLabel} sx={{ mb: 3 }}>
              {i !== 0 && <Divider sx={{ my: 2 }} />}
              <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1.5 }}>
                {dateLabel}
              </Typography>
              {grouped[dateLabel].map((r) => (
                <ListItem key={r._id} disableGutters sx={{ mb: 1.25 }}>
                  <Paper
                    sx={{
                      p: 2,
                      width: "100%",
                      borderRadius: 2,
                      boxShadow: 1,
                      border: "1px solid #eef2f7",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                        {r.content}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ ml: 2, flexShrink: 0 }}>
                        <Tooltip title="Copy">
                          <IconButton size="small" onClick={() => handleCopy(r.content)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(r._id)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                      Saved at: {new Date(r.timestamp).toLocaleString()}
                    </Typography>
                  </Paper>
                </ListItem>
              ))}
            </Box>
          ))}
        </List>
      )}
    </Container>
  );
}

export default Reports;
