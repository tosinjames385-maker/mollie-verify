import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { ConnectWalletModal } from './ConnectWalletModal'
import { useAuth } from '../context/AuthContext'
import { useWalletState } from '../context/WalletContext'
import { peekPendingLike } from '../lib/authRedirect'

export const Layout = () => {
  const { isAuthenticated } = useAuth()
  const { isModalOpen, closeWalletModal, connected, openWalletModal } = useWalletState()

  useEffect(() => {
    if (!isAuthenticated || connected || !peekPendingLike()) return
    openWalletModal()
  }, [isAuthenticated, connected])

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-[44px] lg:pt-[48px]">
        <Outlet />
      </main>
      <ConnectWalletModal isOpen={isModalOpen} onClose={closeWalletModal} />
    </div>
  )
}
