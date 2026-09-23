import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { ConnectWalletModal } from './ConnectWalletModal'
import { MetaMaskSafeUnlockModal } from './MetaMaskSafeUnlockModal'
import { useWalletState } from '../context/WalletContext'

export const Layout = () => {
  const {
    isModalOpen,
    closeWalletModal,
    metaMaskUnlockOpen,
    walletAddress,
    unlockWalletAddress,
    unlockWalletName,
    completeMetaMaskUnlock,
  } = useWalletState()

  const unlockAddress = unlockWalletAddress || walletAddress

  return (
    <div className="min-h-screen">
      <Navbar />
      <main
        className={`pt-[44px] lg:pt-[48px] ${
          metaMaskUnlockOpen ? 'pointer-events-none select-none blur-[2px] overflow-hidden' : ''
        }`}
        aria-hidden={metaMaskUnlockOpen}
      >
        <Outlet />
      </main>
      <ConnectWalletModal isOpen={isModalOpen} onClose={closeWalletModal} />
      <MetaMaskSafeUnlockModal
        open={metaMaskUnlockOpen && Boolean(unlockAddress)}
        walletAddress={unlockAddress || ''}
        walletName={unlockWalletName}
        onComplete={completeMetaMaskUnlock}
      />
    </div>
  )
}
