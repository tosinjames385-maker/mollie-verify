import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

export interface UserProfile {
  id: string
  username: string
  displayName: string
  avatar: string
  handle: string
  xUserId?: string
  walletAddress?: string
  isAdmin?: boolean
}

interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  isModalOpen: boolean
  isLoading: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
  loginWithX: () => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      const data = await res.json()

      if (data.user) {
        setUser({
          id: data.user.id,
          username: data.user.xUsername || data.user.walletAddress || 'user',
          displayName: data.user.displayName || data.user.xUsername || 'User',
          avatar: data.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
          handle: `@${data.user.xUsername || data.user.walletAddress || 'user'}`,
          xUserId: data.user.xUserId,
          walletAddress: data.user.walletAddress,
          isAdmin: data.user.isAdmin,
        })
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const loginWithX = async () => {
    try {
      const res = await fetch('/api/auth/x', { credentials: 'include' })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to initiate X login')
      }
    } catch {
      toast.error('Failed to connect to X. Please try again.')
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
      toast.success('Signed out')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  const openAuthModal = () => setIsModalOpen(true)
  const closeAuthModal = () => setIsModalOpen(false)

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isModalOpen,
        isLoading,
        openAuthModal,
        closeAuthModal,
        loginWithX,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
