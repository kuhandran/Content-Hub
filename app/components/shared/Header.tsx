'use client'

export default function Header() {
  return (
    <header style={{ borderBottom: '1px solid #e5e7eb', padding: '1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>Content Hub</h1>
        </div>
        <nav style={{ display: 'flex', gap: '2rem' }}>
          <a href="/" style={{ color: '#1f2937', textDecoration: 'none', fontSize: '0.9375rem' }}>Home</a>
        </nav>
      </div>
    </header>
  )
}
