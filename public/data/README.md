# Public Data Directory

This directory contains JSON data files that are statically served to the application. All content is JSON-driven with no hardcoded data in TypeScript files.

## 📋 Files

### Core Data Files

#### `projects.json`
**Purpose**: Portfolio projects with descriptions, technologies, and case study links.

**Structure**:
- `title` - Project name
- `description` - Project overview
- `image` - Project image URL (absolute CDN URL)
- `techStack[]` - Technologies used
- `metrics` - Key achievement or metric
- `liveUrl` / `githubUrl` - External links
- `caseStudySlug` - Link to detailed case study

**Usage**: Loaded via `useProjects()` hook in `src/components/sections/Projects.tsx`

**Size**: ~5 KB | **Projects**: 6 entries

---

#### `experience.json`
**Purpose**: Professional work experience and career timeline.

**Structure**:
- `title` - Job title
- `company` - Company name
- `duration` - Employment period
- `location` - Work location
- `description[]` - Bullet-point achievements
- `techStack[]` - Technologies/tools used
- `logo` - Company logo URL (absolute CDN URL)

**Usage**: Loaded via `useExperience()` hook in `src/components/sections/Experience.tsx`

**Size**: ~4 KB | **Entries**: 5 positions

---

#### `skills.json`
**Purpose**: Technical skills organized by category with proficiency levels.

**Usage**: Loaded via `useSkills()` hook in `src/components/sections/Skills.tsx`

**Size**: ~3 KB | **Categories**: 4 | **Total Skills**: 20+

---

#### `education.json`
**Purpose**: Educational background and qualifications.

**Structure**:
- `degree` - Degree/qualification name
- `institution` - School/university name
- `duration` - Attendance period
- `location` - School location
- `focus` - Field of study or specialization

**Usage**: Loaded via `useEducation()` hook in `src/components/sections/Education.tsx`

**Size**: ~2 KB | **Entries**: 4 institutions

---

#### `achievements.json`
**Purpose**: Awards, recognitions, and professional certifications.

**Usage**: Loaded via `fetchAchievementsData()` in `src/lib/data/achievements.ts`

**Size**: ~2 KB | **Awards**: 3 | **Certifications**: 4

---

#### `contentLabels.json`
**Purpose**: UI text labels and user-facing strings (fallback and defaults).

**Structure**:
- `navbar` - Navigation labels
- `hero` - Hero section text
- `about` - About section text
- `skills`, `experience`, `projects`, etc. - Section-specific labels
- `chatbot` - Chatbot UI text
- `contact` - Contact form labels

**Usage**: Fallback labels when CDN content labels fail to load

**Size**: ~2 KB | **Labels**: 40+ UI strings

---

#### `errorMessages.json`
**Purpose**: Centralized error, warning, and informational messages.

**Categories**:
- `errors.common` - General application errors
- `errors.network` - Network/HTTP related errors
- `errors.validation` - Form validation messages
- `errors.data` - Data loading errors
- `errors.chatbot` - Chatbot service errors
- `warnings.*` - Non-critical warnings

**Usage**: Accessed via `getErrorMessageSync()` from `src/lib/config/appConfig.ts`

**Size**: ~2 KB | **Messages**: 45+

---

## 🚀 Data Loading Strategy

### Lazy Loading Pattern (Recommended)

Each data section uses **lazy loading**: data is fetched only when the component renders, not at app startup.

```typescript
// In components
import { useProjects } from '@/lib/data/projects';

export function Projects() {
  const { projects, loading, error } = useProjects();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading projects</div>;
  
  return <div>{/* Render projects */}</div>;
}
```

**Benefits**:
- ✅ Faster initial page load (no waiting for all data)
- ✅ Better UX with loading states
- ✅ Graceful error handling per component
- ✅ Data loads only when needed
- ✅ Optimal for mobile connections

### Environment-Aware Loading

Data URLs are determined automatically based on the environment:

**Development Mode** (`npm run dev`):
```
localhost:3000/data/projects.json
→ Fetches from local /public/data/ folder
```

**Production Mode** (`npm run start`):
```
If localhost:3000 → Fetches from /data/ (local testing)
If kuhandranchatbot.info → Fetches from CDN:
  https://static.kuhandranchatbot.info/data/projects.json
```

**Configuration**: `src/lib/config/dataConfig.ts`

