import { getProfileImageFallback } from '../lib/images'

type ProfileAvatarProps = {
  src?: string
  seed: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClass = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-12 h-12',
}

export function ProfileAvatar({ src, seed, alt, size = 'sm', className = '' }: ProfileAvatarProps) {
  const fallback = getProfileImageFallback(seed)
  return (
    <img
      src={src || fallback}
      alt={alt || seed}
      className={`${sizeClass[size]} rounded-full object-cover bg-[#141D26] border border-[#1E2B38]/80 flex-shrink-0 ${className}`}
      onError={(e) => {
        const el = e.currentTarget
        if (el.src !== fallback) el.src = fallback
      }}
    />
  )
}
