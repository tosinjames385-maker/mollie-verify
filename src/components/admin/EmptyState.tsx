import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    {icon && <div className="mb-4 text-gray-600">{icon}</div>}
    <h3 className="text-sm font-semibold text-gray-400 mb-1">{title}</h3>
    <p className="text-xs text-gray-500 text-center max-w-xs">{description}</p>
  </div>
)
