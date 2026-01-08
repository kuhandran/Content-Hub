export default function Home() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Backend API Server</h1>
      <p>Port 3001 - API Routes Only</p>
      <p>Access API at: /api</p>
      <pre style={{ 
        background: '#f0f0f0', 
        padding: '1rem', 
        borderRadius: '4px',
        textAlign: 'left',
        display: 'inline-block'
      }}>
{`Available Endpoints:
- GET  /api
- GET  /api/admin/operations
- POST /api/admin/operations
- GET  /api/admin/db
- POST /api/admin/db
- GET  /api/admin/data
- POST /api/admin/data
- GET  /api/admin/sync
- POST /api/admin/sync`}
      </pre>
    </div>
  );
}
