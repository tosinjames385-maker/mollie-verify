import React from 'react'
import { ConnectWalletSidebar } from './ConnectWalletSidebar'

interface ConnectWalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({ isOpen, onClose }) => {
  return <ConnectWalletSidebar isOpen={isOpen} onClose={onClose} />
}
