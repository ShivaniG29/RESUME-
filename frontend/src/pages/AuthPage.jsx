import { useState } from "react";
import { ArrowRight, Check, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../services/api";

export default function AuthPage({ onAuthenticated }) {
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post(`/auth/${registering ? "register" : "login"}`, form);
      onAuthenticated(data);
      navigate("/dashboard");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="landing">
      <nav className="landing-nav">
        <a className="brand" href="/"><span className="brand-mark"><Sparkles size={19} /></span><span>elevate<span className="brand-dot">.</span></span></a>
        <span className="privacy-label"><ShieldCheck size={15} /> Private by design</span>
      </nav>
      <main className="landing-grid">
        <section className="hero">
          <div className="hero-kicker"><span className="kicker-line" /> A clearer path to your next opportunity</div>
          <h1>Your next chapter<br />starts <span>on paper.</span></h1>
          <p className="hero-copy">Thoughtful resume feedback, career matches, and a practical plan to help you show up with confidence.</p>
          <div className="hero-points">
            <div><span className="check-mark"><Check size={14} /></span><span>Useful feedback grounded in your resume</span></div>
            <div><span className="check-mark"><Check size={14} /></span><span>Your resume stays private unless you opt in</span></div>
            <div><span className="check-mark"><Check size={14} /></span><span>Career matches, never made-up job openings</span></div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-glow" />
            <div className="paper-card"><div className="paper-top"><span /><span /><span /></div><div className="paper-avatar" /><div className="paper-lines"><i /><i /><i /></div><div className="paper-heading" /><div className="paper-lines"><i /><i /><i /><i /></div><div className="paper-pill"><Sparkles size={13} /> Looking good</div></div>
            <div className="floating-badge"><span><FileText size={15} /></span><div><strong>Clear, useful feedback</strong><small>One step at a time</small></div></div>
            <div className="floating-spark"><Sparkles size={20} /></div>
          </div>
        </section>
        <section className="auth-card">
          <div className="auth-card-icon"><Sparkles size={19} /></div>
          <p className="eyebrow">{registering ? "YOUR NEXT CHAPTER" : "WELCOME BACK"}</p>
          <h2>{registering ? "Create your account" : "Pick up where you left off."}</h2>
          <p className="muted auth-intro">{registering ? "Your own private space to shape your career story." : "Sign in to your private resume workspace."}</p>
          <form onSubmit={submit} className="auth-form">
            {registering && <label>Your name<input autoComplete="name" required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Jordan Lee" /></label>}
            <label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@college.edu" /></label>
            <label>Password<input type="password" autoComplete={registering ? "new-password" : "current-password"} minLength={registering ? 10 : 1} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={registering ? "At least 10 characters" : "Enter your password"} /></label>
            {error && <div role="alert" className="alert error-alert">{error}</div>}
            <button className="button primary full-button" type="submit" disabled={busy}>{busy ? "One moment…" : registering ? "Create my account" : "Sign in"} <ArrowRight size={17} /></button>
          </form>
          <p className="switch-auth">{registering ? "Already have an account?" : "New to Elevate?"} <button type="button" onClick={() => { setError(""); setRegistering(!registering); }}> {registering ? "Sign in" : "Create an account"}</button></p>
          <div className="auth-security"><ShieldCheck size={15} /><span>Your resume won't be shared with an AI service unless you choose to opt in.</span></div>
        </section>
      </main>
      <footer className="landing-footer"><span>Made for students finding their way.</span><span>Thoughtful tools for your next step <span className="brand-dot">✳</span></span></footer>
    </div>
  );
}
