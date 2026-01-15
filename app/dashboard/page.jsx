'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin dashboard
    router.push('/admin');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #bfdbfe 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#1e3a8a'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Content Hub</h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>Redirecting to admin dashboard...</p>
      </div>
    </div>
  );
}
