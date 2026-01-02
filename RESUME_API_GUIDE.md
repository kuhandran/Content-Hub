# Resume Download API - Configuration Guide

## Problem
You were getting a 404 error when trying to access:
```
https://static-api-opal.vercel.app/api/resume/resume.pdf
```

## Solution

### 1. **API Configuration Updates** ✅

#### urlConfig.json
Added resume URLs to the centralized URL configuration:
```json
{
  "fullUrls": {
    "resumePdf": "https://static-api-opal.vercel.app/api/resume/resume.pdf",
    "resumeDownload": "https://static-api-opal.vercel.app/api/resume/resume.pdf"
  }
}
```

#### contentLabels.json
Added URLs section and updated CTA section:
```json
{
  "urls": {
    "resume": {
      "download": "https://static-api-opal.vercel.app/api/resume/resume.pdf",
      "view": "https://static-api-opal.vercel.app/api/resume/resume.pdf"
    },
    "social": {
      "linkedin": "https://linkedin.com/in/kuhandran-samudrapandiyan",
      "email": "mailto:skuhandran@yahoo.com"
    }
  },
  "about": {
    "cta": {
      "resume": "Download Resume",
      "resumeUrl": "https://static-api-opal.vercel.app/api/resume/resume.pdf",
      "linkedin": "View LinkedIn",
      "linkedinUrl": "https://linkedin.com/in/kuhandran-samudrapandiyan"
    }
  }
}
```

### 2. **How to Use in Frontend**

#### Option A: Using urlConfig.json
```typescript
import { getUrl, getUrlSync } from '@/lib/config/appConfig';

// For download button
const downloadResumeUrl = await getUrl('fullUrls.resumeDownload');

// Or using sync version (after initialization)
const downloadResumeUrl = getUrlSync('fullUrls.resumeDownload');

<a href={downloadResumeUrl} download="Kuhandran_Resume.pdf">
  Download Resume
</a>
```

#### Option B: Using contentLabels.json
```typescript
// Load content labels
const labels = await fetch('/api/collections/en/data/contentLabels.json')
  .then(res => res.json());

// For download button
<a href={labels.urls.resume.download} download="Kuhandran_Resume.pdf">
  {labels.about.cta.resume}
</a>

// For view button
<a href={labels.urls.resume.view} target="_blank">
  View Resume
</a>
```

#### Complete Button Component Example
```typescript
'use client';

import { useEffect, useState } from 'react';

export function ResumeButtons() {
  const [urls, setUrls] = useState<any>(null);
  const [labels, setLabels] = useState<any>(null);

  useEffect(() => {
    // Load configuration
    Promise.all([
      fetch('/config/urlConfig.json').then(r => r.json()),
      fetch('/api/collections/en/data/contentLabels.json').then(r => r.json())
    ]).then(([urlConfig, contentLabels]) => {
      setUrls(urlConfig.fullUrls);
      setLabels(contentLabels);
    });
  }, []);

  if (!urls || !labels) return <div>Loading...</div>;

  return (
    <div className="flex gap-4">
      {/* Download Button */}
      <a
        href={urls.resumeDownload}
        download="Kuhandran_Resume.pdf"
        className="btn btn-primary"
        aria-label="Download resume as PDF"
      >
        {labels.about.cta.resume}
      </a>

      {/* View Button */}
      <a
        href={urls.resumePdf}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary"
        aria-label="View resume in new tab"
      >
        View Resume
      </a>

      {/* LinkedIn Button */}
      <a
        href={urls.linkedinProfile}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-outline"
        aria-label="View LinkedIn profile"
      >
        {labels.about.cta.linkedin}
      </a>
    </div>
  );
}
```

### 3. **Seed Resume File to Redis**

The resume file must be seeded to Redis before it can be accessed via the API.

#### Via Dashboard (Recommended)
1. Go to: `https://static-api-opal.vercel.app/dashboard`
2. Login with your credentials
3. Click on "Resume" in the sidebar
4. Upload `resume.pdf` file
5. The file will be automatically stored in Redis

#### Via Admin Seed API
```bash
curl -X POST https://static-api-opal.vercel.app/api/admin/seed \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

#### Verify Resume is Seeded
```bash
# Check if resume is available
curl https://static-api-opal.vercel.app/api/resume/resume.pdf

# Or list all resume files
curl https://static-api-opal.vercel.app/api/files/list/resume
```

### 4. **API Endpoint Details**

#### Resume Read Endpoint
- **URL**: `/api/resume/:filename`
- **Method**: `GET`
- **Example**: `/api/resume/resume.pdf`
- **Response**: Binary PDF content
- **Content-Type**: `application/pdf`
- **Storage**: Redis (key: `cms:resume:resume.pdf`)

#### How it Works
1. Request: `GET /api/resume/resume.pdf`
2. API checks Redis for key: `cms:resume:resume.pdf`
3. If found: Returns base64-decoded PDF binary
4. If not found: Returns 404 error

### 5. **Troubleshooting**

#### 404 Error - File Not Found
```
Error: File not found, path: resume.pdf
```
**Solution**: The resume file is not seeded in Redis
- Upload via dashboard: `/dashboard` → Resume section
- Or run seed script to populate Redis

#### CORS Error
```
Access to fetch has been blocked by CORS policy
```
**Solution**: Already fixed! All routes now have CORS middleware that allows:
- `https://www.kuhandranchatbot.info`
- All other configured origins

#### Redis Connection Error
```
Error: Redis not connected
```
**Solution**: Check environment variables
- `REDIS_URL` must be set in Vercel environment variables
- Restart the deployment after setting

### 6. **For All Locales**

Update resume URLs in all locale files:
```bash
# Update for each locale
public/collections/ar-AE/data/contentLabels.json
public/collections/de/data/contentLabels.json
public/collections/es/data/contentLabels.json
public/collections/fr/data/contentLabels.json
# ... etc
```

Each should have the same URLs structure:
```json
{
  "urls": {
    "resume": {
      "download": "https://static-api-opal.vercel.app/api/resume/resume.pdf",
      "view": "https://static-api-opal.vercel.app/api/resume/resume.pdf"
    }
  }
}
```

### 7. **Next Steps**

1. ✅ Configuration updated
2. ⏳ **Upload resume.pdf via dashboard**
3. ⏳ **Update frontend components to use correct URLs**
4. ⏳ **Test download and view buttons**
5. ⏳ **Deploy changes to production**

### 8. **Quick Test After Deployment**

```bash
# Test resume download
curl -I https://static-api-opal.vercel.app/api/resume/resume.pdf

# Should return:
# HTTP/2 200
# content-type: application/pdf
# access-control-allow-origin: https://www.kuhandranchatbot.info
```

## Summary

✅ **Fixed**:
- Added resume URLs to `urlConfig.json`
- Added URLs section to `contentLabels.json`
- Updated about CTA with resume URLs
- CORS headers already configured

⏳ **Todo**:
- Upload resume.pdf to Redis via dashboard
- Update frontend components to use the correct API endpoints
- Test both download and view functionality
