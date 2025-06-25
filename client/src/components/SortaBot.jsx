// src/components/SortaBot.jsx
import React, { useState } from 'react';
import {
    Box, Paper, Button, Typography, TextField, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import http from '../http'; // or wherever your axios setup is


function SortaBot() {
    const [open, setOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatLog, setChatLog] = useState([]);

    const handleSend = async () => {
        if (!chatInput.trim()) return;

        const userMessage = { from: 'user', text: chatInput };
        setChatLog((prev) => [...prev, userMessage]);
        setChatInput('');

        try {
            const res = await http.post('/sorta/chat', { message: chatInput });
            const botReply = { from: 'sorta', text: res.data.reply };
            setChatLog((prev) => [...prev, botReply]);
        } catch (err) {
            console.error("Sorta API error:", err);
            const botReply = { from: 'sorta', text: "Oops! I had trouble reaching my brain 🧠. Try again later." };
            setChatLog((prev) => [...prev, botReply]);
        }
    };



    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                zIndex: 1300
            }}
        >
            {open && (
                <Box sx={{ transform: 'translateY(-48px)' }}>
                    <Paper elevation={6} sx={{
                        width: 460,
                        height: 550,
                        display: 'flex',
                        flexDirection: 'column',
                        p: 2,
                        borderRadius: 3,
                        boxShadow: 6
                    }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="h6">Ask Sorta</Typography>
                            <IconButton onClick={() => setOpen(false)} size="small"><CloseIcon /></IconButton>
                        </Box>

                        <Box flexGrow={1} overflow="auto" mb={1} sx={{ bgcolor: '#F3F4F6', borderRadius: 1, p: 1 }}>
                            {chatLog.map((msg, i) => (
                                <Box key={i} textAlign={msg.from === 'user' ? 'right' : 'left'} mb={1}>
                                    <Paper sx={{
                                        display: 'inline-block',
                                        px: 1.5,
                                        py: 1,
                                        bgcolor: msg.from === 'user' ? '#10B981' : '#E5E7EB',
                                        color: msg.from === 'user' ? 'white' : 'black',
                                        borderRadius: 2,
                                    }}>
                                        <Typography variant="body2">{msg.text}</Typography>
                                    </Paper>
                                </Box>
                            ))}
                        </Box>

                        <Box display="flex" gap={1}>
                            <TextField
                                size="small"
                                variant="outlined"
                                placeholder="Ask a question..."
                                fullWidth
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <Button variant="contained" onClick={handleSend}>Send</Button>
                        </Box>
                    </Paper>

                </Box>
            )}

            {!open && (
                <Box display="flex" alignItems="flex-end" gap={2}>
                    {/* Text Bubble */}
                    <Box sx={{ mb: 3 }}>
                        <Paper elevation={4} sx={{ p: 2 }}>
                            <Typography sx={{ fontWeight: 500, mb: 1 }}>
                                Hi! I'm Sorta!<br />Need help using the site?
                            </Typography>
                            <Button variant="outlined" onClick={() => setOpen(true)}>
                                ASK ME ANYTHING!
                            </Button>
                        </Paper>
                    </Box>

                    {/* Sorta Image */}
                    <img
                        src="/sorta-bot.png"
                        alt="Sorta"
                        style={{
                            width: 100,
                            height: 100,
                            marginBottom: 0
                        }}
                    />
                </Box>
            )}
        </Box>


    );
}

export default SortaBot;
