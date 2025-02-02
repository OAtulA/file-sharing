import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    DOMAIN: JSON.stringify(process.env.VITE_DOMAIN_NAME)
  }
})
