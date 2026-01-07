'use client'

interface CollectionCardProps {
  id: string
  title: string
  description: string
  itemCount: number
  lastUpdated: string
  link: string
}

export default function CollectionCard({
  title,
  description,
  itemCount,
  lastUpdated,
  link,
}: CollectionCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 hover:border-white/40 transition overflow-hidden h-full flex flex-col hover:shadow-xl hover:shadow-blue-500/10">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-24"></div>

      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-white/70 text-sm mb-4 flex-1">{description}</p>

        <div className="flex justify-between items-center text-sm text-white/60 mb-4 pt-4 border-t border-white/10">
          <span>📊 {itemCount} items</span>
          <span>🕒 {lastUpdated}</span>
        </div>

        <a
          href={link}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition text-center font-medium border border-blue-500/50"
        >
          View Collection
        </a>
      </div>
    </div>
  )
}
