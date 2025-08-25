import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '../assets/animations/loading.json';
import { Box } from '@mui/material';

const LoadingOverlay = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.3s ease-in-out',
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        }
      }}
    >
      <Box sx={{ width: '200px', height: '200px' }}>
        <Lottie
          animationData={loadingAnimation}
          loop={true}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </Box>
    </Box>
  );
};

export default LoadingOverlay;
