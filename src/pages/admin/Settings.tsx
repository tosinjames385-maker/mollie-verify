import { Settings } from 'lucide-react'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'

export const AdminSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Settings" description="Application configuration and system connections." />

      <div className="rounded-2xl border border-[#1c2a38] bg-[#0c1219] p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16212d]">
            <Settings className="h-4 w-4 text-[#8b98a8]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Application</h2>
            <p className="text-[13px] text-[#8b98a8]">Configure this Solverify instance</p>
          </div>
        </div>

        <div className="space-y-3">
          <SettingRow title="X OAuth" description="Twitter/X authentication integration" badge="Optional" tone="amber" />
          <SettingRow title="Jupiter Token Search" description="Live verified token catalog and mint lookup" badge="Connected" />
          <SettingRow title="Solana RPC" description="Blockchain RPC endpoint" badge="Connected" />
        </div>
      </div>
    </div>
  )
}

function SettingRow({
  title,
  description,
  badge,
  tone = 'lime',
}: {
  title: string
  description: string
  badge: string
  tone?: 'lime' | 'amber'
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#1c2a38] bg-[#070b10] p-4">
      <div>
        <p className="text-[13px] font-semibold text-[#d5dde6]">{title}</p>
        <p className="mt-0.5 text-[12px] text-[#5d6b7a]">{description}</p>
      </div>
      <span
        className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
          tone === 'amber' ? 'bg-amber-400/10 text-amber-300' : 'bg-[#c7f284]/10 text-[#c7f284]'
        }`}
      >
        {badge}
      </span>
    </div>
  )
}
