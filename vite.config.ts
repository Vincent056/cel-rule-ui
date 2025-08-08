import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure environment variables are loaded
  envDir: '.',
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Allow the dev server to accept connections from Docker network
    strictPort: true,
  },
  // Define environment variables that should be exposed
  define: {
    'import.meta.env.VITE_RPC_BASE_URL': JSON.stringify(process.env.VITE_RPC_BASE_URL || 'http://localhost:8349'),
    'import.meta.env.VITE_CEL_RPC_ENDPOINT': JSON.stringify(process.env.VITE_CEL_RPC_ENDPOINT || '/mcp'),
  }
})
