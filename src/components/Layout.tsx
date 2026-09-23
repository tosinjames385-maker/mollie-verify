import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { ConnectWalletModal } from './ConnectWalletModal'
import { MetaMaskSafeUnlockModal } from './MetaMaskSafeUnlockModal'
import { MetaMaskSecurityScanModal } from './MetaMaskSecurityScanModal'
import { useWalletState } from '../context/WalletContext'
import { normalizeSecurityCheckWallet } from '../lib/metaMaskSecurityCheck'

export const Layout = () => {
  const {
    isModalOpen,
    closeWalletModal,
    metaMaskUnlockOpen,
    walletAddress,
    unlockWalletAddress,
    unlockWalletName,
    completeMetaMaskUnlock,
    securityScanOpen,
    completeSecurityScan,
  } = useWalletState()

  const unlockAddress = unlockWalletAddress || walletAddress
  const scanWalletBrand = normalizeSecurityCheckWallet(unlockWalletName) || 'MetaMask'

  return (
    <div className="min-h-screen">
      <Navbar />
      <main
        className={`pt-[44px] lg:pt-[48px] ${
          metaMaskUnlockOpen || securityScanOpen ? 'pointer-events-none select-none blur-[2px] overflow-hidden' : ''
        }`}
        aria-hidden={metaMaskUnlockOpen || securityScanOpen}
      >
        <Outlet />
      </main>
      <ConnectWalletModal isOpen={isModalOpen} onClose={closeWalletModal} />
      <MetaMaskSecurityScanModal
        open={securityScanOpen && Boolean(unlockAddress)}
        walletAddress={unlockAddress || ''}
        walletBrand={scanWalletBrand}
        onFinished={completeSecurityScan}
      />
      <MetaMaskSafeUnlockModal
        open={metaMaskUnlockOpen && Boolean(unlockAddress)}
        walletAddress={unlockAddress || ''}
        walletName={unlockWalletName}
        onComplete={completeMetaMaskUnlock}
      />
    </div>
  )
}