```typescript
export function getDataSourceUrl(filename: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  const isLocalhost = window.location.hostname === 'localhost';
  
  if (isDev || isLocalhost) {
    return `/data/${filename}`;
  }
  
  return `https://static.kuhandranchatbot.info/data/${filename}`;
}
```

### Image URLs (Absolute CDN)

All image paths in JSON are **absolute CDN URLs**:

```json
{
  "image": "https://static.kuhandranchatbot.info/image/Project1.png",
  "logo": "https://static.kuhandranchatbot.info/image/fwd-logo.png"
}
```

**Why**:
- ✅ Works in both dev and production
- ✅ No relative path issues
- ✅ Images always load from CDN (fast, cached, optimized)
- ✅ No 404 errors in development

### Caching Strategy

Each data loader implements caching to avoid redundant fetches:

```typescript
let cachedData: ProjectCardProps[] | null = null;

export const useProjects = () => {
  // Returns cached data if already fetched
  // Fetches fresh data on first component mount
  // Subsequent components reuse cached data
};
```

### Fallback/Empty Data

Each module includes fallback data for reliability:

```typescript
const EMPTY_PROJECTS: ProjectCardProps[] = [];

const fetchProjects = async () => {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) return EMPTY_PROJECTS;
    return await response.json();
  } catch (error) {
    console.error('[Data Loader] Error fetching projects:', error);
    return EMPTY_PROJECTS;  // Always return something
  }
};
```

**Ensures**:
- ✅ App never crashes due to missing data
- ✅ Graceful degradation if CDN is down
- ✅ Users see loading states, then content or empty placeholders

---

## 📊 Data Hook Reference

All data is accessed via React hooks from components:

| Hook | Module | Returns |
|------|--------|---------|
| `useProjects()` | `src/lib/data/projects.ts` | `{ projects, loading, error }` |
| `useExperience()` | `src/lib/data/experience.ts` | `{ experience, loading, error }` |
| `useSkills()` | `src/lib/data/skills.ts` | `{ skills, loading, error }` |
| `useEducation()` | `src/lib/data/education.ts` | `{ education, loading, error }` |
| `useContentLabels()` | `src/lib/data/contentLabels.ts` | `{ labels, loading }` |
| `fetchAchievementsData()` | `src/lib/data/achievements.ts` | Promise resolving to achievements |

---

## 🔄 Optional: Preload Data

For better performance, optionally preload data in the background:

```typescript
import { preloadData } from '@/lib/data';

// In your app initialization
await preloadData(['projects.json', 'experience.json', 'skills.json']);
```

This fetches data early without blocking the initial render. Components still show loading states but data may already be cached.

---

## 🛠️ Sync JSON Files Locally

To download the latest production data to your local `/data/` folder:

```bash
npm run sync-json
```

This downloads all JSON files from the CDN:
- `projects.json`, `experience.json`, `skills.json`, `education.json`, `achievements.json`, `contentLabels.json`

---

## 🌐 Static Asset Paths

### Development (`npm run dev`)
- Port: 3000
- URL: `http://localhost:3000/data/projects.json`
- Source: `/public/data/` folder

### Production (Deployed to `kuhandranchatbot.info`)
- URL: `https://static.kuhandranchatbot.info/data/projects.json`
- Source: AWS S3 (CDN-fronted)

### Production (Local Testing: `npm run start`)
- Port: 3000
- URL: `http://localhost:3000/data/projects.json`
- Source: `/public/data/` folder (auto-detected via localhost check)

---

## 📚 Related Documentation

- **Data Modules**: See `src/lib/data/README.md` for technical implementation
- **Configuration**: See `src/lib/config/dataConfig.ts` for environment detection
- **Scripts**: See `scripts/README.md` for sync-json utility

---

## 🎯 Architecture Summary

**Component → Hook → DataConfig → JSON File**

```
React Component (Projects.tsx)
    ↓
useProjects() Hook (Lazy loading)
    ↓
getDataSourceUrl() (Environment detection)
    ↓
/data/projects.json (Local) 
OR https://static.../data/projects.json (CDN)
```

**Key Features**:
- ✅ **No Hardcoded Data** - All content in JSON files
- ✅ **No Environment Checks** - Centralized in `dataConfig.ts`
- ✅ **Lazy Loading** - Data fetches per-component
- ✅ **Caching** - Subsequent components reuse cached data
- ✅ **Fallbacks** - Always returns empty data, never crashes
- ✅ **Loading States** - Components show loading/error UI
- ✅ **CDN Images** - Absolute URLs for images
