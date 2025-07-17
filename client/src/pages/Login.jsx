// src/pages/Login.jsx
import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment
} from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import AppleIcon from "@mui/icons-material/Apple";
import GoogleIcon from "@mui/icons-material/Google";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import { useFormik } from "formik";
import * as yup from "yup";
import http from "../http";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { useLocation } from "react-router-dom";

export default function Login() {
  const { setUser } = React.useContext(UserContext);
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = React.useState("");

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: yup.object({
      email: yup.string().email("Invalid email").required("Required"),
      password: yup.string().required("Required"),
    }),
    onSubmit: ({ email, password }) => {
      setErrorMsg("");
      // call login
      http.post("/auth/login", { email, password })
        .then((res) => {
          const { tempUserId, token, user } = res.data;
          if (tempUserId) {
            // 2FA required -> pass email/password so we can resend later
            navigate("/verify", {
              state: { tempUserId, email, password }
            });
          } else {
            // full login
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            setUser(user);
            navigate("/profile");
          }
        })
        .catch((err) => {
          setErrorMsg(
            err.response?.data?.error || "Email or password incorrect"
          );
        });
    },
  });

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlError = queryParams.get("error");

  React.useEffect(() => {
    if (urlError === "notbound") {
      setErrorMsg("⚠️ This Google account is not yet bound to any SiteSort account.");
    }
  }, [urlError]);
  return (
    <Box
      component="section"
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* Logo top-left */}
      <Box
        position="absolute"
        top={16}
        left={16}
        display="flex"
        alignItems="center"
        gap={1}
        zIndex={10}
      >
        <img
          src="/logo.png"
          alt="SiteSort AI"
          width={56}
          height={56}
        />
        <Typography variant="h6" fontWeight={700}>
          SiteSort AI
        </Typography>
      </Box>

      {/* Left 70% */}
      <Box
        flex={7}
        bgcolor="#fff"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p={4}
      >
        <Typography variant="h4" fontWeight={700} mb={3} textAlign="center">
          Sign in to <span style={{ color: "#10B981" }}>SiteSort</span>
        </Typography>

        <Box mb={2} width="100%" maxWidth={360}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            sx={{
              textTransform: "none",
              borderColor: "#ccc",
              color: "#555",
              backgroundColor: "#fff",
              borderRadius: 2,
              py: 1.2,
              "&:hover": {
                backgroundColor: "#f5f5f5",
                borderColor: "#aaa",
              },
            }}
            onClick={() => {
              window.location.href = "http://localhost:3001/api/auth/google/login";
            }}
          >
            Sign in with Google
          </Button>

        </Box>

        <Typography variant="body2" color="text.secondary" mb={2}>
          or use your email account
        </Typography>

        {errorMsg && (
          <Typography color="error" fontSize={14} mb={1}>
            {errorMsg}
          </Typography>
        )}

        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          width="100%"
          maxWidth={360}
        >
          <TextField
            fullWidth
            placeholder="Email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            error={Boolean(formik.touched.email && formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            placeholder="Password"
            type="password"
            name="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            error={Boolean(formik.touched.password && formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{
              mt: 3,
              backgroundColor: "#10B981",
              borderRadius: 3,
              py: 1.2,
              "&:hover": { backgroundColor: "#0f9c6b" },
            }}
          >
            SIGN IN
          </Button>
        </Box>
      </Box>

      {/* Right 30% */}
      <Box
        flex={3}
        bgcolor="#10B981"
        color="white"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p={4}
      >
        <Typography variant="h4" fontWeight={700} mb={2}>
          Forgot Password?
        </Typography>
        <Typography mb={4} textAlign="center">
          Enter your email below and we’ll send you <br />
          a link to reset your password.
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate("/forgot")}
          sx={{
            borderColor: "white",
            color: "white",
            borderRadius: 3,
            px: 4,
            py: 1,
            "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
          }}
        >
          RESET PASSWORD
        </Button>
      </Box>
    </Box>
  );
}
