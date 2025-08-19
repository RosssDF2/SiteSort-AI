import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import axios from 'axios';

const InsightHistory = ({ updateTrigger }) => {
  const [historyItems, setHistoryItems] = useState([]);

  useEffect(() => {
    const fetchHistoryItems = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/insight-history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistoryItems(response.data);
      } catch (error) {
        console.error('Failed to fetch insight history:', error);
      }
    };

    fetchHistoryItems();
  }, [updateTrigger]); // Re-fetch when updateTrigger changes

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          📚 Insight History
        </Typography>
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th align="left" style={{ padding: '8px', borderBottom: '1px solid #ddd', backgroundColor: '#fff', position: 'sticky', top: 0 }}>
                  📅 Date
                </th>
                <th align="left" style={{ padding: '8px', borderBottom: '1px solid #ddd', backgroundColor: '#fff', position: 'sticky', top: 0 }}>
                  🧠 Insight Summary
                </th>
              </tr>
            </thead>
            <tbody>
              {historyItems.map((item) => (
                <tr key={item._id}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{item.date}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{item.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </CardContent>
    </Card>
  );
};

export default InsightHistory;
