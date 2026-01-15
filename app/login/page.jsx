'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthToken, setUserInfo } from '@/utils/auth';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      if (data.requiresMfa) {
        // MFA required - show MFA input
        setRequiresMfa(true);
        setMfaToken(data.token);
        setLoading(false);
        return;
      }

      // Login successful - store JWT token in localStorage
      console.log('[AUTH] Login successful, storing JWT token in localStorage');
      setAuthToken(data.token);
      setUserInfo(data.user);

      // Redirect to admin dashboard
      router.push('/admin');
    } catch (err) {
      setError('An error occurred during login: ' + err.message);
      setLoading(false);
    }
  }

  async function handleMfaSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfaToken: mfaToken,
          code: mfaCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'MFA verification failed');
        setLoading(false);
        return;
      }

      // MFA verified - store JWT token in localStorage
      console.log('[AUTH] MFA verified, storing JWT token in localStorage');
      setAuthToken(data.token);
      setUserInfo(data.user);

      // Redirect to admin dashboard
      router.push('/admin');
    } catch (err) {
      setError('An error occurred during MFA: ' + err.message);
      setLoading(false);
    }
  }

  if (requiresMfa) {
    return (
      <div className={styles.container}>
        <div className={styles.decorativeBackground}>
          <div className={styles.blob1} />
          <div className={styles.blob2} />
        </div>
        <div className={styles.mainContent}>
          <div className={styles.leftSection}>
            <div className={styles.brandBox}>
              <div className={styles.logo}>🔐</div>
              <h1 className={styles.brandName}>Verification</h1>
              <p className={styles.brandTagline}>Enter your authentication code</p>
            </div>

            <div className={styles.featuresBox}>
              <h3 className={styles.featuresTitle}>Secure MFA</h3>
              <ul className={styles.featuresList}>
                <li className={styles.featureItem}>
                  <span className={styles.featureIcon}>📲</span>
                  <span className={styles.featureText}>One-time codes expire in seconds</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.featureIcon}>⚡️</span>
                  <span className={styles.featureText}>Instant verification feedback</span>
                </li>
              </ul>
            </div>
          </div>

          <div className={styles.rightSection}>
            <div className={styles.formBox}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Multi-Factor Authentication</h2>
                <p className={styles.formSubtitle}>Check your authenticator app for the 6-digit code</p>
              </div>

              <form onSubmit={handleMfaSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="mfaCode">
                    Authentication Code
                  </label>
                  <input
                    className={styles.input}
                    id="mfaCode"
                    type="text"
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength="6"
                    required
                    disabled={loading}
                    autoComplete="one-time-code"
                  />
                </div>

                {error && (
                  <div className={styles.errorMessage}>
                    <span className={styles.errorIcon}>!</span>
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={loading} className={styles.submitButton}>
                  {loading ? (
                    <>
                      <span className={styles.spinner} /> Verifying...
                    </>
                  ) : (
                    '✓ Verify Code'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequiresMfa(false);
                    setMfaCode('');
                    setError('');
                    setPassword('');
                  }}
                  className={styles.backButton}
                >
                  ← Back to Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.decorativeBackground}>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
      </div>
      <div className={styles.mainContent}>
        <div className={styles.leftSection}>
          <div className={styles.brandBox}>
            <div className={styles.logo}>📊</div>
            <h1 className={styles.brandName}>Content Hub</h1>
            <p className={styles.brandTagline}>Secure Admin Dashboard</p>
          </div>

          <div className={styles.featuresBox}>
            <h3 className={styles.featuresTitle}>Why teams choose Content Hub</h3>
            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>🔒</span>
                <span className={styles.featureText}>JWT token authentication with refresh support</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>📱</span>
                <span className={styles.featureText}>Optional multi-factor security per admin</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>💾</span>
                <span className={styles.featureText}>Tokens stored locally for API performance</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.formBox}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Admin Login</h2>
              <p className={styles.formSubtitle}>Sign in to access the dashboard</p>
            </div>

            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="username">
                  Username
                </label>
                <input
                  className={styles.input}
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="password">
                  Password
                </label>
                <input
                  className={styles.input}
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className={styles.errorMessage}>
                  <span className={styles.errorIcon}>!</span>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className={styles.submitButton}>
                {loading ? (
                  <>
                    <span className={styles.spinner} /> Logging in...
                  </>
                ) : (
                  '→ Sign In'
                )}
              </button>
            </form>

            <div className={styles.infoBox}>
              <div className={styles.infoIcon}>🔒</div>
              <div>
                <p className={styles.infoTitle}>Security Notice</p>
                <p className={styles.infoText}>
                  Credentials transmit over TLS. We store JWT tokens in localStorage so every API request stays authenticated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
