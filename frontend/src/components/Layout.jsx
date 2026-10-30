import { BarChart3, BookOpen, BriefcaseBusiness, Clock3, FileUp, LayoutDashboard, LogOut, Sparkles } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/upload", label: "Upload resume", icon: FileUp },
  { to: "/history", label: "Analysis history", icon: Clock3 },
];

export default function Layout({ user, onLogout }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/dashboard" className="brand">
          <span className="brand-mark"><Sparkles size={19} /></span>
          <span>elevate<span className="brand-dot">.</span></span>
        </NavLink>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="note-icon"><Sparkles size={16} /></div>
          <strong>A little progress adds up.</strong>
          <p>One thoughtful update can make your next application stronger.</p>
        </div>
        <div className="profile">
          <div className="avatar">{user?.name?.slice(0, 1).toUpperCase() || "S"}</div>
          <div className="profile-name"><strong>{user?.name}</strong><span>Student account</span></div>
          <button className="icon-button" onClick={onLogout} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <span>Career toolkit <span className="slash">/</span> Resume coach</span>
          <span className="privacy-label"><span className="privacy-dot" /> Your workspace is private</span>
        </header>
        <div className="page-content"><Outlet /></div>
        <footer className="app-footer">Your career story, told with confidence. <span>Built for your next step.</span></footer>
      </main>
    </div>
  );
}
