import { useEffect, useState, useCallback } from 'react'
import { Users, ArrowUpDown, Heart, Newspaper } from 'lucide-react'
import { EmptyState } from '../../components/admin/EmptyState'
import { ErrorState } from '../../components/admin/ErrorState'

interface ActivityEvent {
  id: string
  type: string
  description: string
  user: string
  timestamp: string
}

const typeIcons: Record<string, React.ReactNode> = {
  user_registered: <Users className="w-4 h-4 text-blue-400" />,
  submission_created: <ArrowUpDown className="w-4 h-4 text-yellow-400" />,
  news_created: <Newspaper className="w-4 h-4 text-purple-400" />,
  token_liked: <Heart className="w-4 h-4 text-pink-400" />,
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export const AdminActivity: React.FC = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/activity?limit=50', { credentials: 'include' })
      if (!res.ok) throw new Error()
      setEvents(await res.json())
    } catch {
      setError('Failed to load activity')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Activity</h1>
        <p className="text-xs text-gray-500 mt-0.5">Recent events across your platform.</p>
      </div>

      <div className="bg-[#0B1118] border border-[#16212D] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="w-9 h-9 bg-[#16212D] rounded-lg" />
                <div className="flex-1">
                  <div className="h-3 bg-[#16212D] rounded w-2/3 mb-1.5" />
                  <div className="h-2.5 bg-[#16212D] rounded w-1/4" />
                </div>
                <div className="h-2.5 bg-[#16212D] rounded w-12" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState title="No activity yet" description="Events will appear here as users interact with your platform." />
        ) : (
          <div className="divide-y divide-[#16212D]/50">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#0D151F] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#16212D] flex items-center justify-center flex-shrink-0">
                  {typeIcons[e.type] || <Users className="w-4 h-4 text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate">{e.description}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">by {e.user}</p>
                </div>
                <span className="text-[10px] text-gray-500 flex-shrink-0">{timeAgo(e.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
