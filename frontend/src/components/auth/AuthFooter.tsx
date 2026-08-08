// ============================================================
// AuthFooter — Bottom link navigation for Auth pages
// ============================================================

import { Link } from 'react-router-dom'

export function AuthFooter({
  promptText,
  linkText,
  href,
}: {
  promptText: string
  linkText: string
  href: string
}) {
  return (
    <p className="text-xs text-text-muted text-center pt-4">
      {promptText}{' '}
      <Link to={href} className="text-accent-green font-semibold hover:underline">
        {linkText}
      </Link>
    </p>
  )
}
