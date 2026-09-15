import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Clock, CheckCircle, XCircle, Filter } from 'lucide-react'
import { getSubmissions } from '../lib/api'
import toast from 'react-hot-toast'

interface Submission {
  id: string
  submissionType: string
  status: string
  submitterWallet: string
  createdAt: string
  token: {
    name: string
    symbol: string
    mintAddress: string
    imageUrl?: string
  }
}

export const Submissions = () => {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadSubmissions()
  }, [filter])

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      const params = filter !== 'all' ? { status: filter } : undefined
      const data = await getSubmissions(params)
      setSubmissions(data)
    } catch (error) {
      toast.error('Failed to load submissions')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-400',
        icon: Clock,
      },
      approved: {
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        icon: CheckCircle,
      },
      rejected: {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        icon: XCircle,
      },
    }

    const variant = variants[status as keyof typeof variants] || variants.pending
    const Icon = variant.icon

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${variant.bg} ${variant.text}`}
      >
        <Icon className="w-4 h-4 mr-1.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Submissions</h1>
        <p className="text-gray-400">
          Browse verification submissions and their review status
        </p>
      </div>

      {/* Filters */}
      <div className="bg-dark-200 rounded-lg border border-dark-50 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-primary text-dark-300'
                    : 'bg-dark-50 text-gray-300 hover:bg-dark-100'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-dark-200 rounded-lg border border-dark-50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Token
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Submitter
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {submissions.map((submission) => (
                  <tr
                    key={submission.id}
                    onClick={() =>
                      navigate(`/token/${submission.token.mintAddress}`)
                    }
                    className="hover:bg-dark-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-dark-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                          {submission.token.imageUrl ? (
                            <img
                              src={submission.token.imageUrl}
                              alt={submission.token.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-primary">
                              {submission.token.symbol[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {submission.token.symbol}
                          </div>
                          <div className="text-sm text-gray-400">
                            {submission.token.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-300">
                        {submission.submissionType
                          .split('_')
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-400 font-mono">
                        {submission.submitterWallet.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              No submissions found
            </h3>
            <p className="text-gray-500">
              {filter === 'all'
                ? 'No submissions have been made yet'
                : `No ${filter} submissions found`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
