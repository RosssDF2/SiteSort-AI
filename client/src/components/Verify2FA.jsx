import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Slide
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmailIcon from "@mui/icons-material/Email";
import { useFormik } from "formik";
import * as yup from "yup";
import http from "../http";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import Lottie from "lottie-react";
import successAnimation from "../assets/animations/success.json";

export default function Verify2FA() {
  const [showAnimation, setShowAnimation] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = React.useContext(UserContext);

  // pulled from state
  const { tempUserId, email, password } = location.state || {};
  console.log("🔍 Verify2FA received email:", email);


  // slide control
  const [inProp, setInProp] = React.useState(true);

  React.useEffect(() => {
    if (!tempUserId || !email || !password) {
      // missing data -> go back
      navigate("/login", { replace: true });
    }
  }, [tempUserId, email, password, navigate]);

  // Formik for code entry
  const formik = useFormik({
    initialValues: { code: "" },
    validationSchema: yup.object({
      code: yup
        .string()
        .required("2FA code is required")
        .matches(/^\d{6}$/, "Must be 6 digits"),
    }),
    onSubmit: (values) => {
      http
        .post("/auth/verify-2fa", { userId: tempUserId, code: values.code })
        .then((res) => {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          setUser(res.data.user);
          setShowAnimation(true);
          setTimeout(() => {
            navigate("/profile");
          }, 2000);
        })
        .catch((err) => {
          alert(err.response?.data?.error || "Verification failed");
        });
    },
  });

  // resend handler
  const handleResend = () => {
    http
      .post("/auth/login", { email, password })
      .then((res) => {
        // update tempUserId for the new code
        location.state.tempUserId = res.data.tempUserId;
        location.state.email = res.data.sendTo; // <-- update masked email too

        alert("A new code has been sent to your email.");
      })
      .catch((err) => {
        alert(err.response?.data?.error || "Could not resend code");
      });
  };

  // back with slide-out
  const handleBack = () => {
    setInProp(false);
  };

  const [maskedEmail, setMaskedEmail] = React.useState("");

  React.useEffect(() => {
    if (email) {
      const masked = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) =>
        a + "*".repeat(Math.min(6, b.length)) + c
      );
      setMaskedEmail(masked);
    }
  }, [email]);

  return (
    <>
      {showAnimation && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <Box sx={{ width: "500px", height: "500px" }}>
            <Lottie animationData={successAnimation} loop={false} style={{ width: '100%', height: '100%' }} />
          </Box>
        </Box>
      )}
      <Slide
        in={inProp}
        direction="left"
        mountOnEnter
        unmountOnExit
        timeout={400}
        onExited={() => navigate(-1)}
      >
      <Box
        component="section"
        sx={{
          position: "fixed",
          inset: 0,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Left panel: Resend */}
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
            Didn’t Receive?
          </Typography>
          <Typography variant="body1" mb={3} textAlign="center">
            Verify your email & check your spam folders <br />
            then tap below to resend.
          </Typography>
          <Button
            variant="outlined"
            sx={{
              borderColor: "white",
              color: "white",
              borderRadius: 3,
              px: 4,
              py: 1,
              "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
            }}
            onClick={handleResend}
          >
            Send Code
          </Button>
        </Box>

        {/* Right panel: Enter code */}
        <Box
          flex={7}
          bgcolor="#fff"
          display="flex"
          flexDirection="column"
          p={4}
          justifyContent="center"
          alignItems="center"
        >
          {/* Back arrow */}
          <Box sx={{ position: "absolute", top: 16, left: 16 }}>
            <IconButton onClick={handleBack}>
              <ArrowBackIcon />
            </IconButton>
          </Box>

          <Typography variant="h4" fontWeight={700} color="#10B981" mb={2}>
            Verification code has been sent!
          </Typography>
          <Typography mb={3} color="text.secondary" textAlign="center">
            please check your email for a 6-digit code:
            <br />
            <strong>{maskedEmail}</strong>
          </Typography>


          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            width="100%"
            maxWidth={360}
          >
            <TextField
              fullWidth
              placeholder="Enter 6-digit code"
              name="code"
              value={formik.values.code}
              onChange={formik.handleChange}
              error={!!(formik.touched.code && formik.errors.code)}
              helperText={formik.touched.code && formik.errors.code}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
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
              Confirm
            </Button>
          </Box>
        </Box>
      </Box>
    </Slide>
    </>
  );
}
