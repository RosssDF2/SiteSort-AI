import axios from "axios";

const http = axios.create({
  baseURL: "http://localhost:3001/api",  // ✅ make sure this matches your backend
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default http;