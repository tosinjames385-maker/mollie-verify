import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { submitVerification } from '../lib/api'
import toast from 'react-hot-toast'

interface VerifyTokenModalProps {
  token: any
  onClose: () => void
  onSuccess: () => void
}

export const VerifyTokenModal = ({
  token,
  onClose,
  onSuccess,
}: VerifyTokenModalProps) => {
  const { publicKey } = useWallet()
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const requirements = [
    {
      label: 'Token name and symbol',
      met: !!token.name && !!token.symbol,
    },
    {
      label: 'Token description',
      met: !!token.description,
    },
    {
      label: 'Website URL',
      met: !!token.website,
    },
    {
      label: 'Social media link (Twitter/Telegram)',
      met: !!token.twitter || !!token.telegram,
    },
  ]

  const allRequirementsMet = requirements.every((r) => r.met)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    if (!allRequirementsMet) {
      toast.error('Please complete all required fields before submitting')
      return
    }

    try {
      setLoading(true)
      await submitVerification(token.mintAddress, notes, publicKey.toBase58())
      toast.success('Verification submitted successfully!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit verification')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-200 rounded-lg border border-dark-50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-dark-200 border-b border-dark-50 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Submit for Verification</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Token Info */}
          <div className="bg-dark-50 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-dark-200 rounded-full flex items-center justify-center">
                {token.imageUrl ? (
                  <img
                    src={token.imageUrl}
                    alt={token.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-xl font-bold text-primary">
                    {token.symbol[0]}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-white">{token.symbol}</h3>
                <p className="text-sm text-gray-400">{token.name}</p>
              </div>
            </div>
          </div>

          {/* Requirements Checklist */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Verification Requirements
            </h3>
            <div className="space-y-3">
              {requirements.map((req, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 text-sm"
                >
                  {req.met ? (
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span
                    className={req.met ? 'text-gray-300' : 'text-yellow-400'}
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {!allRequirementsMet && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-sm text-yellow-400">
                Please complete all required fields before submitting for
                verification. You can add missing information on the token page.
              </p>
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full bg-dark-50 border border-dark-100 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              placeholder="Add any additional information that might help with the verification process..."
            />
          </div>

          {/* Submission Info */}
          <div className="bg-dark-50 rounded-lg p-4 text-sm text-gray-400">
            <p className="mb-2">
              <strong className="text-white">What happens next:</strong>
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Your submission will be reviewed by our team</li>
              <li>Review typically takes 1-3 business days</li>
              <li>You'll be notified of the verification status</li>
              <li>Verified tokens get a green checkmark badge</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-dark-50 text-white rounded-lg hover:bg-dark-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !allRequirementsMet}
              className="flex-1 px-6 py-3 bg-primary text-dark-300 rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
