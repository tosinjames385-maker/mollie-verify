import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  Shield,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Newspaper,
} from 'lucide-react'
import {
  getSubmissions,
  getNews,
  updateSubmissionStatus,
  updateNewsStatus,
  getAdminStats,
} from '../lib/api'
import toast from 'react-hot-toast'

export const Admin = () => {
  const { publicKey } = useWallet()
  const [stats, setStats] = useState<any>(null)
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([])
  const [pendingNews, setPendingNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'submissions' | 'news'>('submissions')

  useEffect(() => {
    if (publicKey) {
      loadData()
    }
  }, [publicKey])

  const loadData = async () => {
    if (!publicKey) return

    try {
      setLoading(true)
      const [statsData, submissionsData, newsData] = await Promise.all([
        getAdminStats(publicKey.toBase58()),
        getSubmissions({ status: 'pending' }),
        getNews('pending'),
      ])

      setStats(statsData)
      setPendingSubmissions(submissionsData)
      setPendingNews(newsData)
    } catch (error: any) {
      if (error.message.includes('Admin')) {
        toast.error('Admin access required')
      } else {
        toast.error('Failed to load admin data')
      }
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveSubmission = async (id: string) => {
    if (!publicKey) return

    try {
      await updateSubmissionStatus(
        id,
        { status: 'approved' },
        publicKey.toBase58()
      )
      toast.success('Submission approved!')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve submission')
    }
  }

  const handleRejectSubmission = async (id: string) => {
    if (!publicKey) return

    try {
      await updateSubmissionStatus(
        id,
        { status: 'rejected' },
        publicKey.toBase58()
      )
      toast.success('Submission rejected')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject submission')
    }
  }

  const handleApproveNews = async (id: string) => {
    if (!publicKey) return

    try {
      await updateNewsStatus(id, 'approved', publicKey.toBase58())
      toast.success('News post approved!')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve news')
    }
  }

  const handleRejectNews = async (id: string) => {
    if (!publicKey) return

    try {
      await updateNewsStatus(id, 'rejected', publicKey.toBase58())
      toast.success('News post rejected')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject news')
    }
  }

  if (!publicKey) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Admin Access Required
        </h2>
        <p className="text-gray-400">
          Please connect your wallet to access the admin dashboard
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">
          Manage verification submissions and content moderation
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-dark-200 rounded-lg border border-dark-50 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total Tokens</span>
              <Shield className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalTokens}</p>
          </div>

          <div className="bg-dark-200 rounded-lg border border-dark-50 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Verified</span>
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.verifiedTokens}
            </p>
          </div>

          <div className="bg-dark-200 rounded-lg border border-dark-50 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Pending</span>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.pendingSubmissions}
            </p>
          </div>

          <div className="bg-dark-200 rounded-lg border border-dark-50 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">News Pending</span>
              <Newspaper className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.pendingNews}</p>
          </div>

          <div className="bg-dark-200 rounded-lg border border-dark-50 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total Likes</span>
              <TrendingUp className="w-5 h-5 text-pink-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalLikes}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-dark-200 rounded-lg border border-dark-50 p-1 mb-6">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'submissions'
              ? 'bg-primary text-dark-300'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 inline-block mr-2" />
          Verification Submissions ({pendingSubmissions.length})
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'news'
              ? 'bg-primary text-dark-300'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Newspaper className="w-4 h-4 inline-block mr-2" />
          News Posts ({pendingNews.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {pendingSubmissions.length > 0 ? (
            pendingSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-dark-200 rounded-lg border border-dark-50 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-dark-50 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {submission.token.imageUrl ? (
                        <img
                          src={submission.token.imageUrl}
                          alt={submission.token.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {submission.token.symbol[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">
                        {submission.token.symbol} - {submission.token.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">
                        Type: {submission.submissionType}
                      </p>
                      <p className="text-xs text-gray-500">
                        Submitted by: {submission.submitterWallet.slice(0, 16)}...
                      </p>
                      <p className="text-xs text-gray-500">
                        Date: {new Date(submission.createdAt).toLocaleString()}
                      </p>
                      {submission.notes && (
                        <p className="text-sm text-gray-400 mt-3 p-3 bg-dark-50 rounded">
                          {submission.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleApproveSubmission(submission.id)}
                      className="px-4 py-2 bg-primary text-dark-300 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm whitespace-nowrap"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectSubmission(submission.id)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium text-sm whitespace-nowrap"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-dark-200 rounded-lg border border-dark-50">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No pending submissions</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'news' && (
        <div className="space-y-4">
          {pendingNews.length > 0 ? (
            pendingNews.map((news) => (
              <div
                key={news.id}
                className="bg-dark-200 rounded-lg border border-dark-50 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-dark-50 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {news.token.imageUrl ? (
                        <img
                          src={news.token.imageUrl}
                          alt={news.token.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {news.token.symbol[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">
                        {news.token.symbol} - {news.title || 'News Post'}
                      </h3>
                      <a
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80 mb-2 inline-block"
                      >
                        {news.url}
                      </a>
                      {news.description && (
                        <p className="text-sm text-gray-400 mb-2">
                          {news.description}
                        </p>
                      )}
                      {news.reason && (
                        <p className="text-sm text-gray-400 mt-2 p-3 bg-dark-50 rounded">
                          Reason: {news.reason}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Submitted by: {news.submittedBy.slice(0, 16)}...
                      </p>
                      <p className="text-xs text-gray-500">
                        Date: {new Date(news.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleApproveNews(news.id)}
                      className="px-4 py-2 bg-primary text-dark-300 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm whitespace-nowrap"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectNews(news.id)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium text-sm whitespace-nowrap"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-dark-200 rounded-lg border border-dark-50">
              <Newspaper className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No pending news posts</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
