# Public API v1 Documentation

## Overview
Public API endpoints for all client applications and integrations.

## Base URL
```
/api/v1
```

## Endpoints

### Authentication
- **POST** `/auth/login` - User login
- **POST** `/auth/verify` - Verify authentication token

### Chat
- **GET** `/chat/sessions` - Get user chat sessions
- **POST** `/chat/sessions` - Create new session
- **GET** `/chat/history?sessionId={id}` - Get chat history
- **POST** `/chat/preferences` - Save user preferences
- **GET** `/chat/preferences` - Get user preferences

### Pages
- **GET** `/pages/{lang}` - List pages for language
- **GET** `/pages/{lang}/{slug}` - Get specific page content

### Configuration
- **GET** `/config` - Get system configuration
- **GET** `/redis-stats` - Get Redis statistics
- **GET** `/sync-status` - Get sync status

### Assets
- **GET** `/assets/images/{file}` - Serve image files
- **GET** `/assets/files/{file}` - Serve document files

### External Integration
- **POST** `/external` - Proxy external content requests

---

## Authentication
Most endpoints require authentication via:
- Bearer token in Authorization header
- User session validation

---

## Response Format
All responses follow standard JSON format:
```json
{
  "status": "success|error",
  "data": { },
  "error": "error message if applicable"
}
```

---

Last Updated: January 7, 2026
