import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, List, ListItem } from "@mui/material";
import axios from "axios";

function Summaries() {
  const [summaries, setSummaries] = useState([]);

  useEffect(() => {
    axios.get("/api/summaries")
      .then(res => setSummaries(res.data))
      .catch(err => console.error("Failed to load summaries", err));
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Saved Summaries</Typography>
      <List>
        {summaries.map(s => (
          <ListItem key={s.id}>
            <Paper sx={{ p: 2, width: "100%" }}>
              <Typography variant="body1">{s.content}</Typography>
              <Typography variant="caption" color="text.secondary">
                Saved at: {new Date(s.timestamp).toLocaleString()}
              </Typography>
            </Paper>
          </ListItem>
        ))}
        {summaries.length === 0 && <Typography>No summaries saved yet.</Typography>}
      </List>
    </Box>
  );
}

export default Summaries;
