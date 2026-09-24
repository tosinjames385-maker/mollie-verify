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
  title,
  value,
  icon,
  trend,
  trendUp,
  description,
  loading,
  onClick,
}) => {
  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-[#1c2a38] bg-[#0c1219] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-3 w-20 rounded bg-[#16212d]" />
          <div className="h-9 w-9 rounded-xl bg-[#16212d]" />
        </div>
        <div className="mb-2 h-8 w-16 rounded bg-[#16212d]" />
        <div className="h-2.5 w-24 rounded bg-[#16212d]" />
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-[#1c2a38] bg-[#0c1219] p-5 transition-colors ${onClick ? 'cursor-pointer hover:border-[#2a3d52]' : ''}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5d6b7a]">{title}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c7f284]/10 text-[#c7f284]">{icon}</div>
      </div>
      <p className="text-[28px] font-semibold leading-none tracking-tight text-white">{value}</p>
      {trend ? (
        <p className={`mt-2 text-[12px] font-medium ${trendUp === false ? 'text-red-400' : 'text-[#c7f284]'}`}>{trend}</p>
      ) : null}
      {description ? <p className="mt-1.5 text-[12px] text-[#8b98a8]">{description}</p> : null}
    </div>
  )
}
