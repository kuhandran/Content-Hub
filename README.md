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

## CORS

CORS is disabled by default. To enable CORS, modify `package.json`:

```json
{
  "scripts": {
    "dev": "http-server -p 3001 --cors public"
  }
}
```

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
