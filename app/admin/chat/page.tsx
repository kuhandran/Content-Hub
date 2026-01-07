'use client'

import Header from '@/app/components/shared/Header'
import Sidebar from '@/app/components/shared/Sidebar'

export default function ChatPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', width: '100%' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1f2937' }}>Chat Management</h2>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9375rem' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>ID</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>User</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Messages</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem', color: '#1f2937' }}>1</td>
                  <td style={{ padding: '1rem', color: '#1f2937' }}>John Doe</td>
                  <td style={{ padding: '1rem', color: '#1f2937' }}>5</td>
                  <td style={{ padding: '1rem', color: '#6b7280' }}>2024-01-15</td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}
