import React, { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'

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
  loginWithX: (customHandle?: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('vrfd_user_profile')
    return saved ? JSON.parse(saved) : null
  })
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openAuthModal = () => setIsModalOpen(true)
  const closeAuthModal = () => setIsModalOpen(false)

  const loginWithX = (customHandle?: string) => {
    const handle = customHandle || 'danielolam74317'
    const profile: UserProfile = {
      username: handle,
      handle: `@${handle}`,
      name: 'Daniel Olamilekan',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}&backgroundColor=00D2B8`,
    }
    setUser(profile)
    localStorage.setItem('vrfd_user_profile', JSON.stringify(profile))
    setIsModalOpen(false)
    toast.success(`Signed in as @${handle}`)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('vrfd_user_profile')
    toast.success('Signed out')
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
