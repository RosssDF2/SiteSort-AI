import React from 'react';
import { Box, Typography } from '@mui/material';

export default function MessageBubble({ text, sender }) {
    const isUser = sender === 'user';

    return (
        <Box
            sx={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                backgroundColor: isUser ? '#DCF8C6' : '#F1F0F0',
                color: '#000',
                padding: '10px 14px',
                borderRadius: '18px',
                maxWidth: '80%',
                marginBottom: 1,
                fontSize: '0.95rem',
                boxShadow: 1,
            }}
        >
            <Typography sx={{ whiteSpace: 'pre-line' }}>
                {text}
            </Typography>

        </Box>
    );
}
