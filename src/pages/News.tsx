import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Newspaper, ExternalLink, Clock } from 'lucide-react'
import { getNews } from '../lib/api'
import toast from 'react-hot-toast'

interface NewsItem {
  id: string
  url: string
  title?: string
  description?: string
  createdAt: string
  token: {
    name: string
    symbol: string
    mintAddress: string
    imageUrl?: string
  }
}

export const News = () => {
  const navigate = useNavigate()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNews()
  }, [])

  const loadNews = async () => {
    try {
      setLoading(true)
      const data = await getNews('approved')
      setNews(data)
    } catch (error) {
      toast.error('Failed to load news')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-dark-200 rounded-lg border border-dark-50 p-6 animate-pulse"
            >
              <div className="h-4 bg-dark-50 rounded w-3/4 mb-4" />
              <div className="h-3 bg-dark-50 rounded w-full mb-2" />
              <div className="h-3 bg-dark-50 rounded w-5/6" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Latest News</h1>
        <p className="text-gray-400">
          Community-submitted news and updates about verified tokens
        </p>
      </div>

      {/* News Grid */}
      {news.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <div
              key={item.id}
              className="bg-dark-200 rounded-lg border border-dark-50 overflow-hidden hover:border-primary/50 transition-all group"
            >
              <div className="p-6">
                {/* Token Info */}
                <button
                  onClick={() => navigate(`/token/${item.token.mintAddress}`)}
                  className="flex items-center space-x-3 mb-4 w-full text-left hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 bg-dark-50 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.token.imageUrl ? (
                      <img
                        src={item.token.imageUrl}
                        alt={item.token.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-primary">
                        {item.token.symbol[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">
                      {item.token.symbol}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {item.token.name}
                    </div>
                  </div>
                </button>

                {/* News Content */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-white group-hover:text-primary transition-colors line-clamp-2">
                    {item.title || 'News Update'}
                  </h3>

                  {item.description && (
                    <p className="text-sm text-gray-400 line-clamp-3">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-dark-50">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      <span className="mr-1">Read</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-400 mb-2">
            No news found
          </h3>
          <p className="text-gray-500">Check back later for updates</p>
        </div>
      )}
    </div>
  )
}
