import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Verify2FA from "./components/Verify2FA";
import Profile from './pages/Profile'; // or wherever it lives
import Dashboard from "./pages/Dashboard";
import AdminPanel from './pages/AdminPanel';
import ChatHistory from './pages/ChatHistory';
import Assistant from './pages/Assistant'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify2FA />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/chat-history" element={<ChatHistory />} />
        <Route path="/assistant" element={<Assistant />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
