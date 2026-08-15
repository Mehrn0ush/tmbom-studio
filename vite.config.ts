import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages project site: https://mehrn0ush.github.io/tmbom-studio/
const base = process.env.GITHUB_PAGES === 'true' ? '/tmbom-studio/' : '/'

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
