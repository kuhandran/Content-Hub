# Portfolio Data API

A lightweight, static data server that serves JSON content for portfolio/resume websites. This project decouples your content from your main application, allowing you to manage and update portfolio data independently.

## Overview

**Portfolio Data API** is a simple but powerful static server that provides REST API endpoints for all your portfolio content. It's perfect for:
- Serving portfolio/resume data
- Managing professional content separately from your frontend
- Easy content updates without redeploying the main application
- CORS-enabled for cross-origin requests
- Works great with any frontend framework (React, Vue, Angular, etc.)

## Features

✅ **9 API Endpoints** - Access achievements, education, experience, projects, skills, and more
✅ **RESTful JSON API** - Simple GET endpoints for all data
✅ **CORS Enabled** - Works seamlessly with frontend applications
✅ **Static Content** - No database needed
✅ **Easy Deployment** - Deploy to Vercel or any static host
✅ **Interactive Testing UI** - Built-in Swagger-like test console
✅ **Mobile Responsive** - Works on all devices

## Live Servers

- **Development**: [http://localhost:3001](http://localhost:3001)
- **Production**: [https://portfolio-data-api.vercel.app](https://portfolio-data-api.vercel.app)

## API Endpoints

All endpoints return JSON responses. No authentication required.

### Data Endpoints

#### 1. **Achievements**
```
GET /data/achievements.json
```
Returns user achievements and accomplishments.

**Example URL:**
```
http://localhost:3001/data/achievements.json
https://portfolio-data-api.vercel.app/data/achievements.json
```

---

#### 2. **Education**
```
GET /data/education.json
```
Returns education history, degrees, and qualifications.

**Example URL:**
```
http://localhost:3001/data/education.json
https://portfolio-data-api.vercel.app/data/education.json
```

---

#### 3. **Experience**
```
GET /data/experience.json
```
Returns work experience and professional history.

**Example URL:**
```
http://localhost:3001/data/experience.json
https://portfolio-data-api.vercel.app/data/experience.json
```

---

#### 4. **Projects**
```
GET /data/projects.json
```
Returns portfolio projects and case studies.

**Example URL:**
```
http://localhost:3001/data/projects.json
https://portfolio-data-api.vercel.app/data/projects.json
```

---

#### 5. **Skills**
```
GET /data/skills.json
```
Returns technical skills and competencies.

**Example URL:**
```
http://localhost:3001/data/skills.json
https://portfolio-data-api.vercel.app/data/skills.json
```

---

#### 6. **Content Labels**
```
GET /data/contentLabels.json
```
Returns content label definitions and metadata.

**Example URL:**
```
http://localhost:3001/data/contentLabels.json
https://portfolio-data-api.vercel.app/data/contentLabels.json
```

---

### Configuration Endpoints

#### 7. **Chat Configuration**
```
GET /data/chatConfig.json
```
Returns chat bot configuration settings.

**Example URL:**
```
http://localhost:3001/data/chatConfig.json
https://portfolio-data-api.vercel.app/data/chatConfig.json
```

---

#### 8. **API Configuration**
```
GET /config/apiConfig.json
```
Returns API configuration settings.

**Example URL:**
```
http://localhost:3001/config/apiConfig.json
https://portfolio-data-api.vercel.app/config/apiConfig.json
```

---

#### 9. **Page Layout Configuration**
```
GET /config/pageLayout.json
```
Returns page layout and structure configuration.

**Example URL:**
```
http://localhost:3001/config/pageLayout.json
https://portfolio-data-api.vercel.app/config/pageLayout.json
```

---

## Testing the API

### Interactive Test Console

Visit the root URL to access the interactive API testing console:
```
http://localhost:3001
https://portfolio-data-api.vercel.app
```

The test console provides:
- All 9 API endpoints in a user-friendly interface
- One-click testing for each endpoint
- Live JSON response display
- Status indicators (success/error)
- Mobile responsive design

### Using cURL

```bash
# Test Achievements endpoint
curl http://localhost:3001/data/achievements.json

# Test Skills endpoint
curl http://localhost:3001/data/skills.json
```

### Using JavaScript/Fetch

```javascript
// Fetch achievements data
fetch('http://localhost:3001/data/achievements.json')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// Fetch skills data
fetch('https://portfolio-data-api.vercel.app/data/skills.json')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Using Axios

```javascript
import axios from 'axios';

axios.get('http://localhost:3001/data/projects.json')
  .then(response => console.log(response.data))
  .catch(error => console.error('Error:', error));
```

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/kuhandran/portfolio-data-api.git

# Navigate to project directory
cd portfolio-data-api

# Install dependencies
npm install
```

### Running Locally

```bash
# Start development server on port 3001
npm run dev

# Server will be available at http://localhost:3001
```

### Building

```bash
npm run build
```

### Starting Production Server

```bash
npm start
```

## Project Structure

```
portfolio-data-api/
├── public/
│   ├── index.html                 # Interactive API test console
│   ├── config/
│   │   ├── apiConfig.json        # API configuration
│   │   └── pageLayout.json       # Page layout configuration
│   ├── data/
│   │   ├── achievements.json     # Achievements data
│   │   ├── chatConfig.json       # Chat configuration
│   │   ├── contentLabels.json    # Content labels
│   │   ├── education.json        # Education history
│   │   ├── experience.json       # Work experience
│   │   ├── projects.json         # Portfolio projects
│   │   └── skills.json           # Technical skills
│   ├── image/                     # Images directory
│   └── resume/                    # Resume files
├── package.json
├── vercel.json                    # Vercel deployment config
├── README.md                      # This file
└── LICENSE

```

## Response Examples

### Example: Skills Endpoint Response

```json
{
  "skills": [
    {
      "category": "Frontend",
      "technologies": ["React", "Vue.js", "TypeScript"]
    },
    {
      "category": "Backend",
      "technologies": ["Node.js", "Python", "PostgreSQL"]
    }
  ]
}
```

### Example: Projects Endpoint Response

```json
{
  "projects": [
    {
      "id": 1,
      "title": "Portfolio Website",
      "description": "Personal portfolio website",
      "technologies": ["React", "TypeScript"],
      "url": "https://example.com"
    }
  ]
}
```

## Deployment

### Deploy to Vercel

```bash
# Push to GitHub
git push origin main

# Vercel will automatically deploy on push
```

Or manually:

```bash
npm install -g vercel
vercel
```

### Deploy to Other Platforms

This is a simple static Node.js server. You can deploy it to:
- Heroku
- Railway
- Render
- AWS
- Azure
- Any Node.js hosting platform

## Configuration

The server runs on **port 3001** by default.

To change the port, modify `package.json`:

```json
{
  "scripts": {
    "dev": "http-server -p 8080 public",
    "start": "http-server -p 8080 public"
  }
}
```

## API Specifications

| Endpoint | Method | Description | Status Code |
|----------|--------|-------------|------------|
| `/data/achievements.json` | GET | Achievements data | 200 |
| `/data/education.json` | GET | Education data | 200 |
| `/data/experience.json` | GET | Experience data | 200 |
| `/data/projects.json` | GET | Projects data | 200 |
| `/data/skills.json` | GET | Skills data | 200 |
| `/data/contentLabels.json` | GET | Content labels | 200 |
| `/data/chatConfig.json` | GET | Chat config | 200 |
| `/config/apiConfig.json` | GET | API config | 200 |
| `/config/pageLayout.json` | GET | Layout config | 200 |

## Dynamic Loading (No Server Restart Required)

### Challenge Solution ✅

This API implements **hot-loading** of JSON and image files without requiring server restarts or Vercel rebuilds.

### How It Works

**Dynamic File Reading**
- The server reads JSON files fresh from disk on each request
- No in-memory caching of file contents
- Updated JSON files are immediately reflected without server restart

**Smart Cache Headers**
- **JSON/Config files**: `Cache-Control: max-age=0, must-revalidate`
  - Browsers must revalidate with the server before using cached version
  - Always fetches fresh data on client side
  
- **Images**: `Cache-Control: max-age=31536000, immutable`
  - Images are cached for 1 year (images don't change often)
  - Safe to cache aggressively since filenames are unique

**Vercel Configuration**
- `.vercelignore` prevents rebuilds when public folder contents change
- Only actual code changes trigger new deployments
- Server code is deployed once, data is served dynamically

### Workflow: Adding or Updating JSON Files

```bash
# Just push your changes to the public folder
git add public/data/your-file.json
git commit -m "Update data"
git push

# ✨ No rebuild needed!
# The next request to your API will fetch the fresh data
```

### Example: Adding New Skill Category

```bash
# 1. Edit public/data/skills.json
vim public/data/skills.json

# 2. Add your new category
{
  "newCategory": {
    "name": "My New Skills",
    "icon": "🚀",
    "skills": [...]
  }
}

# 3. Commit and push
git add public/data/skills.json
git commit -m "Add new skill category"
git push

# 4. Your clients fetch fresh data on next request
# No server downtime, no rebuilds!
```

### How Clients Get Updated Data

1. Client requests `/data/skills.json`
2. Server reads the current file from disk
3. Server sends `must-revalidate` header
4. Client receives fresh data
5. No server restart required ✨

### Additional Endpoints

#### Health Check
```
GET /health
```
Returns server status and uptime.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-24T10:30:45.123Z",
  "uptime": 3600.5
}
```

#### List All Endpoints
```
GET /api
```
Returns available data, config, and image endpoints.

#### Image Endpoints
```
GET /image/profile.webp
GET /image/profile.png
GET /image/fwd-logo.webp
GET /image/fwd-logo.png
GET /image/maybank-logo.webp
GET /image/maybank-logo.png
GET /image/Project1.webp
GET /image/Project1.png
GET /image/Project2.webp
... (all other project images)
```

### Security Features

✅ **Path Traversal Protection** - Can't access files outside public folder  
✅ **File Type Validation** - Only .json files served as data, only valid image types  
✅ **CORS Enabled** - Cross-origin requests allowed for frontend apps  
✅ **Error Handling** - Graceful error responses for missing files  

### Performance Optimization Tips

1. **Client-side caching**: Implement browser caching with your framework
2. **CDN**: Deploy behind a CDN (Vercel already does this)
3. **ETag support**: Server generates ETags for efficient client caching
4. **Gzip**: Express automatically compresses responses

### Troubleshooting

**Q: My changes to JSON don't appear?**  
A: Clear browser cache (Cmd+Shift+R on Mac) or check network tab - should see 304 Not Modified responses when data hasn't changed.

**Q: Are images cached?**  
A: Yes! Images are cached for 1 year. This is fine since you're using content-addressable filenames. For updates, use new filenames.

**Q: Does each request read from disk?**  
A: Yes, by design. This ensures you always get fresh data without server restart.

**Q: Will this affect performance?**  
A: No. Disk reads are very fast, and Vercel's infrastructure is optimized for this. Results are sent within milliseconds.

## CORS

CORS is enabled by default and works seamlessly with frontend applications. All endpoints accept cross-origin requests from any origin.

## Error Handling

All API endpoints return standard HTTP status codes:

- **200** - Success
- **404** - Resource not found
- **500** - Server error

## Contributing

Feel free to submit issues and enhancement requests!

## License

ISC - See LICENSE file for details

## Repository

- **GitHub**: [https://github.com/kuhandran/portfolio-data-api](https://github.com/kuhandran/portfolio-data-api)
- **Live API**: [https://portfolio-data-api.vercel.app](https://portfolio-data-api.vercel.app)
