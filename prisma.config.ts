// Prisma configuration for v5.22.0+
// Connection URL is loaded from DATABASE_URL environment variable
// This file is referenced by prisma CLI commands

export const datasourceConfig = {
  provider: 'postgresql',
  url: process.env.DATABASE_URL,
}

