import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './', // 推荐：这样打包出的资源路径是相对的
  plugins: [vue()],
  server: {
    port: 9898, // 前端开发端口
    proxy: {
      '/api': {
        target: 'http://localhost:9090', // 后端端口
        changeOrigin: true
      }
    }
  }
})