'use client'

import Header from '@/app/components/shared/Header'
import Sidebar from '@/app/components/shared/Sidebar'

export default function UsersPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', width: '100%' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1f2937' }}>Users</h2>
          <p style={{ color: '#6b7280' }}>User management page</p>
        </main>
      </div>
    </div>
  )
}
