import { useState } from 'react'
import { coinImageDataUri, getCoinImage, getProfileImage, getProfileImageFallback } from '../lib/images'

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
  const photo = getProfileImage(seed, index)
  const cartoon = getProfileImageFallback(seed)
  const url = step === 0 ? (src || photo) : step === 1 ? cartoon : getProfileImageFallback(`${seed}-alt`)

  return (
    <img
      src={url}
      alt={alt || seed}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setStep((s) => Math.min(s + 1, 2))}
    />
  )
}
