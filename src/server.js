require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;
const AUTH_USER = process.env.AUTH_USER || 'Kuhandran';
const ALLOWED_IP = process.env.ALLOWED_IP || 'localhost';

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║          📁 File Manager with Express.js Backend                     ║
║                                                                      ║
║  🚀 Server Running:  http://localhost:${PORT}                            
║  🔐 Login Page:      http://localhost:${PORT}/login                      
║  📊 Dashboard:       http://localhost:${PORT}/dashboard                  
║                                                                      ║
║  Authentication:                                                     ║
║  ├─ Username: ${AUTH_USER}                                      ║
║  ├─ IP Allowed: ${ALLOWED_IP}                      ║
║  └─ Token: JWT (24h expiry)                                          ║
║                                                                      ║
║  Routes:                                                             ║
║  ├─ POST   /api/auth/login              - Login with credentials         ║
║  ├─ POST   /api/auth/logout             - Logout                         ║
║  ├─ GET    /api/files/tree              - Get folder structure           ║
║  ├─ GET    /api/files/list/*            - List folder contents           ║
║  ├─ GET    /api/files/read/*            - Read file content              ║
║  ├─ PUT    /api/files/edit/*            - Update file                    ║
║  ├─ DELETE /api/files/delete/*          - Delete file                    ║
║  ├─ GET    /api/files/path/*            - Get file path                  ║
║  ├─ GET    /api/config/languages        - Get language config            ║
║  ├─ GET    /api/config/locales          - Get locale status              ║
║  ├─ GET    /api/config/file-types       - Get file types info            ║
║  ├─ GET    /api/collections/:lang/:type - List locale files              ║
║  ├─ GET    /api/collections/:l/:t/:f    - Read locale file              ║
║  ├─ PATCH  /api/collections/:l/:t/:f    - Update locale file            ║
║  ├─ POST   /api/collections/:l/:t/:f    - Create locale file            ║
║  └─ DELETE /api/collections/:l/:t/:f    - Delete locale file                  ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
  `);
});

process.on('SIGINT', () => {
  console.log('\n[SERVER] Shutting down...');
  server.close(() => {
    console.log('[SERVER] Closed');
    process.exit(0);
  });
});

module.exports = server;
