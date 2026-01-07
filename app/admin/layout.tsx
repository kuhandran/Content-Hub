import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Content Hub',
  description: 'Admin dashboard for managing content and languages',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
