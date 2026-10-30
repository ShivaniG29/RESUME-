import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import AnalysisPage from "./pages/AnalysisPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import HistoryPage from "./pages/HistoryPage";
import UploadPage from "./pages/UploadPage";
import { api } from "./services/api";

function Protected({ user, children }) {
  return user ? children : <Navigate to="/" replace />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("resume-analyzer-token");
    if (!token) { setReady(true); return; }
    api.get("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => localStorage.removeItem("resume-analyzer-token"))
      .finally(() => setReady(true));
  }, []);

  function authenticated(data) {
    localStorage.setItem("resume-analyzer-token", data.access_token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("resume-analyzer-token");
    setUser(null);
    navigate("/");
  }

  if (!ready) return <div className="loading-state"><div className="spinner" />Getting your workspace ready…</div>;
  return <Routes>
    <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage onAuthenticated={authenticated} />} />
    <Route element={<Protected user={user}><Layout user={user} onLogout={logout} /></Protected>}>
      <Route path="/dashboard" element={<Dashboard user={user} />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/analysis/:resumeId" element={<AnalysisPage />} />
      <Route path="/analysis/:resumeId/skills" element={<AnalysisPage section="skills" />} />
      <Route path="/analysis/:resumeId/jobs" element={<AnalysisPage section="jobs" />} />
      <Route path="/analysis/:resumeId/learning" element={<AnalysisPage section="learning" />} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Route>
  </Routes>;
}
