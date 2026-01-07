# Shared Components

## Overview
Reusable React components used across the admin dashboard and pages.

## Components

### Header.tsx
**Purpose:** Navigation header displayed on all admin pages

**Props:** None (uses usePathname internally)

**Features:**
- Displays "Content Hub" branding
- Navigation links to home
- Light background (#ffffff)
- Border separator at bottom
- All styling via inline `style` prop

**Layout:**
```
┌─────────────────────────────────────┐
│  Content Hub          Home           │
└─────────────────────────────────────┘
```

---

### Sidebar.tsx
**Purpose:** Left navigation sidebar for admin dashboard

**Props:** None (uses usePathname internally)

**Features:**
- Navigation links to admin sections
- Active link highlighting
- Responsive design
- All styling via inline `style` prop

**Navigation Items:**
- Dashboard
- Chat
- Users
- Collections
- Settings

**Active State:**
- Blue text (#2563eb)
- Light blue background (#eff6ff)

**Inactive State:**
- Gray text (#374151)
- Transparent background

---

## Styling Approach

All components use **inline `style` props only**:
- No Tailwind CSS classes
- No external CSS files
- All styles defined as JavaScript objects
- Responsive layouts via CSS Grid/Flexbox

Example:
```tsx
<div style={{
  padding: '1.5rem',
  backgroundColor: '#f5f5f5',
  borderRadius: '8px'
}}>
  Content
</div>
```

---

## File Structure
```
components/
└── shared/
    ├── Header.tsx
    ├── Sidebar.tsx
    └── README.md
```

---

Last Updated: January 7, 2026
