import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Thư mục "Web thue xe/" là code v0.1 đã đóng băng — loại khỏi dự án mới.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
      '@contracts': path.resolve(process.cwd(), 'contracts'),
    },
  },
  server: { port: 5173, host: true },
})
