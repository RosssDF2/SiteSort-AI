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

function Summaries() {
  const [summaries, setSummaries] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/summaries");
      setSummaries(data || []);
    } catch (err) {
      console.error("Failed to load summaries", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return summaries;
    return summaries.filter((s) => s.content.toLowerCase().includes(q));
  }, [summaries, search]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const dateBuckets = Object.keys(grouped);

  const handleDelete = async (_id) => {
    if (!window.confirm("Delete this summary?")) return;
    try {
      await axios.delete(`/api/summaries/${_id}`, { withCredentials: true });
      setSummaries((prev) => prev.filter((s) => s._id !== _id));
    } catch (err) {
      console.error("Failed to delete summary", err);
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
        <Typography variant="h4" sx={{ color: "#10B981", fontWeight: 700 }}>
          Saved Summaries
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            component={Link}
            to="/chatbot"
            variant="outlined"
            sx={{ borderColor: "#10B981", color: "#10B981" }}
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
            placeholder="Search summaries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Chip
            label={`${filtered.length} ${filtered.length === 1 ? "summary" : "summaries"}`}
            sx={{ bgcolor: "#ecfdf5", color: "#065f46", fontWeight: 600 }}
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
            No summaries found.
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
              {grouped[dateLabel].map((s) => (
                <ListItem key={s._id} disableGutters sx={{ mb: 1.25 }}>
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
                        {s.content}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ ml: 2, flexShrink: 0 }}>
                        <Tooltip title="Copy">
                          <IconButton size="small" onClick={() => handleCopy(s.content)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(s._id)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                      Saved at: {new Date(s.timestamp).toLocaleString()}
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

export default Summaries;
