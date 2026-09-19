import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const errorParam = searchParams.get('error')
      const errorDescParam = searchParams.get('error_description') || searchParams.get('description')

      if (errorParam) {
        if (errorParam === 'access_denied') {
          toast.error('X sign-in was cancelled.')
        } else {
          toast.error(errorDescParam || 'Authentication failed. Please try again.')
        }
        navigate('/', { replace: true })
        return
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          toast.error(error.message || 'Authentication error')
          navigate('/', { replace: true })
          return
        }

        if (session?.user) {
          await refreshUser()
          const meta = session.user.user_metadata || {}
          const name = meta.user_name || meta.preferred_username || meta.name || 'user'
          toast.success(`Welcome, @${name}!`)
        } else {
          await refreshUser()
        }
      } catch (err: any) {
        toast.error(err?.message || 'Authentication callback error')
      } finally {
        navigate('/', { replace: true })
      }
    }

    handleCallback()
  }, [searchParams, navigate, refreshUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1017]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#c7f284] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Completing sign-in with X...</p>
      </div>
    </div>
  )
}
