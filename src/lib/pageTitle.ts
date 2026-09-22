const SITE_NAME = 'VRFD'

export function formatDocumentTitle(page: string): string {
  return `${page} | ${SITE_NAME}`
}

/** Browser tab title per route (matches verified.jup.ag style). */
export function titleForPath(pathname: string): string {
  if (pathname.startsWith('/submissions')) return formatDocumentTitle('Browse Tokens')
  if (pathname.startsWith('/token/')) return formatDocumentTitle('Token')
  if (pathname.startsWith('/leaderboard')) return formatDocumentTitle('Leaderboard')
  if (pathname.startsWith('/media')) return formatDocumentTitle('Media')
  if (pathname.startsWith('/faq')) return formatDocumentTitle('FAQ')
  if (pathname.startsWith('/apis')) return formatDocumentTitle('APIs')
  if (pathname.startsWith('/profile/')) return formatDocumentTitle('Profile')
  if (pathname.startsWith('/admin')) return formatDocumentTitle('Admin')
  if (pathname.startsWith('/auth/')) return formatDocumentTitle('Sign in')
  return formatDocumentTitle('Browse Tokens')
}
