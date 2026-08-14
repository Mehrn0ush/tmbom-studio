import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages project site: https://mehrn0ush.github.io/tmbom-studio/
const base = process.env.GITHUB_PAGES === 'true' ? '/tmbom-studio/' : '/'

export default defineConfig({
  plugins: [react()],
  base,
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
