'use client'

import { useState } from 'react'
import Header from '@/app/components/shared/Header'

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [selectedItemId, setSelectedItemId] = useState<string>('1')

  const items = [
    { id: '1', title: 'Getting Started', description: 'Learn the basics' },
    { id: '2', title: 'Advanced Topics', description: 'Deep dive content' },
    { id: '3', title: 'Best Practices', description: 'Production tips' },
  ]

  const selectedItem = items.find(i => i.id === selectedItemId) || items[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#333' }}>
          Web Development Collection
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
          {/* Sidebar */}
          <div style={{ backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Items</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: selectedItemId === item.id ? '#3b82f6' : '#e5e7eb',
                    color: selectedItemId === item.id ? '#fff' : '#333',
                  }}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div style={{ backgroundColor: '#f5f5f5', padding: '2rem', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              {selectedItem.title}
            </h2>
            <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              {selectedItem.description}
            </p>
            <p style={{ color: '#555', lineHeight: '1.8' }}>
              This is detailed content about {selectedItem.title.toLowerCase()}. Learn and explore more about this topic.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
