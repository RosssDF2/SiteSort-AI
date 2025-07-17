import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';

export default function BindSuccess() {
  const { setUser } = React.useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      localStorage.setItem("token", token);

      fetch("http://localhost:3001/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
            navigate("/profile");
          }
        })
        .catch(err => {
          console.error("Bind error:", err);
          navigate("/login");
        });
    } else {
      navigate("/login");
    }
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>🔗 Binding Your Google Account...</h1>
      <p>Please wait, we're logging you back in.</p>
    </div>
  );
}
