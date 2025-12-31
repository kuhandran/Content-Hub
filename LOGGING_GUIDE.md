# Logging Guide

## System Logs Directory

All application logs are stored in `/logs/` directory:

- **requests.log** - All HTTP requests and responses
- **errors.log** - All errors and exceptions
- **kv-operations.log** - Redis/Vercel KV storage operations
- **auth.log** - Authentication and login events

## Log Format

Each log entry is a JSON object with:
```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "level": "INFO|WARN|ERROR|SUCCESS|DEBUG",
  "category": "SCANNER|AUTH|KV_OPERATION|REQUEST|RESPONSE",
  "message": "Human readable message",
  "data": { "contextual": "data" },
  "pid": 12345,
  "env": "production"
}
```

## Viewing Logs

### Local Development
Logs appear in console and are saved to files in `/logs/` directory.

### On Vercel
Logs are written to `/tmp/` but for production monitoring, check:
1. **Vercel Dashboard** → **Deployments** → **Functions** → **Logs**
2. **Vercel Dashboard** → **Monitoring** → **Real-time alerts**

## Log Levels

- **ERROR** - Errors that prevent operation
- **WARN** - Warnings for unexpected situations
- **INFO** - General information about operations
- **SUCCESS** - Successful operations
- **DEBUG** - Detailed debug information (dev only)

## Common Issues to Check

### 404 Errors
```
grep "404" logs/requests.log
```
Shows all requests to non-existent endpoints.

### KV Operation Failures
```
grep "ERROR" logs/kv-operations.log
```
Shows Redis/KV storage issues.

### Authentication Failures
```
grep "FAILED" logs/auth.log
```
Shows login failures and IP issues.

### Response Errors
```
grep '"statusCode": [45][0-9][0-9]' logs/requests.log
```
Shows all 4xx and 5xx responses.

## Real-time Monitoring

### Development
```bash
# Watch all logs in real-time
tail -f logs/*.log
```

### Production (Vercel)
Check Vercel Dashboard → Deployments → Function Logs in real-time

## Log Retention

- **Local**: Logs accumulate in `/logs/` directory
- **Vercel**: Logs are available for 24-48 hours in dashboard
- **Archive**: For long-term retention, download logs from Vercel regularly

## Disable Logging (if needed)

Set `SKIP_LOGGING=true` environment variable (not recommended for production)
