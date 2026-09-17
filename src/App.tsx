import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { WalletProvider } from './components/WalletProvider'
import { AuthProvider } from './context/AuthContext'
import { AuthModal } from './components/AuthModal'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { TokenDetail } from './pages/TokenDetail'
import { Submissions } from './pages/Submissions'
import { APIs } from './pages/APIs'
import { FAQ } from './pages/FAQ'
import { Media } from './pages/Media'
import { Leaderboard } from './pages/Leaderboard'
import { Profile } from './pages/Profile'
import { Admin } from './pages/Admin'
import { AuthCallback } from './pages/AuthCallback'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <Routes>
            <Route path="/auth/x/callback" element={<AuthCallback />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/submissions" replace />} />
              <Route path="token/:mintAddress" element={<TokenDetail />} />
              <Route path="submissions" element={<Submissions />} />
              <Route path="apis" element={<APIs />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="media" element={<Media />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="profile/:username" element={<Profile />} />
              <Route path="admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          <AuthModal />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#0A1017',
                color: '#fff',
                border: '1px solid #1C2838',
              },
              success: {
                iconTheme: {
                  primary: '#B7F34A',
                  secondary: '#000',
                },
              },
            }}
          />
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App