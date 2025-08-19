import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { Box } from "@mui/material";
import Lottie from "lottie-react";
import successAnimation from "../assets/animations/success.json";

export default function GoogleLoginSuccess() {
  const [showAnimation, setShowAnimation] = React.useState(false);
  const [params] = useSearchParams();
  const { setUser } = React.useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);

      fetch("http://localhost:3001/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          localStorage.setItem("user", JSON.stringify(data.user));
          setUser(data.user);
          setShowAnimation(true);
          setTimeout(() => {
            navigate("/profile");
          }, 2000);
        })
        .catch(() => {
          localStorage.clear();
          navigate("/login");
        });
    } else {
      navigate("/login");
    }
  }, []);

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
    </>
  );
}
