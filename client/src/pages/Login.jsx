import React from "react";
import { Box, TextField, Typography, Button } from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";
import http from "../http";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";

function Login() {
    const { setUser } = React.useContext(UserContext);
    const navigate = useNavigate();

    const formik = useFormik({
        initialValues: {
            email: "",
            password: ""
        },
        validationSchema: yup.object({
            email: yup.string().email("Invalid email").required("Required"),
            password: yup.string().required("Required"),
        }),
        onSubmit: (data) => {
            http.post("/auth/login", data)
                .then((res) => {
                    if (res.data.tempUserId) {
                        // 2FA required — go to verify page
                        navigate("/verify", { state: { tempUserId: res.data.tempUserId } });
                    } else {
                        // Normal login flow
                        localStorage.setItem("token", res.data.token);
                        localStorage.setItem("user", JSON.stringify(res.data.user));
                        setUser(res.data.user);
                        navigate("/profile");
                    }
                })
                .catch((err) => {
                    console.error("Login error:", err);
                    alert(err.response?.data?.error || "Login failed");
                });

        }
    });

    return (
        <Box maxWidth={400} mx="auto" mt={10}>
            <Typography variant="h5" gutterBottom>Login</Typography>
            <form onSubmit={formik.handleSubmit}>
                <TextField
                    fullWidth margin="normal" label="Email"
                    name="email" value={formik.values.email}
                    onChange={formik.handleChange}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                />
                <TextField
                    fullWidth margin="normal" label="Password" type="password"
                    name="password" value={formik.values.password}
                    onChange={formik.handleChange}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                />
                <Button fullWidth type="submit" variant="contained" sx={{ mt: 2 }}>
                    Login
                </Button>
            </form>
        </Box>
    );
}

export default Login;
