import { Play, ExternalLink } from 'lucide-react'

const featuredVideo = {
  title: 'Verified Not Extinct',
  duration: '1:12',
  thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=675&fit=crop',
  description: 'The story of how token verification evolved from cave paintings to modern blockchain technology.',
}

const videos = [
  { 
    id: 1, 
    title: 'What is VRFD?', 
    duration: '0:45', 
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=640&h=360&fit=crop',
    description: 'A quick introduction to the VRFD verification system.',
  },
  { 
    id: 2, 
    title: 'How Verification Works', 
    duration: '1:20', 
    thumbnail: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=640&h=360&fit=crop',
    description: 'Deep dive into the token verification process.',
  },
  { 
    id: 3, 
    title: 'Community Signals', 
    duration: '0:58', 
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&h=360&fit=crop',
    description: 'How community members contribute to verification.',
  },
  { 
    id: 4, 
    title: 'Express Verification', 
    duration: '0:35', 
    thumbnail: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=640&h=360&fit=crop',
    description: 'Speed up your token verification with Express lane.',
  },
]

const articles = [
  {
    id: 1,
    title: 'The Complete Guide to Token Verification on Solana',
    description: 'Everything you need to know about getting your token verified on the Solana blockchain.',
    readTime: '8 min read',
    date: 'Sep 15, 2026',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=640&h=360&fit=crop',
  },
  {
    id: 2,
    title: 'Understanding Organic Activity Scores',
    description: 'How VRFD calculates organic activity and why it matters for token verification.',
    readTime: '5 min read',
    date: 'Sep 12, 2026',
    image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=640&h=360&fit=crop',
  },
  {
    id: 3,
    title: 'Jup Shield: Your First Line of Defense',
    description: 'Learn how Jup Shield protects traders from malicious tokens.',
    readTime: '6 min read',
    date: 'Sep 10, 2026',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=640&h=360&fit=crop',
  },
]

export const Media = () => {
  return (
    <div className="min-h-screen bg-[#070A0F]">
      {/* Hero */}
      <div className="pt-16 pb-6 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-3">Media</h1>
        <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto mb-6">
          Short animated explainers and deep-dive reads on the open, human-reviewed data layer behind every Solana token.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button className="bg-[#B7F34A] hover:bg-[#a3e635] text-black font-semibold px-6 py-3 rounded-full text-sm transition-colors w-full sm:w-auto">
            Watch the films
          </button>
          <a
            href="https://twitter.com/Jup_VRFD"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0F151E] hover:bg-[#1A2332] border border-[#1A2332] text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
            </svg>
            Follow @Jup_VRFD
          </a>
        </div>
      </div>

      {/* Featured Video */}
      <div className="max-w-4xl mx-auto px-4 mb-12">
        <div className="relative rounded-2xl overflow-hidden bg-[#0A1017] border border-[#1C2838] aspect-video group cursor-pointer">
          <img
            src={featuredVideo.thumbnail}
            alt={featuredVideo.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute top-4 left-4 bg-[#B7F34A] text-black text-[10px] font-bold px-2 py-1 rounded">
            LATEST
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
            </div>
          </div>
          <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {featuredVideo.duration}
          </div>
          <div className="absolute bottom-4 left-4 right-20">
            <h2 className="text-xl font-bold text-white mb-1">{featuredVideo.title}</h2>
            <p className="text-sm text-gray-300">{featuredVideo.description}</p>
          </div>
        </div>
      </div>

      {/* Animated Explainers Section */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-500 tracking-wider mb-2">WATCH</p>
          <h2 className="text-2xl font-bold text-white mb-2">Animated explainers</h2>
          <p className="text-gray-400 text-sm">
            Bite-sized films on how Solana token data gets verified, updated, and distributed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-[#0A1017] border border-[#1C2838] rounded-xl overflow-hidden group cursor-pointer hover:border-[#B7F34A]/30 transition-colors"
            >
              <div className="relative aspect-video">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded">
                  {String(video.id).padStart(2, '0')}
                </div>
                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
                  {video.duration}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white text-sm mb-1">{video.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{video.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Articles Section */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-500 tracking-wider mb-2">READ</p>
          <h2 className="text-2xl font-bold text-white mb-2">Deep-dive articles</h2>
          <p className="text-gray-400 text-sm">
            In-depth analysis and guides on token verification and ecosystem security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-[#0A1017] border border-[#1C2838] rounded-xl overflow-hidden group cursor-pointer hover:border-[#B7F34A]/30 transition-colors"
            >
              <div className="relative aspect-video">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span>{article.date}</span>
                  <span>·</span>
                  <span>{article.readTime}</span>
                </div>
                <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2 group-hover:text-[#B7F34A] transition-colors">
                  {article.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2">{article.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-[#B7F34A] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Read more
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}