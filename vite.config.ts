import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Live VBL refresh in `npm run dev` (CORS also allows direct browser fetch).
      '/api/vbl': {
        target: 'https://vblcb.wisseq.eu',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/vbl/, '/VBLCB_WebService/data'),
      },
    },
  },
})
