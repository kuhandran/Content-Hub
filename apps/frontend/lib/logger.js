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
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
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

  // Try to write to file (best effort)
  try {
    const logPath = getLogPath();
    fs.appendFileSync(logPath, JSON.stringify(log) + '\n');
  } catch (error) {
    // Silently fail - logging infrastructure shouldn't break the app
    console.error('Failed to write log to file:', error.message);
  }
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
