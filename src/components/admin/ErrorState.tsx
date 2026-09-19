import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Failed to load data',
  onRetry
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <AlertTriangle className="w-8 h-8 text-red-400/60 mb-3" />
    <h3 className="text-sm font-semibold text-gray-400 mb-1">{message}</h3>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-[#16212D] hover:bg-[#1F2E3E] transition-colors"
      >
        <RefreshCw className="w-3 h-3" />
        Try again
      </button>
    )}
  </div>
)
