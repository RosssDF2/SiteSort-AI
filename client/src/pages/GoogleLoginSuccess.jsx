import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";

export default function GoogleLoginSuccess() {
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
          navigate("/profile");
        })
        .catch(() => {
          localStorage.clear();
          navigate("/login");
        });
    } else {
      navigate("/login");
    }
  }, []);

  return null;
}
