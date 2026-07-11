import { Link } from "react-router-dom";
import "./PublicNav.css";

export default function PublicNav() {
  return (
    <nav className="lp-nav">
      <div className="lp-nav-logo">
        <Link to="/" className="lp-logo-text">AgilaPost</Link>
      </div>
      <div className="lp-nav-links">
        <Link to="/#features">Features</Link>
        <Link to="/pricing">Pricing</Link>
        <Link to="/faq">FAQs</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms Of Service</Link>
      </div>
      <div className="lp-nav-cta">
        <Link to="/signin" className="lp-signin">Sign In</Link>
        <Link to="/signup" className="lp-btn-signup">Sign Up</Link>
      </div>
    </nav>
  );
}
