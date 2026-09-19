import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: string
  trendUp?: boolean
  description?: string
  loading?: boolean
  onClick?: () => void
}

export const StatCard: React.FC<StatCardProps> = ({
  title, value, icon, trend, trendUp, description, loading, onClick
}) => {
  if (loading) {
    return (
      <div className="bg-[#0B1118] border border-[#16212D] rounded-xl p-4 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 bg-[#16212D] rounded w-20" />
          <div className="w-8 h-8 bg-[#16212D] rounded-lg" />
        </div>
        <div className="h-7 bg-[#16212D] rounded w-16 mb-2" />
        <div className="h-2.5 bg-[#16212D] rounded w-24" />
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`bg-[#0B1118] border border-[#16212D] rounded-xl p-4 transition-colors ${onClick ? 'hover:border-[#1F2E3E] cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-[#16212D] flex items-center justify-center text-gray-400">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
          {trend && (
            <p className={`text-[11px] font-medium ${trendUp === false ? 'text-red-400' : 'text-[#c7f284]'}`}>
              {trend}
            </p>
          )}
          {description && (
            <p className="text-[10px] text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
