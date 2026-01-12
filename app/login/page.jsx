"use client";
import { useState } from "react";

export default function LoginPage() {
  const [step, setStep] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [sessionToken, setSessionToken] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
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
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      setSessionToken(data.sessionToken || data.session_token);
      setQrCode(data.qrCode || data.qr_code);
      setStep("mfa");
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
      setError("Please enter a valid 6-digit code");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          code: fullCode,
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "MFA verification failed");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10">
        {/* Icon and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1C6.48 1 2 5.48 2 11v9c0 .55.45 1 1 1h2v4c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-4h6v4c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-4h2c.55 0 1-.45 1-1v-9c0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Content Hub</h1>
          <p className="text-blue-600 text-base font-medium">Sign in to your admin account</p>
        </div>

        {step === "login" ? (
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-0 placeholder-blue-300 text-gray-800 transition duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-0 placeholder-blue-300 text-gray-800 transition duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-4 rounded-xl transition duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? "Signing in..." : "Continue to MFA"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaVerify} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-4">Enter 6-digit code</label>
              <div className="flex gap-2 justify-center mb-6">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    maxLength="1"
                    placeholder="•"
                    disabled={loading}
                    className="w-14 h-14 text-center border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-0 text-2xl font-bold text-gray-800 placeholder-blue-300 transition duration-200"
                  />
                ))}
              </div>
            </div>

            {qrCode && (
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                <img src={qrCode} alt="QR Code" className="w-32 h-32 mx-auto" />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-4 rounded-xl transition duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("login");
                setCode(["", "", "", "", "", ""]);
                setError("");
              }}
              disabled={loading}
              className="w-full text-blue-600 hover:text-blue-700 font-semibold py-2 transition duration-200"
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
