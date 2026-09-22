import { useState } from 'react'
import { coinImageDataUri, getCoinImage, getProfileImageAlternate, getProfileImageFallback, getProfileImageReal, profileUsesRealPhoto, resolveProfileAvatarUrl } from '../lib/images'

interface TokenImageProps {
  src?: string
  symbol: string
  index?: number
  alt?: string
  className?: string
}

export const TokenImage = ({ src, symbol, index = 0, alt, className = 'w-full h-full object-cover' }: TokenImageProps) => {
  const [step, setStep] = useState(0)
  const fallbackCoin = getCoinImage(symbol, index)
  const local = coinImageDataUri(symbol, index)
  const url = step === 0 ? (src || fallbackCoin) : step === 1 ? fallbackCoin : local

  return (
    <img
      src={url}
      alt={alt || symbol}
      className={className}
      onError={() => setStep((s) => Math.min(s + 1, 2))}
    />
  )
}

interface ProfileImageProps {
  src?: string
  seed: string
  index?: number
  alt?: string
  className?: string
}

export const ProfileImage = ({ src, seed, index = 0, alt, className = 'w-full h-full object-cover' }: ProfileImageProps) => {
  const [step, setStep] = useState(0)
  const primary = resolveProfileAvatarUrl(src, seed, index)
  const embedded = getProfileImageFallback(seed)

  const maxStep = profileUsesRealPhoto(seed, index) ? 4 : 2

  const urlForStep = (s: number) => {
    if (s === 0) return primary
    if (s === 1) return getProfileImageAlternate(seed, index)
    if (s === 2 && profileUsesRealPhoto(seed, index)) return getProfileImageReal(seed, index, 1)
    if (s === 3 && profileUsesRealPhoto(seed, index)) return getProfileImageReal(seed, index, 2)
    if (s === 2) return getProfileImageAlternate(seed, index + 7)
    return embedded
  }

  return (
    <img
      src={urlForStep(step)}
      alt={alt || seed}
      className={className}
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      onError={() => setStep((s) => Math.min(s + 1, maxStep))}
    />
  )
}
