// src/components/SortaBot.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
    Box, Paper, Button, Typography, TextField, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import http from '../http'; // or wherever your axios setup is
import { UserContext } from '../contexts/UserContext';


function SortaBot() {
    const [open, setOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatLog, setChatLog] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dotCount, setDotCount] = useState(0);
    const { setUser } = useContext(UserContext);

    const handleSend = async () => {
        if (!chatInput.trim()) return;

        const userMessage = { from: 'user', text: chatInput };
        setChatLog((prev) => [...prev, userMessage]);
        setChatInput('');
        setLoading(true); // ✅ START LOADING

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setChatLog((prev) => [
                    ...prev,
                    { from: 'sorta', text: "❌ You must be logged in to use this feature." }
                ]);
                setLoading(false);
                return;
            }
            const res = await http.post('/sorta/chat', {
                message: chatInput
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const botReply = { from: 'sorta', text: res.data.reply };
            setChatLog((prev) => [...prev, botReply]);
            // If backend returns updatedUser, update UserContext
            if (res.data.updatedUser) {
                setUser(res.data.updatedUser);
                localStorage.setItem("user", JSON.stringify(res.data.updatedUser));
            }
        } catch (err) {
            let errorMsg = "Oops! I had trouble reaching my brain 🧠. Try again later.";
            if (err?.response?.status === 401) {
                errorMsg = "❌ You must be logged in to use this feature.";
            }
            setChatLog((prev) => [
                ...prev,
                { from: 'sorta', text: errorMsg }
            ]);
        } finally {
            setLoading(false); // ✅ END LOADING
        }
    };

    useEffect(() => {
        if (!loading) {
            setDotCount(0);
            return;
        }

        const interval = setInterval(() => {
            setDotCount((prev) => (prev + 1) % 4); // loops from 0 to 3
        }, 400);

        return () => clearInterval(interval);
    }, [loading]);


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
                <Box sx={{
                    transform: 'translateY(-48px)',
                    animation: 'slideIn 0.3s ease-out',
                    '@keyframes slideIn': {
                        '0%': {
                            opacity: 0,
                            transform: 'translateY(20px)'
                        },
                        '100%': {
                            opacity: 1,
                            transform: 'translateY(-48px)'
                        }
                    }
                }}>
                    <Paper elevation={6} sx={{
                        width: 460,
                        height: 550,
                        display: 'flex',
                        flexDirection: 'column',
                        p: 2,
                        borderRadius: 3,
                        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.12)',
                        bgcolor: '#FFFFFF',
                        border: '1px solid rgba(156, 39, 176, 0.1)',
                    }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Box
                                    component="img"
                                    src="/sorta-bot.png"
                                    alt="Sorta Bot"
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        border: '2px solid #FF1493',
                                    }}
                                />
                                <Typography variant="h6" sx={{ color: '#FF1493', fontWeight: 600 }}>
                                    Ask Sorta
                                </Typography>
                            </Box>
                            <IconButton 
                                onClick={() => setOpen(false)} 
                                size="small"
                                sx={{
                                    color: '#9C27B0',
                                    '&:hover': {
                                        backgroundColor: 'rgba(156, 39, 176, 0.1)'
                                    }
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>

                        <Box 
                            flexGrow={1} 
                            overflow="auto" 
                            mb={2} 
                            sx={{ 
                                bgcolor: '#F8F9FB',
                                borderRadius: 2,
                                p: 2,
                                '&::-webkit-scrollbar': {
                                    width: '8px',
                                },
                                '&::-webkit-scrollbar-track': {
                                    backgroundColor: '#F8F9FB',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: '#E0E7FF',
                                    borderRadius: '4px',
                                    '&:hover': {
                                        backgroundColor: '#C7D2FE',
                                    },
                                },
                            }}
                        >
                            {chatLog.map((msg, i) => (
                                <Box 
                                    key={i} 
                                    textAlign={msg.from === 'user' ? 'right' : 'left'} 
                                    mb={2}
                                    sx={{
                                        animation: 'fadeIn 0.3s ease-out',
                                        '@keyframes fadeIn': {
                                            '0%': {
                                                opacity: 0,
                                                transform: 'translateY(10px)'
                                            },
                                            '100%': {
                                                opacity: 1,
                                                transform: 'translateY(0)'
                                            }
                                        }
                                    }}
                                >
                                    <Paper sx={{
                                        display: 'inline-block',
                                        maxWidth: '80%',
                                        px: 2,
                                        py: 1.5,
                                        bgcolor: msg.from === 'user' ? '#FF1493' : 'white',
                                        color: msg.from === 'user' ? 'white' : 'black',
                                        borderRadius: msg.from === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                        boxShadow: msg.from === 'user' 
                                            ? 'none' 
                                            : '0 2px 8px rgba(0, 0, 0, 0.06)',
                                        border: msg.from === 'user'
                                            ? 'none'
                                            : '1px solid rgba(156, 39, 176, 0.1)',
                                    }}>
                                        <Typography variant="body2">
                                            {msg.text.split('\n').map((line, idx) => {
                                                // Match markdown image format
                                                const match = line.match(/!\[(.*?)\]\((.*?)\)/);
                                                if (match) {
                                                    const alt = match[1];
                                                    const url = match[2];
                                                    return (
                                                        <Box key={idx} mt={1}>
                                                            <img
                                                                src={url}
                                                                alt={alt}
                                                                style={{
                                                                    width: '100%',
                                                                    maxWidth: '200px',         // 🧠 Limits actual size
                                                                    borderRadius: 8,
                                                                    border: '1px solid #ccc',
                                                                    display: 'block',
                                                                    marginTop: 8
                                                                }}
                                                            />

                                                        </Box>
                                                    );
                                                }
                                                return <div key={idx}>{line}</div>;
                                            })}
                                        </Typography>
                                    </Paper>
                                </Box>

                            ))}

                            {loading && (
                                <Box textAlign="left" mb={1}>
                                    <Paper
                                        sx={{
                                            display: 'inline-block',
                                            px: 1.5,
                                            py: 1,
                                            bgcolor: '#E5E7EB',
                                            color: 'black',
                                            borderRadius: 2,
                                            fontStyle: 'italic',
                                            opacity: 0.8
                                        }}
                                    >
                                        <Typography variant="body2">
                                            Sorta is typing{".".repeat(dotCount)}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}


                        </Box>

                        <Box display="flex" gap={1}>
                            <TextField
                                size="small"
                                variant="outlined"
                                placeholder="Ask me anything..."
                                fullWidth
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3,
                                        '& fieldset': {
                                            borderColor: 'rgba(156, 39, 176, 0.2)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#FF1493',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#FF1493',
                                        },
                                    },
                                }}
                            />
                            <Button 
                                variant="contained" 
                                onClick={handleSend}
                                sx={{
                                    borderRadius: 3,
                                    px: 3,
                                    bgcolor: '#FF1493',
                                    '&:hover': {
                                        bgcolor: '#FF1493',
                                        filter: 'brightness(0.9)',
                                    },
                                }}
                            >
                                Send
                            </Button>
                        </Box>
                    </Paper>

                </Box>
            )}

            {!open && (
                <Box 
                    display="flex" 
                    alignItems="flex-end" 
                    gap={2}
                    sx={{
                        animation: 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                        '@keyframes bounceIn': {
                            '0%': {
                                opacity: 0,
                                transform: 'scale(0.3)'
                            },
                            '50%': {
                                transform: 'scale(1.05)'
                            },
                            '70%': {
                                transform: 'scale(0.9)'
                            },
                            '100%': {
                                opacity: 1,
                                transform: 'scale(1)'
                            }
                        }
                    }}
                >
                    {/* Text Bubble */}
                    <Box sx={{ mb: 3 }}>
                        <Paper 
                            elevation={6} 
                            sx={{ 
                                p: 2.5,
                                borderRadius: 4,
                                bgcolor: '#FFFFFF',
                                border: '1px solid rgba(156, 39, 176, 0.1)',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                                position: 'relative',
                                '&:after': {
                                    content: '""',
                                    position: 'absolute',
                                    bottom: '-12px',
                                    right: '12px',
                                    width: 0,
                                    height: 0,
                                    borderLeft: '12px solid transparent',
                                    borderRight: '12px solid transparent',
                                    borderTop: '12px solid #FFFFFF',
                                    filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.08))'
                                }
                            }}
                        >
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                                <Box
                                    component="img"
                                    src="/sorta-bot.png"
                                    alt="Sorta Bot"
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        border: '2px solid #FF1493',
                                    }}
                                />
                                <Typography sx={{ 
                                    fontWeight: 600,
                                    color: '#FF1493',
                                    fontSize: '1.1rem',
                                }}>
                                    Hi! I'm Sorta!<br />
                                    <span style={{ 
                                        fontSize: '0.9rem',
                                        color: '#666',
                                        fontWeight: 400 
                                    }}>
                                        Need help using the site?
                                    </span>
                                </Typography>
                            </Box>
                            <Button 
                                variant="contained"
                                onClick={() => setOpen(true)}
                                fullWidth
                                sx={{
                                    borderRadius: 3,
                                    py: 1.2,
                                    bgcolor: '#FF1493',
                                    fontWeight: 600,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        bgcolor: '#FF1493',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 6px 20px rgba(255, 20, 147, 0.4)',
                                    }
                                }}
                            >
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
