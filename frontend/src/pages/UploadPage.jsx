import { useRef, useState } from "react";
import { ArrowRight, CheckCircle2, FileText, LockKeyhole, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../services/api";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export default function UploadPage() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [consent, setConsent] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const navigate = useNavigate();

  function chooseFile(candidate) {
    setError("");
    setResumeId(null);
    if (!candidate) return;
    const extension = candidate.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(extension)) {
      setFile(null);
      setError("Choose a PDF or DOCX file.");
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setFile(null);
      setError("This file is larger than 5 MiB. Choose a smaller resume.");
      return;
    }
    setFile(candidate);
  }

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError("");
    setProgress(0);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await api.post("/resume/upload", formData, {
        onUploadProgress: (event) => setProgress(event.total ? Math.round((event.loaded * 100) / event.total) : 40),
      });
      setResumeId(data.id);
      setProgress(100);
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function analyze() {
    if (!resumeId) return;
    setBusy(true);
    setError("");
    try {
      await api.post("/resume/analyze", { resume_id: resumeId, ai_consent: consent });
      navigate(`/analysis/${resumeId}`);
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-stack narrow-page">
      <section className="page-title"><p className="eyebrow">A FRESH PERSPECTIVE</p><h1>Let's take a look at your resume.</h1><p className="muted">We'll help you see what's working and where your next opportunity to grow might be.</p></section>
      <section className="card upload-card">
        <div className={`drop-zone${dragging ? " drag-over" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0]); }}>
          <input ref={inputRef} className="visually-hidden" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => chooseFile(event.target.files?.[0])} />
          <div className="upload-icon"><UploadCloud size={25} /></div>
          {file ? <><h2>Ready when you are</h2><p className="muted">Your resume is selected. Let's take the next step.</p><div className="selected-file"><FileText size={17} /><span>{file.name}</span><button type="button" className="remove-file" onClick={() => { setFile(null); setResumeId(null); }}>Remove</button></div></> : <><h2>Drop your resume here</h2><p className="muted">or <button type="button" className="inline-button" onClick={() => inputRef.current?.click()}>browse files</button> from your device</p><span className="file-spec">PDF or DOCX · Up to 5 MB</span></>}
          {!file && <button className="button secondary choose-button" onClick={() => inputRef.current?.click()}><UploadCloud size={16} /> Choose a file</button>}
        </div>
        {busy && progress > 0 && <div className="upload-progress"><div className="progress-caption"><span>Uploading securely…</span><strong>{progress}%</strong></div><div className="score-track"><div className="score-fill" style={{ width: `${progress}%` }} /></div></div>}
        {error && <div role="alert" className="alert error-alert">{error}</div>}
        {resumeId ? <div className="upload-ready"><div><CheckCircle2 size={19} /><span><strong>Resume uploaded</strong><small>Your file was processed; the original isn't stored.</small></span></div><button className="button primary" onClick={analyze} disabled={busy}>Analyze my resume <ArrowRight size={16} /></button></div> :
          <button className="button primary full-button upload-submit" onClick={upload} disabled={!file || busy}>{busy ? "Uploading…" : "Continue with this resume"} <ArrowRight size={16} /></button>}
      </section>
      <section className="consent-card"><div className="consent-icon"><LockKeyhole size={18} /></div><div><strong>Your resume stays yours.</strong><p>By default, analysis runs privately on this app. If you choose AI feedback below, your extracted resume text will be sent to OpenAI for this analysis.</p><label className="consent-check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I'm comfortable sending my resume text to OpenAI for AI-assisted feedback. I can leave this unchecked and use private demo analysis.</span></label></div></section>
      <div className="privacy-footnote"><ShieldCheck size={15} /><span>Only PDF and DOCX text is analyzed. Resume files are processed in memory, not kept on the server.</span><Sparkles size={14} /></div>
    </div>
  );
}
