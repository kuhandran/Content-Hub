import fs from 'fs';
import path from 'path';

// Log file path - in .next/static for Vercel (writable)
const getLogPath = () => {
  const dir = path.join(process.cwd(), '.next/static/logs');
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (error) {
      console.error('Could not create log directory:', error);
    }
  }
  return path.join(dir, 'api-logs.jsonl');
};

const logs = [];
const MAX_LOGS = 1000; // Keep last 1000 logs in memory

export function logRequest(req, context = {}) {
  const log = {
    timestamp: new Date().toISOString(),
    type: 'REQUEST',
    method: req.method,
    url: req.url,
    headers: {
      // Next.js Request uses the WHATWG Headers API
      'content-type': typeof req.headers?.get === 'function' ? req.headers.get('content-type') : undefined,
      'user-agent': typeof req.headers?.get === 'function' ? req.headers.get('user-agent') : undefined,
    },
    body: req.body || null,
    ...context,
  };
  
  // IMPORTANT: Log to console so it appears in Vercel logs
  console.log(`[REQUEST] ${log.method} ${log.url}`, log);
  
  addLog(log);
  return log;
}

export function logResponse(statusCode, data, context = {}) {
  const log = {
    timestamp: new Date().toISOString(),
    type: 'RESPONSE',
    statusCode,
    data,
    ...context,
  };
  
  // IMPORTANT: Log to console so it appears in Vercel logs
  console.log(`[RESPONSE] Status ${statusCode}`, log);
  
  addLog(log);
  return log;
}

export function logDatabase(operation, table, details = {}) {
  const log = {
    timestamp: new Date().toISOString(),
    type: 'DATABASE',
    operation, // SELECT, INSERT, UPDATE, DELETE, CREATE, DROP
    table,
    ...details,
  };
  
  // IMPORTANT: Log to console so it appears in Vercel logs
  console.log(`[DATABASE] ${operation} on ${table}`, log);
  
  addLog(log);
  return log;
}

export function logError(error, context = {}) {
  const log = {
    timestamp: new Date().toISOString(),
    type: 'ERROR',
    message: error.message,
    stack: error.stack,
    ...context,
  };
  
  // IMPORTANT: Log to console so it appears in Vercel logs
  console.error(`[ERROR] ${error.message}`, log);
  
  addLog(log);
  return log;
}

function addLog(log) {
  logs.push(log);
  
  // Keep only last MAX_LOGS in memory
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }

  // Note: File writing disabled for Vercel (ephemeral filesystem)
  // All logs are available via console.log (visible in Vercel dashboard) and in-memory storage
}

export function getLogs(filter = {}) {
  let filtered = [...logs];

  if (filter.type) {
    filtered = filtered.filter(log => log.type === filter.type);
  }

  if (filter.table) {
    filtered = filtered.filter(log => log.table === filter.table);
  }

  if (filter.operation) {
    filtered = filtered.filter(log => log.operation === filter.operation);
  }

  if (filter.limit) {
    filtered = filtered.slice(-filter.limit);
  }

  return filtered;
}

export function clearLogs() {
  logs.length = 0;
  console.log('[LOGS] Cleared all in-memory logs');
}
