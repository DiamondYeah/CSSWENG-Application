import { useState } from "react";
import "./FAQ.css";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import PublicNav from "../components/PublicNav";

const FAQ_ITEMS = [
  {
    q: "Which platforms does AgilaPost support?",
    a: "AgilaPost currently integrates with TikTok, Meta (Facebook and Instagram), and LinkedIn. You can connect as many accounts as you manage on each platform.",
  },
  {
    q: "Is there a limit to how many accounts I can connect?",
    a: "On the Free plan you can connect one account. Pro and Business plans support unlimited connected accounts across all supported platforms.",
  },
  {
    q: "Do you sell or share my data?",
    a: "No. We don't sell, trade, or rent your personal data to third parties, and platform data obtained via TikTok, LinkedIn, or Meta APIs is never used for advertising. See our Privacy Policy for the full details.",
  },
  {
    q: "What happens to my scheduled posts if I cancel?",
    a: "Posts that have already been published stay live on your connected platforms. Anything still in your queue or drafts is removed when you delete your account, since it was never published.",
  },
  {
    q: "Can I share a content calendar with a client for approval?",
    a: "Yes. You can generate a shareable calendar link so clients can review, approve, or comment on scheduled content without needing a full AgilaPost account.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes, you can upgrade or downgrade at any time from your account settings. Changes take effect on your next billing cycle.",
  },
  {
    q: "Do you use my content to train AI models?",
    a: "No. Platform APIs and connected social media data are never used to develop, improve, or train AI or machine learning models.",
  },
  {
    q: "What if I need help getting started?",
    a: "Pro and Business plans include priority support, and Business includes dedicated onboarding. You can also reach us any time at help@agilapostapp.io.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="faq-item-question"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <ChevronDown size={18} className="faq-item-chevron" />
      </button>
      {open && <p className="faq-item-answer">{a}</p>}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="faq-root">
      <PublicNav />

      <section className="faq-hero">
        <h1 className="faq-headline">Frequently asked questions</h1>
        <p className="faq-sub">
          Can't find what you're looking for?{" "}
          <a href="mailto:help@agilapostapp.io">Email us</a> and we'll get back to you.
        </p>
      </section>

      <section className="faq-list">
        {FAQ_ITEMS.map((item) => (
          <FAQItem key={item.q} q={item.q} a={item.a} />
        ))}
      </section>

      <section className="faq-cta">
        <p>Ready to get started?</p>
        <Link to="/signup" className="faq-btn-primary">Get Started Now</Link>
      </section>

      <footer className="faq-footer">
        <span className="faq-footer-logo">AgilaPost</span>
        <div className="faq-footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <a href="mailto:help@agilapostapp.io">Contact</a>
        </div>
        <span className="faq-footer-copy">© {new Date().getFullYear()} AgilaPost Inc.</span>
      </footer>
    </div>
  );
}
