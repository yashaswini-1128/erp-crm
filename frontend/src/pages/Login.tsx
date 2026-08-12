import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState("admin@erpcrm.test");
  const [password, setPassword] = useState("Password@123");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/");
    } catch {
      // error shown via context
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">O</div>
          <div className="login-title">Orbit ERP + CRM</div>
        </div>
        <div className="login-sub">Mini ERP / CRM Operations Portal — sign in to continue</div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary" type="submit" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="demo-creds">
          <div><b>Demo logins</b> (password: Password@123)</div>
          <div>admin@erpcrm.test — Admin</div>
          <div>sales@erpcrm.test — Sales</div>
          <div>warehouse@erpcrm.test — Warehouse</div>
          <div>accounts@erpcrm.test — Accounts</div>
        </div>
      </div>
    </div>
  );
}
