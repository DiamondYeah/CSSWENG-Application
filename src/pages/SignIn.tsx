import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";
import { loginAccount } from "../controller/fetchController";


export default function SignIn() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Checks whether info has been submitted to backend

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    
    event.preventDefault();
    setError(null);

    // Set information to true as it is in the process of being submitted to the backend
    setIsSubmitting(true);


    try{

      // Call loginAccount function to get account from database given username and password
      const loginResult = await loginAccount(username, password);


      if(!loginResult.success){

        setError(loginResult.message ?? "Error occured when logging into your account. Please try again!");
        return;

      }

      navigate("/dashboard"); // Move back to dashboard

    }catch(err){

      setError("Something went wrong in logging into account. Please try again!");

    }finally{

      setIsSubmitting(false); // Set to false since info has already been submitted

    }



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
          <p className="auth-subtitle">Access your AgilaPost workspace with your username and password.</p>

          <label>
            Username
            <input
              type = "text"
              autoComplete = "username"
              value={username}
              disabled = {isSubmitting}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username123"
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
              placeholder="Enter your password"
              required
            />
          </label>

          {error ? <div className="auth-error">{error}</div> : null}

          {/** Disabled to prevent double clicking when signing in */}
          <button type="submit" className="auth-submit" disabled = {isSubmitting}>

            {isSubmitting ? "Signing In..." : "Sign In"}

          </button>

          <div className="auth-footer-text">
            New here? <Link to="/signup">Create an account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
