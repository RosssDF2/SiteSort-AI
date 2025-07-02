import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UserProvider } from './contexts/UserContext';
import { CssBaseline } from "@mui/material";

ReactDOM.createRoot(document.getElementById('root')).render(
  <UserProvider>
    <App />
  </UserProvider>
);

ReactDOM.render(
  <>
    <CssBaseline />
    <App />
  </>,
  document.getElementById("root")
);