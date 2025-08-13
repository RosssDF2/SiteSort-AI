import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, List, ListItem } from "@mui/material";
import axios from "axios";

function Reports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    axios.get("/api/reports")
      .then(res => setReports(res.data))
      .catch(err => console.error("Failed to load reports", err));
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Saved Reports</Typography>
      <List>
        {reports.map(r => (
          <ListItem key={r.id}>
            <Paper sx={{ p: 2, width: "100%" }}>
              <Typography variant="body1">{r.content}</Typography>
              <Typography variant="caption" color="text.secondary">
                Saved at: {new Date(r.timestamp).toLocaleString()}
              </Typography>
            </Paper>
          </ListItem>
        ))}
        {reports.length === 0 && <Typography>No reports saved yet.</Typography>}
      </List>
    </Box>
  );
}

export default Reports;
