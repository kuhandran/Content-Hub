'use client'

interface StatCardProps {
  title: string
  value: string | number
  icon: string
  trend?: string
}

export default function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <div className="group bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/25 hover:border-white/40 hover:from-white/20 hover:to-white/10 transition-all duration-300 shadow-2xl hover:shadow-2xl hover:shadow-blue-500/10">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-white/60 text-sm font-semibold uppercase tracking-wider">{title}</p>
          <p className="text-5xl font-bold text-white mt-4 group-hover:text-blue-200 transition-colors">{value}</p>
          {trend && (
            <p className="text-sm text-emerald-300 mt-3 font-medium flex items-center gap-1">
              <span className="text-lg">↑</span> {trend}
            </p>
          )}
        </div>
        <div className="text-6xl opacity-40 group-hover:opacity-60 transition-opacity">{icon}</div>
      </div>
      <div className="mt-6 h-1 bg-gradient-to-r from-blue-500/50 via-transparent to-transparent rounded-full"></div>
    </div>
  )
}
