import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Wi‑Fi/LAN IP for phone testing — skip WSL/Docker virtual adapters (172.x). */
function getLanIPv4() {
  const prefer = process.env.VITE_LAN_HOST
  if (prefer) return prefer

  for (const ifaces of Object.values(os.networkInterfaces())) {
    if (!ifaces) continue
    for (const iface of ifaces) {
      if (iface.family !== 'IPv4' || iface.internal) continue
      const { address } = iface
      if (address.startsWith('169.254.')) continue
      if (address.startsWith('192.168.') || address.startsWith('10.')) return address
    }
  }
  return undefined
}

const lanHost = getLanIPv4()

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      devOptions: { enabled: true, type: 'module' },
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-1024.png'],
      manifest: {
        name: 'Kaizen',
        short_name: 'Kaizen',
        description: 'Founder and builder progression system.',
        theme_color: '#070b1a',
        background_color: '#070b1a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    hmr: lanHost ? { host: lanHost, port: 5173, protocol: 'ws' } : true,
  },
})
