import type { ReactNode } from 'react'

interface AdminPageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ title, description, actions }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      <h1 className="text-[22px] font-semibold tracking-tight text-white">{title}</h1>
      {description ? (
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[#8b98a8]">{description}</p>
      ) : null}
    </div>
    {actions ? <div className="flex flex-shrink-0 items-center gap-2">{actions}</div> : null}
  </div>
)
