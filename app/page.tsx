'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('adminToken')
    if (token) {
      router.push('/admin/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <main className="container">
      <div className="hero">
        <h1>Content Hub</h1>
        <p>Multi-language Content Management System</p>
        <div className="buttons">
          <Link href="/login">Admin Login</Link>
          <Link href="/api/v1/config">API Config</Link>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        .hero {
          text-align: center;
          padding: 4rem 0;
        }
        .hero h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .hero p {
          font-size: 1.2rem;
          color: #666;
          margin-bottom: 2rem;
        }
        .buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .buttons a {
          padding: 0.75rem 1.5rem;
          background: #0070f3;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
          transition: background 0.3s;
        }
        .buttons a:hover {
          background: #0051cc;
        }
      `}</style>
    </main>
  )
}
