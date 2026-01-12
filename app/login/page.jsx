"use client";
import { useState } from "react";

export default function LoginPage() {
  const [step, setStep] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [sessionToken, setSessionToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      // Check if MFA is required
      if (data.requiresMfa && data.sessionToken) {
        setSessionToken(data.sessionToken);
        setStep("mfa");
      } else {
        // No MFA required, redirect to dashboard
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(index, value) {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  }

  async function handleMfaVerify(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter all 6 digits");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, code: fullCode }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)", padding: "20px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "32px", fontWeight: "400", color: "#1565c0", letterSpacing: "-0.5px", marginBottom: "8px" }}>
            Content Hub
          </div>
          <div style={{ fontSize: "13px", color: "#0d47a1", letterSpacing: "0.2px" }}>
            Sign in to your account
          </div>
        </div>

        {/* Login Card */}
        {step === "login" && (
          <div style={{ background: "#fff", borderRadius: "8px", padding: "32px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {error && (
                <div style={{ padding: "12px 16px", background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: "8px", fontSize: "13px", color: "#c62828", lineHeight: "1.4" }}>
                  {error}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1565c0", marginBottom: "12px", letterSpacing: "0.3px" }}>
                  USERNAME
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoFocus
                  disabled={loading}
                  style={{ width: "100%", padding: "14px 12px", border: "1px solid #90caf9", borderRadius: "4px", fontSize: "15px", background: "#fff", boxSizing: "border-box", outline: "none", transition: "border-color 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                  onFocus={(e) => { e.target.style.borderColor = "#1565c0"; e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05), inset 0 0 0 1px #1565c0"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#90caf9"; e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"; }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1565c0", marginBottom: "12px", letterSpacing: "0.3px" }}>
                  PASSWORD
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={loading}
                  style={{ width: "100%", padding: "14px 12px", border: "1px solid #90caf9", borderRadius: "4px", fontSize: "15px", background: "#fff", boxSizing: "border-box", outline: "none", transition: "border-color 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                  onFocus={(e) => { e.target.style.borderColor = "#1565c0"; e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05), inset 0 0 0 1px #1565c0"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#90caf9"; e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"; }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ padding: "12px 24px", background: "#1976d2", color: "#fff", border: "none", borderRadius: "4px", fontSize: "15px", fontWeight: "500", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: loading ? 0.8 : 1, boxShadow: "0 2px 4px rgba(25, 118, 210, 0.3)" }}
                onMouseEnter={(e) => !loading && (e.target.style.background = "#1565c0", e.target.style.boxShadow = "0 4px 8px rgba(25, 118, 210, 0.4)")}
                onMouseLeave={(e) => !loading && (e.target.style.background = "#1976d2", e.target.style.boxShadow = "0 2px 4px rgba(25, 118, 210, 0.3)")}
              >
                {loading ? "Signing in..." : "Next"}
              </button>
            </form>
          </div>
        )}

        {/* MFA Card */}
        {step === "mfa" && (
          <div style={{ background: "#fff", borderRadius: "8px", padding: "32px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: "13px", color: "#0d47a1", marginBottom: "24px", lineHeight: "1.5" }}>
              We sent a 6-digit code to your authenticator app
            </div>

            <form onSubmit={handleMfaVerify} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {error && (
                <div style={{ padding: "12px 16px", background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: "8px", fontSize: "13px", color: "#c62828", lineHeight: "1.4" }}>
                  {error}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1565c0", marginBottom: "16px", letterSpacing: "0.3px" }}>
                  VERIFICATION CODE
                </label>
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      maxLength="1"
                      placeholder="0"
                      disabled={loading}
                      style={{ width: "44px", height: "44px", textAlign: "center", border: "1px solid #90caf9", borderRadius: "4px", fontSize: "20px", fontWeight: "600", color: "#1565c0", background: "#fff", outline: "none", transition: "border-color 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                      onFocus={(e) => { e.target.style.borderColor = "#1565c0"; e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05), inset 0 0 0 1px #1565c0"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#90caf9"; e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"; }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ padding: "12px 24px", background: "#1976d2", color: "#fff", border: "none", borderRadius: "4px", fontSize: "15px", fontWeight: "500", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: loading ? 0.8 : 1, boxShadow: "0 2px 4px rgba(25, 118, 210, 0.3)" }}
                onMouseEnter={(e) => !loading && (e.target.style.background = "#1565c0", e.target.style.boxShadow = "0 4px 8px rgba(25, 118, 210, 0.4)")}
                onMouseLeave={(e) => !loading && (e.target.style.background = "#1976d2", e.target.style.boxShadow = "0 2px 4px rgba(25, 118, 210, 0.3)")}
              >
                {loading ? "Verifying..." : "Verify"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("login"); setError(""); }}
                disabled={loading}
                style={{ padding: "10px 24px", background: "#fff", color: "#1976d2", border: "1px solid #90caf9", borderRadius: "4px", fontSize: "14px", fontWeight: "500", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.target.style.background = "#e3f2fd"; e.target.style.borderColor = "#1565c0"; }}
                onMouseLeave={(e) => { e.target.style.background = "#fff"; e.target.style.borderColor = "#90caf9"; }}
              >
                Back
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: "40px", textAlign: "center", fontSize: "12px", color: "#0d47a1" }}>
          <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
            <a href="#" style={{ color: "#1976d2", textDecoration: "none", fontSize: "12px" }}>Help</a>
            <a href="#" style={{ color: "#1976d2", textDecoration: "none", fontSize: "12px" }}>Privacy</a>
            <a href="#" style={{ color: "#1976d2", textDecoration: "none", fontSize: "12px" }}>Terms</a>
          </div>
        </div>
      </div>
    </div>
  );
}
