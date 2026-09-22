import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  Copy,
  AlertTriangle,
  ExternalLink,
  Plus,
  ChevronDown,
  ChevronUp,
  Search,
  List,
  Info,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { AddMetadataModal } from '../components/AddMetadataModal'
import { VerifyTokenModal } from '../components/VerifyTokenModal'
import { AddNewsModal } from '../components/AddNewsModal'
import { WalletConnectControl } from '../components/WalletConnectControl'
import { TokenDetailSkeleton } from '../components/Skeleton'
import { getTokenByMint, LiveToken } from '../services/tokenService'

const DEMO_TOKEN = {
  name: 'Mollie The Runner',
  symbol: 'MOLLIE',
  mintAddress: 'GJPL...pump',
  fullMintAddress: 'GJPLp9k3n8V2LzXW1yR4qS7tU5vW9zM2xQ8vP3kL1mN',
  likes: 1,
  userLiked: false,
  verificationStatus: 'unverified',
  organicActivity: 'low',
  warningsCount: 2,
  circulatingSupply: '963M',
  website: 'cbc.ca',
  twitterUrl: '@devvo_sol/status/2086929302348575127',
  description: null,
}

export const TokenDetail = () => {
  const { publicKey } = useWallet()
  const { mintAddress } = useParams<{ mintAddress: string }>()
  const location = useLocation() as { state?: { selectedToken?: LiveToken } }
  const [token, setToken] = useState(DEMO_TOKEN)
  const [liveLogo, setLiveLogo] = useState<string | null>(null)
  const [loadingLive, setLoadingLive] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showAddMetadata, setShowAddMetadata] = useState(false)
  const [showVerify, setShowVerify] = useState(false)
  const [showAddNews, setShowAddNews] = useState(false)
  const [submissionHistoryOpen, setSubmissionHistoryOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  // Load live token when mintAddress changes (search selector) – mintAddress is canonical id
  useEffect(() => {
    const stateToken = location.state?.selectedToken
    // If navigated with live token in state, use it immediately
    if (stateToken && stateToken.mintAddress === mintAddress) {
      setToken({
        name: stateToken.name,
        symbol: stateToken.symbol,
        mintAddress: `${stateToken.mintAddress.slice(0, 4)}...${stateToken.mintAddress.slice(-4)}`,
        fullMintAddress: stateToken.mintAddress,
        likes: 0,
        userLiked: false,
        verificationStatus: stateToken.verified ? 'verified' : 'unverified',
        organicActivity: stateToken.verified ? 'high' : 'low',
        warningsCount: stateToken.verified ? 0 : 2,
        circulatingSupply: stateToken.price ? `$${stateToken.price}` : '—',
        website: '—',
        twitterUrl: '',
        description: null,
      })
      setLiveLogo(stateToken.logo)
      return
    }
    if (!mintAddress) {
      setToken(DEMO_TOKEN)
      setLiveLogo(null)
      return
    }
    // Don't fetch for demo MOLLIE short mint; only for real 32-44 length mints
    if (mintAddress.length < 30) {
      setToken(DEMO_TOKEN)
      setLiveLogo(null)
      return
    }
    let cancelled = false
    setLoadingLive(true)
    getTokenByMint(mintAddress)
      .then((live) => {
        if (cancelled) return
        setToken({
          name: live.name,
          symbol: live.symbol,
          mintAddress: `${live.mintAddress.slice(0, 4)}...${live.mintAddress.slice(-4)}`,
          fullMintAddress: live.mintAddress,
          likes: 0,
          userLiked: false,
          verificationStatus: live.verified ? 'verified' : 'unverified',
          organicActivity: live.verified ? 'high' : 'low',
          warningsCount: live.verified ? 0 : 2,
          circulatingSupply: live.price ? `$${live.price}` : '—',
          website: '—',
          twitterUrl: '',
          description: null,
        })
        setLiveLogo(live.logo)
      })
      .catch(() => {
        if (!cancelled) toast.error('Live token not found, showing MOLLIE')
      })
      .finally(() => {
        if (!cancelled) setLoadingLive(false)
      })
    return () => {
      cancelled = true
    }
  }, [mintAddress, location.state])

  const handleLike = () => {
    setToken((prev) => ({
      ...prev,
      userLiked: !prev.userLiked,
      likes: prev.userLiked ? prev.likes - 1 : prev.likes + 1,
    }))
    toast.success(token.userLiked ? 'Removed like' : 'Liked token!')
  }

  const copyMintAddress = () => {
    navigator.clipboard.writeText(token.fullMintAddress)
    toast.success('Mint address copied!')
  }

  if (initialLoading || loadingLive) {
    return <TokenDetailSkeleton />
  }

  return (
    <div className="max-w-[1100px] mx-auto px-3 sm:px-6 pt-18 pb-12 font-sans text-gray-100">
      {/* 1. TOP HEADER SECTION (Unwrapped, sitting directly on background) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 mb-4 pt-4">
        {/* Left: Avatar & Title Info */}
        <div className="flex items-center gap-3.5">
          {/* Avatar – live logo with fallback */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#101822] border border-[#1C2838] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm p-0.5">
            {liveLogo ? (
              <img
                src={liveLogo}
                alt={token.symbol}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <img
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                alt={token.symbol}
                className="w-full h-full rounded-full object-cover"
              />
            )}
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none mb-1">
              {token.symbol}
            </h1>

            <div className="flex items-center gap-2 text-xs text-gray-300 mb-1.5">
              <span className="font-semibold text-white">{token.name}</span>
              <span className="text-gray-400 font-mono text-[11px] flex items-center gap-1 bg-[#101926]/80 px-2 py-0.5 rounded border border-[#1C2838]">
                {token.mintAddress}
                <button
                  onClick={copyMintAddress}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Copy mint address"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </span>
            </div>

            {/* Icon Pill Row: Search button + 1 Like pill */}
            <div className="flex items-center gap-2">
              <button className="w-5 h-5 rounded-full bg-[#101926] border border-[#1C2838] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <Search className="w-3 h-3" />
              </button>

              <button
                onClick={handleLike}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold transition-all ${
                  token.userLiked
                    ? 'bg-[#B7F34A]/20 border-[#B7F34A]/50 text-[#B7F34A]'
                    : 'bg-[#101926] border-[#1C2838]/50 text-[#B7F34A] hover:border-[#B7F34A]/40'
                }`}
              >
                <span className="text-[10px]">💚</span>
                <span>{token.likes} like</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Header Buttons - moved up closer to MOLLIE header */}
        <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 -translate-y-0.5 md:-translate-y-1.5">
          <a
            href={`https://jup.ag/swap/SOL-${token.fullMintAddress || mintAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-initial md:w-[120px] px-4 py-2 md:py-1.5 bg-[#121A26] hover:bg-[#1A2636] border border-[#1F2C3D]/50 text-white rounded-lg font-bold text-sm transition-colors text-center flex items-center justify-center gap-1.5"
          >
            Trade
          </a>
          <WalletConnectControl variant="hero" />
        </div>
      </div>

      {/* 2. FAST-TRACK SUBMISSION BANNER */}
      <div className="bg-[#091018] border border-[#162232]/60 rounded-xl p-3.5 mb-4 flex items-start gap-3">
        <span className="text-xs mt-0.5">💚</span>
        <div className="flex-1">
          <h3 className="text-xs font-bold text-white mb-0.5">
            Help fast-track this submission
          </h3>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Smart likes move pending submissions up the review queue. We periodically scan and add new smart likes accounts to our list from interactions on this site.
          </p>
        </div>
      </div>

      {/* 3. RISK / STATUS BADGES ROW (Redesigned as Card) - compact height */}
      <div className="bg-[#0A1017] border border-[#1C2838] rounded-lg p-3 mb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <AlertTriangle className="w-4 h-4 text-[#EAB308]" />
          <span className="text-[13px] font-bold text-[#EAB308]">
            {token.warningsCount} JupShield Warnings
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Not verified pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1A2332] rounded-full">
            <Info className="w-3 h-3 text-gray-400" />
            <span className="text-xs font-medium text-gray-300">
              Not Verified
            </span>
          </div>

          {/* Low Organic Activity pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1A2332] rounded-full">
            <Info className="w-3 h-3 text-gray-400" />
            <span className="text-xs font-medium text-gray-300">
              Low Organic Activity
            </span>
          </div>
        </div>
      </div>
      
      {/* Subtle divider as seen in screenshot */}
      <div className="h-px w-full bg-[#1C2838] mb-4"></div>

      {/* 4. MAIN TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* LEFT COLUMN: Data Completeness Card - widened for better inner arrangement */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-4 w-full">
          <div className="bg-[#0A1017] border border-[#1C2838] rounded-lg p-3.5 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-gray-300" />
                <h2 className="text-[13px] font-bold text-white tracking-wide">
                  Data Completeness
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-300 bg-[#152030] border border-[#1E2D40] px-2 py-0.5 rounded-full">
                  4 TO FIX
                </span>
                <Info className="w-3.5 h-3.5 text-gray-500" />
              </div>
            </div>

            {/* Section List: 2 cols - uses wider card for clean arrangement */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              {/* Token Verification */}
              <div className="border-l-2 border-[#1E2D40] pl-3">
                <h3 className="text-xs font-bold text-white mb-0.5">
                  Token Verification
                </h3>
                <p className={`text-[11px] ${token.verificationStatus === 'verified' ? 'text-[#c7f284]' : 'text-[#94A3B8]'}`}>
                  {token.verificationStatus === 'verified' ? 'Verified' : 'Not yet verified'}
                </p>
              </div>

              {/* Metadata Completeness */}
              <div className="border-l-2 border-[#1E2D40] pl-3">
                <h3 className="text-xs font-bold text-white mb-0.5">
                  Metadata Completeness
                </h3>
                <p className="text-[11px] text-[#64748B] mb-0.5">All fields, including socials</p>
                <p className={`text-xs font-bold ${token.description ? 'text-[#c7f284]' : 'text-[#94A3B8]'}`}>
                  {token.description ? 'All complete' : 'Missing: Description'}
                </p>
              </div>

              {/* Ecosystem Support */}
              <div className="border-l-2 border-[#1E2D40] pl-3">
                <h3 className="text-xs font-bold text-white mb-0.5">
                  Ecosystem Support
                </h3>
                <p className="text-[11px] text-[#64748B] mb-0.5">&gt; 10 Likes</p>
                <p className={`text-xs font-bold ${token.likes >= 10 ? 'text-[#c7f284]' : 'text-[#94A3B8]'}`}>
                  Current Likes: {token.likes}
                </p>
              </div>

              {/* Recent News */}
              <div className="border-l-2 border-[#1E2D40] pl-3">
                <h3 className="text-xs font-bold text-white mb-0.5">
                  Recent News
                </h3>
                <p className="text-[11px] text-[#64748B] mb-0.5">
                  ≥ 1 approvals in last 2 weeks
                </p>
                <p className={`text-xs font-bold ${token.verificationStatus === 'verified' ? 'text-[#c7f284]' : 'text-[#94A3B8]'}`}>
                  {token.verificationStatus === 'verified' ? '1 approved' : '0 approved'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Token Data & News Cards */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-5">
          {/* Token Data Card */}
          <div className="bg-[#091018] border border-[#162232]/40 rounded-xl p-4 sm:p-5 min-h-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-gray-300" />
                <h2 className="text-sm sm:text-base font-bold text-white">Token Data</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#131B26] border border-[#1E2B3C]/60 rounded-full">
                  <span className={`text-xs font-semibold flex items-center gap-1 ${token.verificationStatus === 'verified' ? 'text-[#B7F34A]' : 'text-[#F5C400]'}`}>
                    Status {token.verificationStatus === 'verified' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />} {token.verificationStatus === 'verified' ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <button
                  onClick={() => setShowVerify(true)}
                  className="px-2.5 py-1 bg-[#B7F34A] hover:bg-[#a3e635] text-black font-semibold rounded-md text-[11px] transition-colors"
                >
                  Verify
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Get a green checkmark and accurate token info across Jupiter platforms and API partners.
            </p>

            {/* Dark Inner Container Box (Matching Screenshot Exactly) */}
            <div className="bg-[#060C14] border border-[#131E2B] rounded-xl p-4 sm:p-5 space-y-3">
              {/* Row 1: Name, Symbol, Circulating Supply */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-[#121A26] border border-[#1C2838] rounded-full px-3.5 py-1 text-xs text-gray-300 flex items-center gap-1.5">
                  <span className="text-gray-400">Name:</span>
                  <span className="font-bold text-white">{token.name}</span>
                </div>

                <div className="bg-[#121A26] border border-[#1C2838] rounded-full px-3.5 py-1 text-xs text-gray-300 flex items-center gap-1.5">
                  <span className="text-gray-400">Symbol:</span>
                  <span className="font-bold text-white">{token.symbol}</span>
                </div>

                <div className="bg-[#121A26] border border-[#1C2838] rounded-full px-3.5 py-1 text-xs text-gray-300 flex items-center gap-1.5">
                  <span className="text-gray-400">Circulating Supply:</span>
                  <span className="font-bold text-white">{token.circulatingSupply}</span>
                </div>
              </div>

              {/* Row 2: Website & X (Twitter) */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`https://${token.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#121A26] hover:bg-[#182333] border border-[#1C2838] rounded-full px-3.5 py-1 text-xs text-gray-300 flex items-center gap-1.5 transition-colors"
                >
                  <span className="text-gray-400">🌐 Website:</span>
                  <span className="font-semibold text-white">{token.website}</span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>

                <a
                  href={`https://twitter.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#121A26] hover:bg-[#182333] border border-[#1C2838] rounded-full px-3.5 py-1 text-xs text-gray-300 flex items-center gap-1.5 transition-colors"
                >
                  <span className="text-gray-400">𝕏 X:</span>
                  <span className="font-semibold text-white truncate max-w-[220px]">
                    {token.twitterUrl}
                  </span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>
              </div>

              {/* Row 3: Description (Missing) */}
              <div className="flex items-center">
                <button
                  onClick={() => setShowAddMetadata(true)}
                  className="bg-[#121A26] hover:bg-[#182333] border border-dashed border-[#1C2838] rounded-full px-3 py-1 text-xs text-gray-400 italic flex items-center gap-1.5 transition-colors"
                >
                  <span>Description:</span>
                  <span className="not-italic text-gray-400">missing</span>
                  <span className="not-italic font-medium text-white hover:underline flex items-center gap-0.5 ml-1">
                    Add now <Plus className="w-3 h-3" />
                  </span>
                </button>
              </div>
            </div>

            {/* Submission History Accordion Header */}
            <div className="border-t border-[#131E2D] pt-3.5 mt-4">
              <button
                onClick={() => setSubmissionHistoryOpen(!submissionHistoryOpen)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-xs font-bold text-gray-400 tracking-wider">
                  SUBMISSION HISTORY <span className="ml-1 text-gray-500 font-mono">1</span>
                </span>
                <span className="text-gray-500">
                  {submissionHistoryOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* News Card */}
          <div className="bg-[#091018] border border-[#162232]/40 rounded-xl p-4 sm:p-5 min-h-[300px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4.5 h-4.5 text-gray-300" />
                  <h2 className="text-sm sm:text-base font-bold text-white">News</h2>
                </div>
                <button
                  onClick={() => setShowAddNews(true)}
                  className="px-2.5 py-1 bg-[#B7F34A] hover:bg-[#a3e635] text-black font-semibold rounded-md text-[11px] transition-colors"
                >
                  Add Tweet
                </button>
              </div>

              <p className="text-xs text-gray-400 mb-8">
                Recommend tweets or report inaccurate content. Curated content from here is reflected across Jupiter platforms and partners.
              </p>
            </div>

            {/* Empty State */}
            <div className="flex flex-col items-center justify-center py-10 text-center my-auto">
              <div className="w-12 h-12 rounded-full border border-[#1C2838] bg-[#060C14] flex items-center justify-center mb-3 shadow-inner">
                <MessageSquare className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-xs font-bold text-gray-300">Recommend a tweet today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddMetadata && (
        <AddMetadataModal
          token={token as any}
          onClose={() => setShowAddMetadata(false)}
          onSuccess={() => setShowAddMetadata(false)}
        />
      )}

      {showVerify && (
        <VerifyTokenModal
          token={token as any}
          onClose={() => setShowVerify(false)}
          onSuccess={() => setShowVerify(false)}
        />
      )}

      {showAddNews && (
        <AddNewsModal
          token={token as any}
          onClose={() => setShowAddNews(false)}
          onSuccess={() => setShowAddNews(false)}
        />
      )}

    </div>
  )
}
