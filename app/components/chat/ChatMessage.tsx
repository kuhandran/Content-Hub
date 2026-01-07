'use client'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export default function ChatMessageComponent({
  role,
  content,
  timestamp,
}: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg backdrop-blur-md border ${
          isUser
            ? 'bg-blue-600/80 border-blue-500/50 text-white rounded-br-none'
            : 'bg-white/10 border-white/30 text-white rounded-bl-none'
        }`}
      >
        <p className="text-sm md:text-base">{content}</p>
        {timestamp && (
          <p className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-white/50'}`}>
            {timestamp}
          </p>
        )}
      </div>
    </div>
  )
}
