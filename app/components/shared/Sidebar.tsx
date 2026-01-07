'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  const links = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/chat', label: 'Chat' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/collections', label: 'Collections' },
    { href: '/admin/settings', label: 'Settings' },
  ]

  return (
    <aside style={{ borderRight: '1px solid #e5e7eb', padding: '1.5rem', width: '220px', minHeight: '100vh', background: '#f9fafb' }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              padding: '0.75rem 1rem',
              textDecoration: 'none',
              color: pathname === link.href ? '#2563eb' : '#374151',
              backgroundColor: pathname === link.href ? '#eff6ff' : 'transparent',
              borderRadius: '0.375rem',
              fontWeight: pathname === link.href ? '600' : '500',
              fontSize: '0.9375rem',
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
