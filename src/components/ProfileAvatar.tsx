import { useState } from 'react'
import {
  getProfileImageAlternate,
  getProfileImageFallback,
  getProfileImageReal,
  profileUsesRealPhoto,
  resolveProfileAvatarUrl,
} from '../lib/images'

type ProfileAvatarProps = {
  src?: string
  seed: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  index?: number
}

const sizeClass = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-12 h-12',
}

export function ProfileAvatar({
  src,
  seed,
  alt,
  size = 'sm',
  className = '',
  index = 0,
}: ProfileAvatarProps) {
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
      className={`${sizeClass[size]} rounded-full object-cover bg-[#141D26] border border-[#1E2B38]/80 flex-shrink-0 ${className}`}
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      onError={() => setStep((s) => Math.min(s + 1, maxStep))}
    />
  )
}
