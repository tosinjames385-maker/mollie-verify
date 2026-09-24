import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message = 'Failed to load data', onRetry }) => (
  <div className="flex flex-col items-center justify-center px-6 py-20">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
      <AlertTriangle className="h-5 w-5" />
    </div>
    <h3 className="text-sm font-semibold text-white">{message}</h3>
    {onRetry ? (
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#16212d] px-3.5 py-2 text-[12px] font-medium text-[#d5dde6] transition-colors hover:bg-[#1c2a38] hover:text-white"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Try again
      </button>
    ) : null}
  </div>
)
