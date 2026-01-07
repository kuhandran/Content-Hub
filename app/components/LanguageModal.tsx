'use client'

import { useState, useEffect } from 'react'

export interface ChecklistItem {
  id: string
  name: string
  status: 'pending' | 'checking' | 'done' | 'error'
  message: string
}

interface LanguageModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (languageCode: string) => Promise<void>
}

export default function LanguageModal({ isOpen, onClose, onConfirm }: LanguageModalProps) {
  const [step, setStep] = useState<'select' | 'checklist' | 'processing'>('select')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(false)

  const languages = [
    { code: 'es', name: 'Spanish - Español' },
    { code: 'fr', name: 'French - Français' },
    { code: 'de', name: 'German - Deutsch' },
    { code: 'hi', name: 'Hindi - हिन्दी' },
    { code: 'ar', name: 'Arabic - العربية' },
    { code: 'pt', name: 'Portuguese - Português' },
    { code: 'id', name: 'Indonesian - Bahasa Indonesia' },
    { code: 'th', name: 'Thai - ไทย' },
    { code: 'ta', name: 'Tamil - தமிழ்' },
  ]

  const handleSelectLanguage = async (code: string) => {
    setSelectedLanguage(code)
    setLoading(true)
    setStep('checklist')

    try {
      const response = await fetch(`/api/admin/language-check?lang=${code}`)
      const data = await response.json()
      setChecklist(data.checklist)
    } catch (error) {
      console.error('Error fetching checklist:', error)
      setChecklist([{
        id: 'error',
        name: 'Error',
        status: 'error',
        message: 'Failed to load checklist',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setStep('processing')
    setLoading(true)

    try {
      await onConfirm(selectedLanguage)
      // Close after success
      setTimeout(() => {
        setStep('select')
        setSelectedLanguage('')
        setChecklist([])
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error creating language:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, color: '#1f2937' }}>Create New Language</h2>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: '#6b7280',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {step === 'select' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: '#6b7280', margin: '0 0 1rem 0' }}>
                Select a language to create. We'll check existing files and translate content based on English.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    disabled={loading}
                    style={{
                      padding: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#f9fafb',
                      color: '#1f2937',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'checklist' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>
                Setup Checklist for {selectedLanguage.toUpperCase()}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {checklist.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 
                        item.status === 'error' ? '#fee' :
                        item.status === 'done' ? '#efe' :
                        '#f9fafb',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                    }}>
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>
                        {item.name}
                      </span>
                      <span style={{
                        fontSize: '0.875rem',
                        color:
                          item.status === 'error' ? '#dc2626' :
                          item.status === 'done' ? '#16a34a' :
                          '#6b7280',
                      }}>
                        {item.status === 'checking' && '⏳'}
                        {item.status === 'done' && '✓'}
                        {item.status === 'error' && '✕'}
                        {item.status === 'pending' && '○'}
                      </span>
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: '#6b7280',
                    }}>
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>

              {!checklist.some(i => i.status === 'error') && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{
                    margin: '0 0 1rem 0',
                    color: '#059669',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}>
                    ✓ All checks passed! Ready to create language files.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'processing' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              minHeight: '300px',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid #e5e7eb',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem',
              }} />
              <p style={{ color: '#6b7280', textAlign: 'center' }}>
                Creating language files and translating content...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'processing' && (
          <div style={{
            padding: '1rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#1f2937',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: loading ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            {step === 'checklist' && !checklist.some(i => i.status === 'error') && (
              <button
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Confirm & Create
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
