import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UserProvider } from './contexts/UserContext';
import { CssBaseline } from "@mui/material";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <CssBaseline />
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>
);
