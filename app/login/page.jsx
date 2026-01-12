"use client";
import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("login");
  const [secret, setSecret] = useState("");
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");

  async function doLogin() {
    setError("");
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Login failed'); return; }
    if (data.requiresMfa) {
      const setup = await fetch('/api/auth/mfa/setup', { method: 'POST' });
      const sdata = await setup.json();
      if (setup.ok) { setSecret(sdata.secret); setQr(sdata.qr); setStep('mfa'); } else { setError(sdata.error || 'MFA setup failed'); }
    } else {
      window.location.href = '/';
    }
  }

  async function verifyMfa() {
    setError("");
    const res = await fetch('/api/auth/mfa/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: code, secret }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Invalid code'); return; }
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eef5ff]">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl">🔒</div>
          <h1 className="mt-3 text-xl font-semibold text-blue-700">Content Hub</h1>
          <p className="text-sm text-blue-500">Sign in to your admin account</p>
        </div>

        {step === 'login' && (
          <>
            <label className="text-xs text-gray-600">Username</label>
            <input className="w-full border rounded-md p-3 mb-4" placeholder="Enter username" value={username} onChange={e=>setUsername(e.target.value)} />
            <label className="text-xs text-gray-600">Password</label>
            <input className="w-full border rounded-md p-3 mb-4" type="password" placeholder="Enter password" value={password} onChange={e=>setPassword(e.target.value)} />
            {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
            <button onClick={doLogin} className="w-full bg-blue-600 text-white rounded-md p-3">Continue to MFA</button>
          </>
        )}

        {step === 'mfa' && (
          <>
            <div className="flex flex-col items-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl">🔐</div>
              <h2 className="mt-3 text-lg font-semibold text-blue-700">Two-Factor Authentication</h2>
              <p className="text-sm text-blue-500 text-center">Scan the QR in your authenticator and enter the 6-digit code</p>
            </div>
            {qr && <img src={qr} alt="QR Code" className="mx-auto mb-4" />}
            <input className="w-full border rounded-md p-3 mb-4 text-center tracking-widest" placeholder="123456" value={code} onChange={e=>setCode(e.target.value)} />
            {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
            <button onClick={verifyMfa} className="w-full bg-blue-600 text-white rounded-md p-3">Verify & Sign In</button>
          </>
        )}
      </div>
    </div>
  );
}
