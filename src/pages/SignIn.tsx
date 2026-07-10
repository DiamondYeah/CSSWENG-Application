import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

const COMMON_USER = {
  email: "demo@agilapost.app",
  password: "DemoPass123!",
  fullName: "Demo User",
};

function getStoredUser() {
  const saved = localStorage.getItem("agilaPostUser");
  if (!saved) return COMMON_USER;
  try {
    return JSON.parse(saved);
  } catch {
    return COMMON_USER;
  }
}

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const user = getStoredUser();
    if (email.toLowerCase() === user.email.toLowerCase() && password === user.password) {
      navigate("/dashboard");
      return;
    }
    setError("Email or password is incorrect. Please try again or sign up for a new account.");
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">AgilaPost</div>
          <p>Secure sign in for your social media planner.</p>
        </div>

        <div className="auth-back-wrapper">
          <Link to="/" className="auth-back-button">← Back to landing</Link>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Sign In</h1>
          <p className="auth-subtitle">Access your AgilaPost workspace with your email and password.</p>

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>

          {error ? <div className="auth-error">{error}</div> : null}

          <button type="submit" className="auth-submit">Sign In</button>

          <div className="auth-footer-text">
            New here? <Link to="/signup">Create an account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
