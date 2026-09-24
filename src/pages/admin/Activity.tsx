import { useEffect, useState, useCallback } from 'react'
import { Users, ArrowUpDown, Heart, Newspaper } from 'lucide-react'
import { EmptyState } from '../../components/admin/EmptyState'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DEMO_ADMIN_ACTIVITY, adminFetchJson } from '../../lib/adminDemo'

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

  const load = useCallback(async () => {
    setLoading(true)
    const data = await adminFetchJson<ActivityEvent[]>('/api/admin/activity?limit=50', DEMO_ADMIN_ACTIVITY)
    setEvents(Array.isArray(data) ? data : DEMO_ADMIN_ACTIVITY)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Activity" description="Recent events across your platform." />

      <div className="overflow-hidden rounded-2xl border border-[#1c2a38] bg-[#0c1219]">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 p-3">
                <div className="h-9 w-9 rounded-lg bg-[#16212d]" />
                <div className="flex-1">
                  <div className="mb-1.5 h-3 w-2/3 rounded bg-[#16212d]" />
                  <div className="h-2.5 w-1/4 rounded bg-[#16212d]" />
                </div>
                <div className="h-2.5 w-12 rounded bg-[#16212d]" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState title="No activity yet" description="Events will appear here as users interact with your platform." />
        ) : (
          <div className="divide-y divide-[#1c2a38]/70">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#0f1720]">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#16212d]">
                  {typeIcons[e.type] || <Users className="h-4 w-4 text-[#5d6b7a]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-[#d5dde6]">{e.description}</p>
                  <p className="mt-0.5 text-[11px] text-[#5d6b7a]">by {e.user}</p>
                </div>
                <span className="flex-shrink-0 text-[11px] text-[#5d6b7a]">{timeAgo(e.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
