import React from "react";
import { Box, TextField, Typography, Button } from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";
import http from "../http";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";

function Verify2FA() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = React.useContext(UserContext);

  const tempUserId = location.state?.tempUserId;

  React.useEffect(() => {
    if (!tempUserId) navigate("/login");
  }, [tempUserId, navigate]);

  const formik = useFormik({
    initialValues: {
      code: "",
    },
    validationSchema: yup.object({
      code: yup
        .string()
        .required("2FA code is required")
        .matches(/^\d{6}$/, "Code must be a 6-digit number"),
    }),
    onSubmit: (values) => {
      http
        .post("/auth/verify-2fa", {
          userId: tempUserId,
          code: values.code,
        })
        .then((res) => {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          setUser(res.data.user);
          navigate("/profile");
        })
        .catch((err) => {
          alert(err.response?.data?.error || "Verification failed");
        });
    },
  });

  return (
    <Box maxWidth={400} mx="auto" mt={10}>
      <Typography variant="h5" gutterBottom>
        Enter 2FA Code
      </Typography>
      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="6-digit Code"
          name="code"
          value={formik.values.code}
          onChange={formik.handleChange}
          error={formik.touched.code && Boolean(formik.errors.code)}
          helperText={formik.touched.code && formik.errors.code}
        />
        <Button fullWidth type="submit" variant="contained" sx={{ mt: 2 }}>
          Verify
        </Button>
      </form>
    </Box>
  );
}

export default Verify2FA;
