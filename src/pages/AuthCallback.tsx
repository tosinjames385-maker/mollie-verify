import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get('error')
      const errorDesc = searchParams.get('description')
      const success = searchParams.get('success')

      if (error) {
        if (error === 'access_denied') {
          toast.error('X sign-in was cancelled.')
        } else {
          toast.error(errorDesc || 'Authentication failed. Please try again.')
        }
        navigate('/', { replace: true })
        return
      }

      if (success === 'true') {
        const username = searchParams.get('username')
        await refreshUser()
        toast.success(`Welcome, @${username || 'user'}!`)
        navigate('/', { replace: true })
        return
      }

      navigate('/', { replace: true })
    }

    handleCallback()
  }, [searchParams, navigate, refreshUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1017]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#c7f284] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Completing sign-in...</p>
      </div>
    </div>
  )
}
