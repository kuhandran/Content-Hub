# Admin Dashboard Pages

## Overview
Admin dashboard pages for managing system content and settings.

## Pages

### Dashboard (/admin/dashboard)
**Purpose:** Main dashboard with key performance indicators

**Features:**
- Total items count
- Active users count
- Collections count
- Responsive grid layout
- Light theme with inline styles

**Components Used:**
- Header
- Sidebar
- KPI cards

---

### Chat (/admin/chat)
**Purpose:** Chat history and session management

**Features:**
- View chat sessions
- Search and filter conversations
- User activity tracking

---

### Users (/admin/users)
**Purpose:** User management and administration

**Features:**
- List all users
- View user details
- Manage permissions
- User activity logs

---

### Collections (/admin/collections)
**Purpose:** Manage content collections

**Features:**
- Browse collection structure
- Upload new content
- Edit existing content
- Delete content
- Language management

---

### Settings (/admin/settings)
**Purpose:** System configuration and preferences

**Features:**
- General settings (site name, description)
- Theme preferences
- Language selection
- Feature toggles (notifications, Redis)
- Upload size limits
- Database connection info

---

## Layout Structure

All admin pages follow this structure:

```
┌─────────────────────────────────────┐
│            Header                   │
├─────────────────────────────────────┤
│           │                         │
│ Sidebar   │   Main Content Area    │
│           │                         │
│  (220px)  │   (responsive width)   │
│           │                         │
└─────────────────────────────────────┘
```

---

## Styling Guidelines

- **Background:** Light (#ffffff, #f9fafb)
- **Text:** Dark gray (#1f2937, #374151)
- **Borders:** Light gray (#e5e7eb)
- **Active states:** Blue (#2563eb)
- **All styles:** Inline `style` props

---

Last Updated: January 7, 2026
