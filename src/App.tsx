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
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminUsers } from './pages/admin/Users'
import { AdminXAccounts } from './pages/admin/XAccounts'
import { AdminSubmissions } from './pages/admin/Submissions'
import { AdminActivity } from './pages/admin/Activity'
import { AdminSettings } from './pages/admin/Settings'
import { AuthCallback } from './pages/AuthCallback'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <Routes>
            <Route path="/auth/x/callback" element={<AuthCallback />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="x-accounts" element={<AdminXAccounts />} />
              <Route path="submissions" element={<AdminSubmissions />} />
              <Route path="activity" element={<AdminActivity />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Main app routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/submissions" replace />} />
              <Route path="token/:mintAddress" element={<TokenDetail />} />
              <Route path="submissions/:submissionId?" element={<Submissions />} />
              <Route path="apis" element={<APIs />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="media" element={<Media />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="profile/:username" element={<Profile />} />
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
