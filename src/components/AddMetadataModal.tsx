import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { X } from 'lucide-react'
import { updateToken } from '../lib/api'
import toast from 'react-hot-toast'

interface AddMetadataModalProps {
  token: any
  onClose: () => void
  onSuccess: () => void
}

export const AddMetadataModal = ({
  token,
  onClose,
  onSuccess,
}: AddMetadataModalProps) => {
  const { publicKey } = useWallet()
  const [formData, setFormData] = useState({
    description: token.description || '',
    website: token.website || '',
    twitter: token.twitter || '',
    telegram: token.telegram || '',
    discord: token.discord || '',
    circulatingSupply: token.circulatingSupply || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setLoading(true)
      await updateToken(token.mintAddress, formData, publicKey.toBase58())
      toast.success('Metadata updated successfully!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update metadata')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-200 rounded-lg border border-dark-50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-dark-200 border-b border-dark-50 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Add Token Metadata</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full bg-dark-50 border border-dark-100 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              placeholder="Describe your token..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              className="w-full bg-dark-50 border border-dark-100 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Twitter / X
            </label>
            <input
              type="text"
              value={formData.twitter}
              onChange={(e) =>
                setFormData({ ...formData, twitter: e.target.value })
              }
              className="w-full bg-dark-50 border border-dark-100 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              placeholder="@username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Telegram
            </label>
            <input
              type="text"
              value={formData.telegram}
              onChange={(e) =>
                setFormData({ ...formData, telegram: e.target.value })
              }
              className="w-full bg-dark-50 border border-dark-100 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              placeholder="@username or group link"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Discord
            </label>
            <input
              type="text"
              value={formData.discord}
              onChange={(e) =>
                setFormData({ ...formData, discord: e.target.value })
              }
              className="w-full bg-dark-50 border border-dark-100 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              placeholder="discord.gg/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Circulating Supply
            </label>
            <input
              type="text"
              value={formData.circulatingSupply}
              onChange={(e) =>
                setFormData({ ...formData, circulatingSupply: e.target.value })
              }
              className="w-full bg-dark-50 border border-dark-100 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              placeholder="1000000000"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-dark-50 text-white rounded-lg hover:bg-dark-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-dark-300 rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Metadata'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
