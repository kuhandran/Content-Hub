# CORS Configuration Updates

## Summary of Changes

Fixed CORS (Cross-Origin Resource Sharing) issues preventing localhost development from accessing the API. The server was only allowing requests from `https://www.kuhandranchatbot.info`, but development occurs on `http://localhost:3000`.

## Files Modified

### 1. **[middleware.js](middleware.js)** (Global CORS handler)
- Updated to dynamically validate request origins
- Added support for:
  - `http://localhost:3000` (main dev)
  - `http://localhost:3001` (alternative)
  - `http://127.0.0.1:3000` & `3001`
  - `https://static.kuhandranchatbot.info`
  - `https://www.kuhandranchatbot.info` (production)

### 2. **[lib/cors.js](lib/cors.js)** (New utility file)
- Created centralized CORS handling functions
- `getAllowedOrigin()` - validates and returns allowed origins
- `getCorsHeaders()` - returns properly formatted CORS headers
- `handleCorsPrelight()` - handles OPTIONS requests

### 3. **API Route Files Updated**
Updated to use the new `getCorsHeaders()` utility:
- [app/api/data/route.js](app/api/data/route.js)
- [app/api/data/[file]/route.js](app/api/data/[file]/route.js)
- [app/api/collections/route.js](app/api/collections/route.js)

These were the main endpoints causing the error you reported.

## How It Works

1. **Global Middleware** - The middleware intercepts all API requests and checks the request's origin
2. **Dynamic Origin Validation** - If the origin is in the allowed list, it's used in the CORS header; otherwise defaults to production origin
3. **Consistent Headers** - All responses now use `getCorsHeaders()` for consistent CORS configuration

## Testing

Test the fix locally:
```bash
# Local development should now work
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS http://localhost:3000/api/collections
```

The response should include:
```
Access-Control-Allow-Origin: http://localhost:3000
```

## Next Steps

To complete the CORS fix across all API endpoints:
1. Update remaining API route files to import and use `getCorsHeaders()`
2. Consider updating [vercel.json](vercel.json) if deploying to production (currently has hardcoded origin)

## Production Note

The production domain `https://www.kuhandranchatbot.info` will continue to work as the default fallback for unknown origins.
