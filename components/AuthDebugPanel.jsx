/**
 * components/AuthDebugPanel.jsx
 * 
 * Debug panel to view authentication logs and logout history
 * Shows:
 * - Logout event logs with reasons
 * - Token expiration status
 * - User information
 * - API errors
 */

'use client';

import { useState, useEffect } from 'react';
import { getLogoutLogs, clearLogoutLogs, getAuthToken, getUserInfo, isTokenExpired, getTokenExpiryTime } from '@/utils/auth';
import styles from './AuthDebugPanel.module.css';

export default function AuthDebugPanel() {
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);

  useEffect(() => {
    loadLogs();
    loadTokenInfo();
  }, [showLogs]);

  function loadLogs() {
    const logsList = getLogoutLogs();
    setLogs(logsList);
  }

  function loadTokenInfo() {
    const token = getAuthToken();
    const user = getUserInfo();
    if (token) {
      setTokenInfo({
        exists: true,
        expired: isTokenExpired(token),
        expiresIn: getTokenExpiryTime(),
        expiresInMinutes: Math.floor(getTokenExpiryTime() / 60),
        user: user
      });
    } else {
      setTokenInfo({ exists: false });
    }
  }

  function handleClearLogs() {
    if (confirm('Clear all logout logs?')) {
      clearLogoutLogs();
      setLogs([]);
    }
  }

  function downloadLogs() {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logout-logs-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.debugPanel}>
      <button 
        className={styles.toggleButton}
        onClick={() => setShowLogs(!showLogs)}
        title="Toggle authentication debug panel"
      >
        🔍 Auth Debug {showLogs ? '▼' : '▶'}
      </button>

      {showLogs && (
        <div className={styles.panelContent}>
          {/* Token Info */}
          <div className={styles.section}>
            <h3>🔐 Token Status</h3>
            {tokenInfo && (
              <div className={styles.info}>
                {tokenInfo.exists ? (
                  <>
                    <p className={tokenInfo.expired ? styles.expired : styles.valid}>
                      {tokenInfo.expired ? '❌ EXPIRED' : '✅ VALID'}
                    </p>
                    <p>Expires in: <strong>{tokenInfo.expiresInMinutes}m</strong> ({tokenInfo.expiresIn}s)</p>
                    {tokenInfo.user && (
                      <p>User ID: <code>{tokenInfo.user.id || tokenInfo.user.uid || 'unknown'}</code></p>
                    )}
                  </>
                ) : (
                  <p className={styles.expired}>❌ No token found</p>
                )}
              </div>
            )}
          </div>

          {/* Logout History */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>📋 Logout History ({logs.length})</h3>
              <div className={styles.actions}>
                <button 
                  className={styles.actionButton}
                  onClick={downloadLogs}
                  disabled={logs.length === 0}
                  title="Download logs as JSON"
                >
                  📥 Download
                </button>
                <button 
                  className={styles.actionButton + ' ' + styles.danger}
                  onClick={handleClearLogs}
                  disabled={logs.length === 0}
                  title="Clear all logout logs"
                >
                  🗑️ Clear
                </button>
              </div>
            </div>

            {logs.length === 0 ? (
              <p className={styles.empty}>No logout events logged yet</p>
            ) : (
              <div className={styles.logsList}>
                {logs.map((log, idx) => (
                  <div key={idx} className={styles.logEntry}>
                    <div className={styles.logHeader}>
                      <span className={styles.timestamp}>{new Date(log.timestamp).toLocaleString()}</span>
                      <span className={styles.reason}>{log.reason}</span>
                    </div>
                    <div className={styles.logDetails}>
                      {log.url && <p>📍 <code>{log.url}</code></p>}
                      {log.details?.endpoint && (
                        <p>🔗 API: <code>{log.details.method || 'GET'} {log.details.endpoint}</code></p>
                      )}
                      {log.details?.serverMessage && (
                        <p>⚠️ Server: <span className={styles.error}>{log.details.serverMessage}</span></p>
                      )}
                      {log.details?.userEmail && (
                        <p>👤 User: <strong>{log.details.userEmail}</strong></p>
                      )}
                      {log.details?.component && (
                        <p>📦 Component: <code>{log.details.component}</code></p>
                      )}
                      {log.details?.activeTab && (
                        <p>📑 Tab: <code>{log.details.activeTab}</code></p>
                      )}
                      {log.details?.tokenExpired !== undefined && (
                        <p>🔐 Token: {log.details.tokenExpired ? '⏰ EXPIRED' : '✅ Valid'}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className={styles.section + ' ' + styles.tips}>
            <h3>💡 Debug Tips</h3>
            <ul>
              <li>Check token expiration and refresh if needed</li>
              <li>Review logout reasons to identify patterns</li>
              <li>Look for API errors that trigger forced logout</li>
              <li>Download logs for offline analysis</li>
              <li>Check browser console (F12) for detailed error messages</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
