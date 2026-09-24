import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center px-6 py-20">
    {icon ? (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16212d] text-[#5d6b7a]">{icon}</div>
    ) : null}
    <h3 className="text-sm font-semibold text-white">{title}</h3>
    <p className="mt-1.5 max-w-sm text-center text-[13px] leading-relaxed text-[#8b98a8]">{description}</p>
  </div>
)
