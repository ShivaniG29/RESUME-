import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, BriefcaseBusiness, FileText, Lightbulb, LockKeyhole, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ScoreCard from "../components/ScoreCard";
import { api, getErrorMessage } from "../services/api";

const tabs = [
  { id: "report", label: "Overview", icon: FileText },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "jobs", label: "Career matches", icon: BriefcaseBusiness },
  { id: "learning", label: "Learning plan", icon: BookOpen },
];
const colors = ["#6697f5", "#9d8bf4", "#f0ac71", "#55bda8", "#e67d9c", "#8ba5b5"];

function ListSection({ title, items, empty }) {
  return <section className="card content-card"><div className="section-heading"><h2>{title}</h2></div>{items?.length ? <ul className="clean-list">{items.map((item, index) => <li key={`${item}-${index}`}><span className="list-bullet" />{item}</li>)}</ul> : <p className="muted">{empty}</p>}</section>;
}

function SkillsView({ report }) {
  const categories = [
    ["Programming", report.programming_languages], ["Frameworks", report.frameworks],
    ["Databases", report.databases], ["Tools", report.tools], ["Soft skills", report.soft_skills],
  ];
  const chartData = categories.map(([name, skills]) => ({ name, count: skills?.length || 0 })).filter((item) => item.count);
  return <div className="analysis-grid skills-grid">
    <section className="card content-card"><div className="section-heading"><div><p className="eyebrow">WHAT'S IN YOUR TOOLKIT</p><h2>Your skills at a glance</h2></div></div>
      {chartData.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height={230}><PieChart><Pie data={chartData} dataKey="count" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={4}>{chartData.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="chart-legend">{chartData.map((item, index) => <span key={item.name}><i style={{ backgroundColor: colors[index % colors.length] }} />{item.name}<strong>{item.count}</strong></span>)}</div></div> : <p className="muted">No categorized skills were identified in the resume text.</p>}
    </section>
    <div className="category-stack">{categories.map(([name, skills]) => <section className="card content-card skill-category" key={name}><h3>{name}</h3>{skills?.length ? <div className="tag-list">{skills.map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}</div> : <p className="muted small">None identified from the text</p>}</section>)}</div>
  </div>;
}

function JobsView({ report }) {
  return <div className="page-stack">{report.job_recommendations?.length ? report.job_recommendations.map((job) => <section className="card job-card" key={job.title}><div className="job-header"><div className="job-icon"><BriefcaseBusiness size={19} /></div><div><p className="eyebrow">SUGGESTED CAREER MATCH</p><h2>{job.title}</h2></div><strong className="match-pill">{job.match_percentage}% match</strong></div><p className="muted small">A career direction based on skills found in your resume — not a live job opening.</p><div className="job-columns"><div><h3>Skills you have</h3><div className="tag-list">{job.matching_skills?.length ? job.matching_skills.map((skill) => <span className="skill-tag good" key={skill}>{skill}</span>) : <span className="muted small">No matching skills found</span>}</div></div><div><h3>Skills to explore</h3><div className="tag-list">{job.missing_skills?.length ? job.missing_skills.map((skill) => <span className="skill-tag" key={skill}>{skill}</span>) : <span className="muted small">No gaps identified</span>}</div></div></div></section>) : <section className="card empty-state"><h3>No career matches yet</h3><p className="muted">A few more technical skills in your resume may help us suggest relevant directions.</p></section>}</div>;
}

function LearningView({ report }) {
  return <div className="page-stack">{report.learning_suggestions?.length ? report.learning_suggestions.map((item) => <section className="card learning-card" key={item.skill}><div className="learning-title"><div className="learning-icon"><Lightbulb size={18} /></div><div><p className="eyebrow">{item.level} LEVEL</p><h2>{item.skill}</h2></div><span className={`priority priority-${report.missing_skills?.find((skill) => skill.skill === item.skill)?.priority || "medium"}`}>{report.missing_skills?.find((skill) => skill.skill === item.skill)?.priority || "suggested"}</span></div><p className="muted">{item.importance}</p><div className="learning-body"><div><h3>Topics to explore</h3><ul className="clean-list">{item.topics?.map((topic) => <li key={topic}><span className="list-bullet" />{topic}</li>)}</ul></div><div><h3>Learning resources</h3><ul className="clean-list">{item.resources?.map((resource) => <li key={resource}><span className="list-bullet" />{resource}</li>)}</ul></div></div></section>) : <section className="card empty-state"><div className="empty-illustration"><BookOpen size={27} /></div><h3>Keep building on what you know</h3><p className="muted">No specific learning gaps were identified. Review career matches for ideas to explore.</p></section>}</div>;
}

export default function AnalysisPage({ section = "report" }) {
  const { resumeId } = useParams();
  const [resume, setResume] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get(`/resume/${resumeId}`).then(({ data }) => setResume(data)).catch((reason) => setError(getErrorMessage(reason)));
  }, [resumeId]);
  const analysis = resume?.latest_analysis;
  const report = analysis?.report;
  const activeSection = useMemo(() => tabs.find((tab) => tab.id === section), [section]);
  if (error) return <div role="alert" className="alert error-alert">{error}</div>;
  if (!resume) return <div className="loading-state"><div className="spinner" />Loading your report…</div>;
  if (!report) return <section className="card empty-state"><h2>Your resume is ready for its review.</h2><p className="muted">This upload hasn't been analyzed yet.</p><Link className="button primary" to="/upload">Analyze a resume <ArrowRight size={16} /></Link></section>;

  return <div className="page-stack">
    <section className="page-title report-title"><div><p className="eyebrow">YOUR RESUME REVIEW</p><h1>{activeSection?.label || "Resume overview"}</h1><p className="muted"><FileText size={15} /> {resume.filename} <span className="slash">·</span> Reviewed {new Date(analysis.created_at).toLocaleDateString()}</p></div><span className={`mode-badge${analysis.analysis_mode === "openai" ? " ai-mode" : ""}`}><LockKeyhole size={13} />{analysis.analysis_mode === "openai" ? "AI-assisted · opted in" : analysis.analysis_mode === "local_fallback" ? "Local analysis · AI unavailable" : "Private demo analysis"}</span></section>
    <nav className="report-tabs">{tabs.map((tab) => { const Icon = tab.icon; return <Link key={tab.id} className={`report-tab${section === tab.id ? " selected" : ""}`} to={`/analysis/${resumeId}${tab.id === "report" ? "" : `/${tab.id}`}`}><Icon size={16} />{tab.label}</Link>; })}</nav>
    {section === "report" && <div className="analysis-grid"><div className="page-stack"><section className="card summary-card"><div className="summary-icon"><Sparkles size={18} /></div><p className="eyebrow">THE SHORT VERSION</p><h2>Your story, at a glance.</h2><p>{report.summary}</p></section><ListSection title="Education" items={report.education} empty="No education details were identified in the resume text." /><ListSection title="Experience highlights" items={report.experience} empty="No experience details were identified. Add relevant projects or experience if applicable." /><ListSection title="Certifications" items={report.certifications} empty="No certifications were identified in the resume text." /><ListSection title="Key achievements" items={report.achievements} empty="No measurable achievements were identified. Add only outcomes you can verify." /></div><div className="page-stack"><ScoreCard score={analysis.resume_score} breakdown={report.score_breakdown} /><ListSection title="Resume improvements" items={report.improvement_suggestions} empty="No suggestions available." /><section className="privacy-note"><LockKeyhole size={16} /><span>This score is guidance, not a hiring decision or a promise of ATS results.</span></section></div></div>}
    {section === "skills" && <SkillsView report={report} />}
    {section === "jobs" && <JobsView report={report} />}
    {section === "learning" && <LearningView report={report} />}
  </div>;
}
