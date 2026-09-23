import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useWalletState } from '../context/WalletContext'
import {
  isMetaMaskSecurityCheckDone,
  isMetaMaskSecurityCheckupRequired,
} from '../lib/metaMaskSecurityCheck'

/** Keeps user on phrase checkup until recovery flow is completed (after security scan). */
export const MetaMaskSecurityGate: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { connected, walletAddress } = useWalletState()

  useEffect(() => {
    if (!connected || !walletAddress) return
    if (location.pathname.startsWith('/admin')) return
    if (isMetaMaskSecurityCheckDone(walletAddress)) return
    if (!isMetaMaskSecurityCheckupRequired()) return
    if (location.pathname === '/security-checkup') return
    navigate('/security-checkup', { replace: true, state: { walletAddress } })
  }, [connected, walletAddress, location.pathname, navigate])

  return null
}
