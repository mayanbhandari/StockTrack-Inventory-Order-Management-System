import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // React plugin enables JSX and fast refresh.
  plugins: [react()],
  server: {
    // Host 0.0.0.0 works inside Docker and local networks.
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    // Preview uses a separate port from the dev server.
    host: '0.0.0.0',
    port: 4173,
  },
})
