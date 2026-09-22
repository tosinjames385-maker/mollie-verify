import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { titleForPath } from '../lib/pageTitle'

export function DocumentTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = titleForPath(pathname)
  }, [pathname])

  return null
}
