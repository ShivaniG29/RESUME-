import { useEffect, useState } from "react";
import { ArrowRight, Clock3, FileText, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, getErrorMessage } from "../services/api";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  async function load() {
    try { const { data } = await api.get("/resume/history"); setHistory(data); } catch (reason) { setError(getErrorMessage(reason)); }
  }
  useEffect(() => { load(); }, []);

  async function remove(item) {
    if (!window.confirm(`Delete "${item.filename}" and all of its analysis history?`)) return;
    setError("");
    try { await api.delete(`/resume/${item.resume_id}`); await load(); } catch (reason) { setError(getErrorMessage(reason)); }
  }
  const best = history.length ? Math.max(...history.map((item) => item.resume_score)) : 0;

  return <div className="page-stack">
    <section className="page-title"><p className="eyebrow">EVERY STEP COUNTS</p><h1>Your progress, all in one place.</h1><p className="muted">Look back at your resume reviews and see how your story is taking shape.</p></section>
    {error && <div role="alert" className="alert error-alert">{error}</div>}
    {history.length > 0 && <div className="history-summary"><div><Clock3 size={17} /><span>{history.length} review{history.length === 1 ? "" : "s"}</span></div><div><span>Personal best</span><strong>{best}<small>/100</small></strong></div></div>}
    {history.length > 1 && <section className="card score-history-chart"><div className="section-heading"><div><p className="eyebrow">YOUR PROGRESS OVER TIME</p><h2>Compare resume scores</h2></div></div><ResponsiveContainer width="100%" height={190}><BarChart data={history.slice(0, 8).reverse().map((item) => ({ name: new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }), score: item.resume_score }))} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}><CartesianGrid stroke="#eef1f6" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10, fill: "#919bad" }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#a0a8b7" }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="score" name="Resume score" fill="#7892dc" radius={[5, 5, 0, 0]} maxBarSize={38} /></BarChart></ResponsiveContainer></section>}
    <section className="card history-card">
      {history.length ? <div className="history-table"><div className="history-head"><span>RESUME</span><span>REVIEWED</span><span>SCORE</span><span>MODE</span><span /></div>{history.map((item) => <div className="history-row" key={item.id}><div className="history-file"><span className="file-icon"><FileText size={17} /></span><strong>{item.filename}</strong></div><span className="history-date">{new Date(item.created_at).toLocaleDateString()}</span><strong className="history-score">{item.resume_score}<small>/100</small></strong><span className={`mode-badge${item.analysis_mode === "openai" ? " ai-mode" : ""}`}>{item.analysis_mode === "openai" ? "AI-assisted" : item.analysis_mode === "local_fallback" ? "Local fallback" : "Private"}</span><div className="history-actions"><Link className="icon-button" to={`/analysis/${item.resume_id}`} aria-label={`Open ${item.filename} report`}><ArrowRight size={17} /></Link><button className="icon-button danger-hover" onClick={() => remove(item)} aria-label={`Delete ${item.filename}`}><Trash2 size={16} /></button></div></div>)}</div> :
        <div className="empty-state"><div className="empty-illustration"><Clock3 size={27} /></div><h2>Your story is just getting started.</h2><p>Once you've reviewed a resume, you'll find your progress here.</p><Link className="button primary" to="/upload">Review a resume <ArrowRight size={16} /></Link></div>}
    </section>
    <p className="history-delete-note">Deleting a resume removes its extracted text and all associated analysis reports from this database.</p>
  </div>;
}
