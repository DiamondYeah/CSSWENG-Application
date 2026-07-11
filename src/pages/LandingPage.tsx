import "./LandingPage.css";
import { Link } from "react-router-dom";
import PublicNav from "../components/PublicNav";

const FEATURES = [
  {
    icon: "📅",
    title: "Visual Queue",
    desc: "Drag, reorder, and preview every post before it goes live.",
  },
  {
    icon: "⚡",
    title: "Bulk Upload",
    desc: "Schedule dozens of posts at once with a CSV or media folder.",
  },
  {
    icon: "📊",
    title: "Unified Analytics",
    desc: "Reach and engagement across all accounts in one dashboard.",
  },
  {
    icon: "🔒",
    title: "Privacy First",
    desc: "Your data is never sold or used for ads. Ever.",
  },
];

export default function LandingPage() {
  return (
    <div className="lp-root">

      {/* NAV */}
      <PublicNav />

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-left">
          <div className="lp-eyebrow">
            <span className="lp-eyebrow-dot">🦅</span>
            Schedule smarter. Grow faster.
          </div>

          <h1 className="lp-headline">
            Manage Social<br />
            Smarter. Schedule.<br />
            <span className="lp-headline-blue">Track. Succeed.</span>
          </h1>

          <p className="lp-sub">
            Plan and publish content effortlessly across TikTok, Instagram,
            LinkedIn, and Facebook. Manage everything in one smart dashboard.
            Work less. Grow more.
          </p>

          <div className="lp-hero-actions">
            <Link to="/dashboard" className="lp-btn-primary">Get Started Now</Link>
            <a href="#features" className="lp-btn-outline">Learn more</a>
          </div>
        </div>

        <div className="lp-hero-right">
          <div className="lp-dashboard-preview">
            <div className="lp-preview-topbar">
              <span className="lp-preview-logo">AgilaPost</span>
              <div className="lp-preview-tabs">
                <span className="lp-preview-tab">Queue</span>
                <span className="lp-preview-tab">Calendar</span>
                <span className="lp-preview-tab">Analytics</span>
              </div>
            </div>
            <div className="lp-preview-stats">
              {[
                { label: "Ideas", color: "#7c3aed", num: 5 },
                { label: "Drafts", color: "#d97706", num: 3 },
                { label: "Scheduled", color: "#2563eb", num: 12 },
                { label: "Published", color: "#16a34a", num: 38 },
              ].map((s) => (
                <div className="lp-preview-stat" key={s.label} style={{ borderBottom: `3px solid ${s.color}` }}>
                  <span className="lp-preview-stat-num">{s.num}</span>
                  <span className="lp-preview-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="lp-preview-body">
              <div className="lp-preview-left">
                <div className="lp-preview-search">🔍 Search posts...</div>
                <div className="lp-preview-empty">
                  <div className="lp-preview-empty-icon">📭</div>
                  <div className="lp-preview-empty-title">No scheduled posts</div>
                  <div className="lp-preview-empty-sub">Plan your content ahead</div>
                  <div className="lp-preview-btns">
                    <button className="lp-preview-create">+ Create a post</button>
                    <button className="lp-preview-bulk">↑ Bulk Upload</button>
                  </div>
                </div>
              </div>
              <div className="lp-preview-right">
                <div className="lp-preview-card-title">Quick Actions</div>
                {["Create a post", "Bulk upload", "Search posts", "Filter by account"].map((action) => (
                  <div className="lp-preview-action" key={action}>
                    <span>{action}</span>
                    <span className="lp-preview-arrow">→</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-features" id="features">
        <div className="lp-features-inner">
          <p className="lp-section-eyebrow">WHAT YOU GET</p>
          <h2 className="lp-section-title">Everything you need, nothing you don't</h2>
          <div className="lp-feature-grid">
            {FEATURES.map((f) => (
              <div className="lp-feature-card" key={f.title}>
                <div className="lp-feature-icon">{f.icon}</div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="lp-cta-banner">
        <h2>Ready to reclaim your time?</h2>
        <p>Join teams already using AgilaPost to stay consistent without the busywork.</p>
        <Link to="/signup" className="lp-btn-primary">Get started — it's free</Link>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <span className="lp-logo-text">AgilaPost</span>
        <div className="lp-footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <a href="mailto:help@agilapostapp.io">Contact</a>
        </div>
        <span className="lp-footer-copy">© {new Date().getFullYear()} AgilaPost Inc.</span>
      </footer>

    </div>
  );
}
