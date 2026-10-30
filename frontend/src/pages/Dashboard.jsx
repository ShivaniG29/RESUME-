import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, FileCheck2, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../services/api";

export default function Dashboard({ user }) {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/resume/history").then(({ data }) => setHistory(data)).catch((reason) => setError(getErrorMessage(reason)));
  }, []);
  const average = useMemo(() => history.length ? Math.round(history.reduce((total, item) => total + item.resume_score, 0) / history.length) : 0, [history]);
  const roles = useMemo(() => [...new Set(history.flatMap((item) => item.suggested_roles || []))].slice(0, 3), [history]);

  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div><p className="eyebrow">YOUR CAREER TOOLKIT</p><h1>A good day to move forward, {user?.name?.split(" ")[0]}.</h1><p className="muted">A little clarity can go a long way. Let's make your next application count.</p></div>
        <Link className="button primary" to="/upload"><Sparkles size={16} /> Get resume feedback <ArrowRight size={16} /></Link>
      </section>
      {error && <div role="alert" className="alert error-alert">{error}</div>}
      <section className="stat-grid">
        <article className="stat-card"><div className="stat-icon blue"><FileCheck2 size={19} /></div><div><span>Resumes reviewed</span><strong>{new Set(history.map((item) => item.resume_id)).size}</strong><small>Across your workspace</small></div></article>
        <article className="stat-card"><div className="stat-icon lavender"><Target size={19} /></div><div><span>Average resume score</span><strong>{history.length ? `${average}%` : "—"}</strong><small>{history.length ? "A useful place to start" : "Your first review is one click away"}</small></div></article>
        <article className="stat-card"><div className="stat-icon peach"><BriefcaseBusiness size={19} /></div><div><span>Career matches</span><strong>{roles.length || "—"}</strong><small>{roles.length ? roles.join(" · ") : "Suggested roles based on your resume"}</small></div></article>
      </section>
      <section className="dashboard-grid">
        <div className="card recent-card">
          <div className="section-heading"><div><p className="eyebrow">YOUR PROGRESS</p><h2>Recent resume reviews</h2></div><Link className="text-link" to="/history">View history <ArrowUpRight size={15} /></Link></div>
          {history.length ? <div className="recent-list">{history.slice(0, 4).map((item) => <Link className="recent-item" to={`/analysis/${item.resume_id}`} key={item.id}><div className="file-icon"><FileCheck2 size={17} /></div><div className="recent-info"><strong>{item.filename}</strong><span>{new Date(item.created_at).toLocaleDateString()} · {item.analysis_mode === "openai" ? "AI-assisted" : item.analysis_mode === "local_fallback" ? "Local fallback analysis" : "Private demo analysis"}</span></div><div className="recent-score">{item.resume_score}<small>/100</small></div><ArrowRight size={16} className="recent-arrow" /></Link>)}</div> :
            <div className="empty-state"><div className="empty-illustration"><FileCheck2 size={28} /></div><h3>Your next step starts here</h3><p>Upload a resume to get thoughtful, practical feedback tailored to your experience.</p><Link className="button secondary" to="/upload">Review my resume <ArrowRight size={15} /></Link></div>}
        </div>
        <aside className="card next-card"><div className="next-card-glow" /><div className="next-icon"><Sparkles size={19} /></div><p className="eyebrow">A THOUGHTFUL FIRST STEP</p><h2>Make your experience easy to see.</h2><p className="muted">Clear, specific examples help a reader understand the work you've done and the strengths you bring.</p><div className="tip-box"><span>Try this</span><p>Start a bullet with an action verb. Add a result only when you can support it.</p></div><Link className="text-link" to="/upload">Get a fresh perspective <ArrowRight size={15} /></Link></aside>
      </section>
    </div>
  );
}
