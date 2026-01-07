'use client'

import { useState, useEffect, useRef } from 'react'
import ChatMessageComponent from '@/app/components/chat/ChatMessage'
import ChatInput from '@/app/components/chat/ChatInput'
import Header from '@/app/components/shared/Header'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoadingResponse, setIsLoadingResponse] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [sessionId] = useState(() => {
    // In production, this would come from user session/auth
    return `session_${Date.now()}`
  })

  useEffect(() => {
    const loadMessages = async () => {
      try {
        // In production, fetch actual messages from API
        // const response = await fetch(`/api/chat/messages?sessionId=${sessionId}`)
        // const data = await response.json()
        // setMessages(data)

        // Mock initial message
        setMessages([
          {
            id: '1',
            content: 'Hello! How can I help you today?',
            role: 'assistant',
            createdAt: new Date().toLocaleTimeString(),
          },
        ])
      } catch (error) {
        console.error('Failed to load messages:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      content,
      role: 'user',
      createdAt: new Date().toLocaleTimeString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoadingResponse(true)

    try {
      // In production, call actual API
      // const response = await fetch('/api/chat/messages', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     sessionId,
      //     content,
      //     role: 'user'
      //   })
      // })

      // Simulate API response
      await new Promise((resolve) => setTimeout(resolve, 500))

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_resp`,
        content: `I received your message: "${content}". This is a demo response.`,
        role: 'assistant',
        createdAt: new Date().toLocaleTimeString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoadingResponse(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
          ) : (
            <>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-4 border border-white/20">
                <h1 className="text-2xl font-bold text-white">Chat Assistant</h1>
                <p className="text-white/60 text-sm mt-1">
                  Session ID: {sessionId}
                </p>
              </div>

              <div className="flex-1">
                {messages.map((msg) => (
                  <ChatMessageComponent
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    timestamp={msg.createdAt}
                  />
                ))}
                {isLoadingResponse && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-white/20 backdrop-blur-md text-white px-4 py-3 rounded-lg rounded-bl-none border border-white/20">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoadingResponse} />
      </main>
    </div>
  )
}
