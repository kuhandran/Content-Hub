# Content Hub - Next.js Edition

Complete Next.js App Router rewrite of the Content Hub CMS.

## Architecture

- **Framework**: Next.js 15+ (App Router)
- **Storage**: Vercel KV (Upstash Redis)
- **Deployment**: Vercel
- **UI**: React Server Components + Client Components

## Project Structure

```
app/
├── layout.tsx              # Root layout
├── page.tsx                # Home page
├── globals.css             # Global styles
├── api/
│   └── v1/
│       ├── config/         # GET root config
│       ├── sync/           # POST manual sync
│       ├── sync-status/    # GET sync status
│       ├── pages/          # [lang]/[slug] CRUD
│       └── assets/         # images, files CRUD
└── admin/
    ├── page.tsx            # Admin dashboard
    ├── collections/        # Collections management
    ├── images/             # Images management
    ├── files/              # Files management
    └── config/             # Config editor

lib/
├── redis-client.ts         # Redis KV wrapper
└── sync-service.ts         # Sync from public/ to Redis

public/
├── config/                 # Root configuration
├── collections/            # Language-specific collections
├── data/                   # Shared data files
├── files/                  # HTML, XML, TXT files
└── image/                  # Image assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- Vercel KV account (or local Redis)
- .env.local file with KV credentials

### Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local`
3. Add Vercel KV credentials
4. Install dependencies:

```bash
npm install
```

5. Run development server:

```bash
npm run dev
```

6. Open http://localhost:3000

## Key Features

### Public API

- `GET /api/v1/config` - Root configuration
- `GET /api/v1/pages/:lang/:slug` - Get page by language and slug
- `GET /api/v1/assets/images/:file` - Get image
- `GET /api/v1/assets/files/:file` - Get file

### Admin API (Protected)

- `POST /api/v1/sync` - Trigger sync from public/
- `PUT /api/v1/pages/:lang/:slug` - Update page
- `DELETE /api/v1/pages/:lang/:slug` - Delete page
- `DELETE /api/v1/assets/images/:file` - Delete image
- `PUT /api/v1/assets/files/:file` - Update file
- `DELETE /api/v1/assets/files/:file` - Delete file

### Admin Dashboard

- Overview with sync status
- Collections management
- Images gallery
- Files editor
- Configuration management

## Data Flow

1. **Startup**: `sync-service.ts` reads `public/` folder
2. **Load**: All configs, collections, images, files loaded into Redis KV
3. **Serve**: API routes serve data from Redis
4. **Update**: Admin UI updates Redis directly
5. **Optional**: Write changes back to public/ (on demand)

## Environment Variables

```env
KV_URL=                # Redis connection URL
KV_REST_API_URL=       # REST API URL
KV_REST_API_TOKEN=     # Auth token
```

## Redis Key Patterns

- `config:root` - Root configuration
- `collection:{lang}:config:{file}` - Language config
- `collection:{lang}:pages:{slug}` - Page content
- `index:collections` - List of languages
- `index:pages:{lang}` - List of pages per language
- `assets:images:{filename}` - Image files
- `assets:files:{filename}` - Text/HTML files
- `sync:last-result` - Last sync status

## Deployment

### Vercel

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables (KV credentials)
4. Deploy

```bash
npm run build
npm run start
```

## Future Enhancements

- [ ] Authentication (NextAuth.js / Auth.js)
- [ ] Folder upload for collections
- [ ] Image upload with optimization
- [ ] Bulk operations
- [ ] Backup/restore functionality
- [ ] Audit logging
- [ ] Role-based access control
- [ ] API key management

## Notes

- No Express.js
- No custom Node server
- No database other than Redis KV
- Server-side file operations only
- Full TypeScript support
- Production-ready code

## License

MIT
