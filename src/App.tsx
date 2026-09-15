import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { WalletProvider } from './components/WalletProvider'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { TokenDetail } from './pages/TokenDetail'
import { Submissions } from './pages/Submissions'
import { News } from './pages/News'
import { Admin } from './pages/Admin'

function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<TokenDetail />} />
            <Route path="token/:mintAddress" element={<TokenDetail />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="submissions" element={<Submissions />} />
            <Route path="news" element={<News />} />
            <Route path="admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#151929',
              color: '#fff',
              border: '1px solid #1a1f2e',
            },
            success: {
              iconTheme: {
                primary: '#84cc16',
                secondary: '#fff',
              },
            },
          }}
        />
      </WalletProvider>
    </BrowserRouter>
  )
}

export default App
