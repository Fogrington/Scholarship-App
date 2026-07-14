import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogoIcon } from "../components/Icons";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname ?? "/overview";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(true);
      return;
    }
    setError(false);
    login(email);
    navigate(from, { replace: true });
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-mark">
          <LogoIcon width={20} height={20} color="#1A1A1A" />
        </div>
        <h1>Confirmea Admin</h1>
        <p className="login-sub">
          Review business applications, manage complaints, and keep the marketplace trustworthy.
        </p>
        {error && <div className="login-error">Enter an email and password to continue.</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">Admin email</label>
            <input
              id="login-email"
              type="email"
              placeholder="admin@confirmea.app"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="login-btn">
            Log in
          </button>
        </form>
        <p className="login-note">
          Prototype build — any email &amp; password logs you in. This panel is separate from the
          customer-facing Confirmea app and will get real authentication before launch.
        </p>
      </div>
    </div>
  );
}
