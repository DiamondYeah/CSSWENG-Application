import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

// Import fetch controller functions
import {registerAccount} from "../controller/fetchController";

export default function SignUp() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Checks whether info has been submitted to backend

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {

    event.preventDefault();
    setError(null);

    if (password !== confirmPassword){

      setError("Passwords do not match.");

      // Reset passwords
      setPassword("");
      setConfirmPassword("");

      return;

    }
    else if(password.length < 8){

      setError("Password must be at least 8 characters.");
      return;

    }

    // Set information to true as it is in the process of being submitted to the backend
    setIsSubmitting(true);


    try{

      // Call registerAccount function to create account from database given username, email, and password
      const registerResult = await registerAccount(username, email, password);


      if(!registerResult.success){

        setError(registerResult.message ?? "Error occured when creating your account. Please try again!");
        return;

      }

      navigate("/dashboard"); // Move back to dashboard

    }catch(err){

      setError("Something went wrong in registering account. Please try again!");

    }finally{

      setIsSubmitting(false); // Set to false since info has already been submitted

    }

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
            Username
            <input
              type="text"
              value={username}
              disabled = {isSubmitting}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username123"
              required
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              value={email}
              disabled = {isSubmitting}
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
              disabled = {isSubmitting}
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
              disabled = {isSubmitting}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              required
            />
          </label>

          {error ? <div className="auth-error">{error}</div> : null}

          {/** Disabled to prevent double clicking when signing in */}
          <button type="submit" className="auth-submit" disabled = {isSubmitting}>

            {isSubmitting ? "Creating account..." : "Create account"}

          </button>

          <div className="auth-footer-text">
            Already have an account? <Link to="/signin">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}