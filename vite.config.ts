import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Custom domain (tms.silastron.com) is served from the gh-pages root.
 * A /tmbom-studio/ prefix 404s there and leaves a blank page.
 * github.io/tmbom-studio/ redirects to the custom domain when CNAME is set.
 */
const base = '/'

/** Production CSP via meta (GH Pages cannot set response headers easily). */
function cspMetaPlugin(): Plugin {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "worker-src 'self' blob:",
  ].join('; ')

  return {
    name: 'inject-csp-meta',
    transformIndexHtml(html, ctx) {
      if (ctx.server) return html
      if (html.includes('Content-Security-Policy')) return html
      return html.replace(
        /<head>/i,
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), cspMetaPlugin()],
  base,
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
