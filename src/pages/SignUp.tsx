import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

export default function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    const account = {
      fullName: fullName || "New User",
      email: email.toLowerCase(),
      gender,
      password,
    };
    localStorage.setItem("agilaPostUser", JSON.stringify(account));
    navigate("/dashboard");
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">AgilaPost</div>
          <p>Start scheduling faster with a secure account and personal profile details.</p>
        </div>

        <div className="auth-back-wrapper">
          <Link to="/" className="auth-back-button">← Back to landing</Link>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Sign Up</h1>
          <p className="auth-subtitle">Create your AgilaPost account using email and a secure password.</p>

          <label>
            Full name
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your name"
              required
            />
          </label>

          <div className="auth-field">
            <span className="auth-field-label">Gender</span>
            <div className="gender-options">
              <button
                type="button"
                className={gender === "male" ? "gender-option active male" : "gender-option male"}
                onClick={() => setGender("male")}
              >
                Male
              </button>
              <button
                type="button"
                className={gender === "female" ? "gender-option active female" : "gender-option female"}
                onClick={() => setGender("female")}
              >
                Female
              </button>
            </div>
          </div>

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
              placeholder="At least 8 characters"
              required
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              required
            />
          </label>

          {error ? <div className="auth-error">{error}</div> : null}

          <button type="submit" className="auth-submit">Create account</button>

          <div className="auth-footer-text">
            Already have an account? <Link to="/signin">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}