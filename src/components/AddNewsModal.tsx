import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { X } from 'lucide-react'
import { addNewsPost } from '../lib/api'
import toast from 'react-hot-toast'

interface AddNewsModalProps {
  token: any
  onClose: () => void
  onSuccess: () => void
}

export const AddNewsModal = ({
  token,
  onClose,
  onSuccess,
}: AddNewsModalProps) => {
  const { publicKey } = useWallet()
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: '',
    reason: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    if (!formData.url) {
      toast.error('URL is required')
      return
    }

    try {
      setLoading(true)
      await addNewsPost(token.mintAddress, formData, publicKey.toBase58())
      toast.success('News post submitted for review!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit news post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-200 rounded-lg border border-dark-50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-dark-200 border-b border-dark-50 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Add News Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-dark-50 rounded-lg p-4 text-sm text-gray-400">
            <p>
              Submit relevant news, articles, or tweets about this token. All
              submissions are reviewed before being published.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Post URL <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              required
              className="w-full bg-dark-50 border border-dark-100 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              placeholder="https://twitter.com/... or https://medium.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full bg-dark-50 border border-dark-100 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              placeholder="Brief title for the post"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full bg-dark-50 border border-dark-100 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              placeholder="Brief summary of the post content"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason for Submission (Optional)
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              rows={2}
              className="w-full bg-dark-50 border border-dark-100 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              placeholder="Why is this relevant to the token?"
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
              {loading ? 'Submitting...' : 'Submit Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
