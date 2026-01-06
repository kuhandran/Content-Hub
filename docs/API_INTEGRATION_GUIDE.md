# Content Hub - External API Integration Guide

## Overview
This guide explains how to integrate your external content API with the Content Hub admin panel.

## External API Endpoint
Your content is now available at:
```
https://static-api-opal.vercel.app/api/collections/{language}/data/{contentType}.json
```

### Example URLs
- Projects: `https://static-api-opal.vercel.app/api/collections/en/data/projects.json`
- Skills: `https://static-api-opal.vercel.app/api/collections/en/data/skills.json`
- Experience: `https://static-api-opal.vercel.app/api/collections/en/data/experience.json`
- Education: `https://static-api-opal.vercel.app/api/collections/en/data/education.json`

## Supported Languages
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `hi` - Hindi
- `ta` - Tamil
- `ar-AE` - Arabic (UAE)
- `my` - Myanmar
- `id` - Indonesian
- `si` - Sinhala
- `th` - Thai

## Content Types
Available data files in each language collection:

### Config Files
- `apiConfig.json` - API configuration
- `pageLayout.json` - Page layout settings
- `urlConfig.json` - URL configuration

### Data Files
- `projects.json` - Portfolio projects
- `skills.json` - Technical skills
- `experience.json` - Work experience
- `education.json` - Education details
- `achievements.json` - Achievements and certifications
- `caseStudies.json` - Case studies
- `caseStudiesTranslations.json` - Case study translations
- `chatConfig.json` - Chat configuration
- `contentLabels.json` - Content labels
- `defaultContentLabels.json` - Default labels
- `errorMessages.json` - Error messages

## API Response Format

### Example Projects Response
```json
{
  "id": "project-1",
  "title": "E-Commerce Platform",
  "description": "Full-stack e-commerce solution",
  "technologies": ["React", "Node.js", "MongoDB"],
  "link": "https://example.com",
  "image": "project-1.jpg"
}
```

### Example Skills Response
```json
{
  "id": "skill-1",
  "name": "React",
  "category": "Frontend",
  "proficiency": "Expert",
  "years": 5
}
```

## Integration Steps

### 1. Fetch Collections List
```javascript
// Get all available languages
const response = await fetch('/api/v1/config');
const config = await response.json();
const languages = config.languages;
```

### 2. Fetch Language Data
```javascript
// Get all data for a specific language
const response = await fetch(`/api/v1/pages/en`);
const data = await response.json();
console.log(data.configs.items); // Config files
console.log(data.data.items);    // Data files
```

### 3. Fetch Specific Content
```javascript
// Get a specific content file
const response = await fetch(
  'https://static-api-opal.vercel.app/api/collections/en/data/projects.json'
);
const projects = await response.json();
```

## React Hook Example

```typescript
import { useEffect, useState } from 'react';

export function useContent(language: string, contentType: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://static-api-opal.vercel.app/api/collections/${language}/data/${contentType}.json`
        );
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [language, contentType]);

  return { data, loading, error };
}
```

## Next.js Server Action Example

```typescript
// lib/content.ts
import { cache } from 'react';

export const getContent = cache(async (language: string, contentType: string) => {
  const response = await fetch(
    `https://static-api-opal.vercel.app/api/collections/${language}/data/${contentType}.json`,
    { next: { revalidate: 3600 } } // Cache for 1 hour
  );
  
  if (!response.ok) throw new Error('Failed to fetch content');
  return response.json();
});
```

## Admin Panel Integration

### Collections Hub Page
**Location**: `/admin/collections`

Shows all available language collections with:
- Language flags and names
- Config file count
- Data file count
- Quick access to edit each collection

### Dashboard
**Location**: `/admin/dashboard`

Provides:
- Sync status monitoring
- Content statistics
- Quick links to manage content
- Error tracking

## Content Synchronization

The Content Hub automatically syncs content to Redis for performance:

1. **Auto-Sync on Startup**: Happens when the application starts
2. **Manual Sync**: Click "Sync Now" in the dashboard or sync manager
3. **Scheduled Sync**: Can be configured via environment variables

### Sync Process
1. Flush existing Redis cache
2. Load root configuration (languages.json)
3. Load all language collections
4. Load image metadata
5. Load additional files
6. Generate sync report

## Environment Variables

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# External Content API
EXTERNAL_API_URL=https://static-api-opal.vercel.app
```

## Error Handling

### Common Errors

1. **404 - Content Not Found**
   - Check language code is correct
   - Verify content type exists in collection
   - Ensure file is properly synced

2. **Network Error**
   - Check internet connection
   - Verify external API is accessible
   - Check firewall/proxy settings

3. **Redis Connection Error**
   - Verify Redis server is running
   - Check REDIS_URL configuration
   - Ensure proper network connectivity

## Performance Considerations

### Caching Strategy
- Redis caches all synced content
- HTTP responses are cached with appropriate headers
- Client-side caching uses Next.js cache()

### Optimization Tips
1. Sync during off-peak hours
2. Use language-specific endpoints instead of loading all languages
3. Implement client-side pagination for large datasets
4. Cache API responses on the client

## Monitoring & Logging

### Sync Logs
Access detailed sync logs in the Sync Manager:
- `/admin/sync` - View real-time sync progress and logs

### Redis Monitoring
Monitor Redis usage in the admin panel:
- Memory usage percentage
- Available space
- Item counts

### Error Tracking
- All sync errors are logged
- Errors appear in dashboard error section
- Check application logs for detailed errors

## Best Practices

1. **Always check content availability before rendering**
   ```typescript
   const { data, loading, error } = useContent('en', 'projects');
   if (loading) return <Loading />;
   if (error) return <Error message={error} />;
   return <ProjectList projects={data} />;
   ```

2. **Handle missing languages gracefully**
   ```typescript
   const language = supportedLanguages.includes(userLang) 
     ? userLang 
     : 'en';
   ```

3. **Implement fallback content**
   ```typescript
   const content = data || defaultContent;
   ```

4. **Use appropriate cache headers**
   ```typescript
   // For static content - long cache
   { next: { revalidate: 86400 } } // 24 hours
   
   // For dynamic content - short cache
   { next: { revalidate: 300 } } // 5 minutes
   ```

## Troubleshooting

### Content Not Showing
1. Check network tab in DevTools
2. Verify URL is correct
3. Check CORS headers if cross-origin
4. Ensure content is synced in Redis

### Sync Fails
1. Check Redis connection
2. Verify external API is accessible
3. Check available disk space
4. Review sync logs in admin panel

### Performance Issues
1. Monitor Redis memory usage
2. Check network latency
3. Implement pagination for large datasets
4. Use CDN for static assets

## API Limits

- No rate limiting on the external API
- Redis has 30GB storage limit
- Memory management is automatic with LRU eviction

## Future Enhancements

- [ ] Scheduled sync with cron jobs
- [ ] Webhook support for automatic sync on content changes
- [ ] Content versioning and rollback
- [ ] A/B testing support
- [ ] Multi-region content delivery
- [ ] Content analytics and tracking

---

**Last Updated**: January 6, 2026
**API Version**: 1.0
**Status**: Production Ready
