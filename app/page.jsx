'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.push('/login');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #1a2847 0%, #243559 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#e2e8f0'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Content Hub</h1>
        <p style={{ fontSize: '14px', color: 'rgba(226, 232, 240, 0.6)' }}>Redirecting to login...</p>
      </div>
    </div>
  );
}
