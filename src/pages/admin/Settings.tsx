import { Settings } from 'lucide-react'

export const AdminSettings: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">Application configuration and system settings.</p>
      </div>

      <div className="bg-[#0B1118] border border-[#16212D] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#16212D] flex items-center justify-center">
            <Settings className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Application Settings</h2>
            <p className="text-[11px] text-gray-500">Configure your Solverify instance</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-[#060A0E] rounded-lg border border-[#16212D]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-300">X OAuth</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Twitter/X authentication integration</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-yellow-400 bg-yellow-400/10">
                Optional
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#060A0E] rounded-lg border border-[#16212D]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-300">Jupiter Token Search</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Live verified token catalog and mint lookup</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-[#c7f284] bg-[#c7f284]/10">Connected</span>
            </div>
          </div>

          <div className="p-3 bg-[#060A0E] rounded-lg border border-[#16212D]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-300">Solana RPC</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Blockchain RPC endpoint</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-[#c7f284] bg-[#c7f284]/10">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
