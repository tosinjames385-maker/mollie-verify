import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { ConnectWalletModal } from './ConnectWalletModal'
import { useWalletState } from '../context/WalletContext'

export const Layout = () => {
  const { isModalOpen, closeWalletModal } = useWalletState()

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
