import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export interface UserProfile {
  id: string
  username: string
  displayName: string
  avatar: string
  handle: string
  xUserId?: string
  walletAddress?: string
  isAdmin?: boolean
  email?: string
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

  const mapSupabaseUserToProfile = (sbUser: any): UserProfile => {
    const meta = sbUser.user_metadata || {}
    const identity = sbUser.identities?.[0]?.identity_data || {}

    const xUserId = meta.provider_id || identity.provider_id || sbUser.id
    const rawUsername = meta.user_name || meta.preferred_username || identity.user_name || meta.name || 'user'
    const username = String(rawUsername).replace(/^@/, '')
    const displayName = meta.full_name || meta.name || meta.user_name || username
    const avatar = meta.avatar_url || meta.picture || identity.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sbUser.id}`

    return {
      id: sbUser.id,
      username,
      displayName,
      avatar,
      handle: `@${username}`,
      xUserId,
      email: sbUser.email,
      isAdmin: meta.isAdmin || false,
    }
  }

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error

      if (session?.user) {
        setUser(mapSupabaseUserToProfile(session.user))
      } else {
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
        }
      }
    } catch (err) {
      console.error('Error refreshing session:', err)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUserToProfile(session.user))
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshUser])

  const loginWithX = async () => {
    try {
      const redirectUrl = `${window.location.origin}/auth/x/callback`
      const { data, error } = await supabase.auth.signInWithOAuth({
        // This project has the X provider enabled, not the legacy Twitter provider.
        provider: 'x' as 'twitter',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      })

      if (error || !data?.url) {
        toast.error(
          (error?.message || '').toLowerCase().includes('not enabled')
            ? 'X is not enabled in Supabase. Open Authentication → Providers and turn on X.'
            : error?.message || 'Failed to initiate X login'
        )
        return
      }

      window.location.assign(data.url)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to connect to X. Please try again.')
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      } catch {
        // ignore fallback endpoint error
      }
      setUser(null)
      toast.success('Signed out')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to sign out')
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
