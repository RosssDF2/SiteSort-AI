import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import http from '../http';
import { UserContext } from '../contexts/UserContext';

export default function BindGoogle() {
  const navigate = useNavigate();
  const { setUser } = React.useContext(UserContext);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get("token"); // this is a temporary token from backend

    if (!token) {
      return navigate("/login");
    }

    http.post("/auth/google/bind/callback", { token })
      .then((res) => {
        const { user, jwt } = res.data;
        localStorage.setItem("token", jwt);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        navigate("/profile");
      })
      .catch((err) => {
        console.error("Google bind error", err);
        navigate("/login");
      });
  }, [navigate, setUser]);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={12}>
      <CircularProgress />
      <Typography mt={2}>Binding your Google account...</Typography>
    </Box>
  );
}
