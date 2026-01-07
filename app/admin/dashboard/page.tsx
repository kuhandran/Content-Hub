'use client'

import { useState } from 'react'
import Header from '@/app/components/shared/Header'
import Sidebar from '@/app/components/shared/Sidebar'
import ChatPanel from '@/app/components/ChatPanel'
import LanguageModal from '@/app/components/LanguageModal'

export default function DashboardPage() {
  const [chatOpen, setChatOpen] = useState(false)
  const [languageModalOpen, setLanguageModalOpen] = useState(false)

  const handleCreateLanguage = async (languageCode: string) => {
    try {
      const response = await fetch('/api/admin/create-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languageCode }),
      })

      if (!response.ok) {
        throw new Error('Failed to create language')
      }

      // Language created successfully
      alert(`Language ${languageCode.toUpperCase()} created successfully!`)
    } catch (error) {
      console.error('Error creating language:', error)
      throw error
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Dashboard</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setLanguageModalOpen(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                + New Language
              </button>
              <button
                onClick={() => setChatOpen(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                💬 Chat
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#f9fafb' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Items</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>1,234</div>
            </div>
            <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#f9fafb' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Active Users</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>456</div>
            </div>
            <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#f9fafb' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Collections</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>89</div>
            </div>
          </div>

          <div style={{
            padding: '1.5rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            background: '#f0f9ff',
            borderLeft: '4px solid #3b82f6',
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>💡 Quick Tips</h3>
            <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
              <li>Use the Chat button to ask questions about your content</li>
              <li>Create new languages using "New Language" - automatic translation included</li>
              <li>All changes are tracked and can be synced to the system</li>
            </ul>
          </div>
        </main>
      </div>

      {/* Chat Panel */}
      <ChatPanel 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)}
        context="Content Hub Dashboard - Manage collections and languages"
      />

      {/* Language Modal */}
      <LanguageModal
        isOpen={languageModalOpen}
        onClose={() => setLanguageModalOpen(false)}
        onConfirm={handleCreateLanguage}
      />
    </div>
  )
}
