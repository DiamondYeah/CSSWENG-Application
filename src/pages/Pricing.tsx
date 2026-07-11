import "./Pricing.css";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import PublicNav from "../components/PublicNav";

const TIERS = [
  {
    name: "Free",
    price: "₱0",
    period: "forever",
    description: "For getting started with one or two accounts.",
    features: [
      "1 connected account",
      "10 scheduled posts / month",
      "Visual content queue",
      "Basic analytics",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₱199",
    period: "/ month",
    description: "For creators managing multiple platforms.",
    features: [
      "Unlimited connected accounts",
      "Unlimited scheduled posts",
      "Bulk upload via CSV",
      "Unified analytics dashboard",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Business",
    price: "₱499",
    period: "/ month",
    description: "For small agencies managing client accounts.",
    features: [
      "Everything in Pro",
      "Categories & timeslots",
      "Client calendar sharing",
      "Team collaboration",
      "Dedicated onboarding",
    ],
    cta: "Start Business Trial",
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <div className="pr-root">
      <PublicNav />

      <section className="pr-hero">
        <h1 className="pr-headline">Simple pricing that scales with you</h1>
        <p className="pr-sub">
          Start free. Upgrade when you're ready to manage more accounts and more content.
        </p>
      </section>

      <section className="pr-tiers">
        {TIERS.map((tier) => (
          <div key={tier.name} className={`pr-card ${tier.highlighted ? "is-highlighted" : ""}`}>
            {tier.highlighted && <div className="pr-badge">Most popular</div>}
            <h2 className="pr-card-name">{tier.name}</h2>
            <p className="pr-card-desc">{tier.description}</p>
            <div className="pr-card-price">
              <span className="pr-card-price-num">{tier.price}</span>
              <span className="pr-card-price-period">{tier.period}</span>
            </div>
            <Link
              to="/signup"
              className={tier.highlighted ? "pr-btn-primary" : "pr-btn-outline"}
            >
              {tier.cta}
            </Link>
            <ul className="pr-feature-list">
              {tier.features.map((f) => (
                <li key={f}>
                  <Check size={15} className="pr-check-icon" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="pr-footnote">
        <p>
          Have questions about which plan is right for you?{" "}
          <Link to="/faq">Check our FAQ</Link> or{" "}
          <a href="mailto:help@agilapostapp.io">contact us</a>.
        </p>
      </section>

      <footer className="pr-footer">
        <span className="pr-footer-logo">AgilaPost</span>
        <div className="pr-footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <a href="mailto:help@agilapostapp.io">Contact</a>
        </div>
        <span className="pr-footer-copy">© {new Date().getFullYear()} AgilaPost Inc.</span>
      </footer>
    </div>
  );
}
