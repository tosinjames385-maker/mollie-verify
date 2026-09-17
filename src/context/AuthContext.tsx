import React, { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export interface UserProfile {
  username: string
  name: string
  avatar: string
  handle: string
}

interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  isModalOpen: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
  loginWithX: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          username: session.user.user_metadata.user_name || session.user.email?.split('@')[0] || 'user',
          handle: `@${session.user.user_metadata.user_name || session.user.email?.split('@')[0] || 'user'}`,
          name: session.user.user_metadata.full_name || 'User',
          avatar: session.user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
        })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          username: session.user.user_metadata.user_name || session.user.email?.split('@')[0] || 'user',
          handle: `@${session.user.user_metadata.user_name || session.user.email?.split('@')[0] || 'user'}`,
          name: session.user.user_metadata.full_name || 'User',
          avatar: session.user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const openAuthModal = () => setIsModalOpen(true)
  const closeAuthModal = () => setIsModalOpen(false)

  const loginWithX = async () => {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        toast.error('Supabase URL not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
        return
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
      setIsModalOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with X')
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Signed out')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isModalOpen,
        openAuthModal,
        closeAuthModal,
        loginWithX,
        logout,
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
