import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// Vite 8 uses rolldown which handles JSX natively — no @vitejs/plugin-react needed
export default defineConfig({
  plugins: [tailwindcss()],
})
