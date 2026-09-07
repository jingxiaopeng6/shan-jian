import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cesium()],
  server: {
    // 绑定 0.0.0.0 使同一局域网下的手机可通过电脑 IP 访问开发服务器
    host: '0.0.0.0',
    port: 5173,
    // 允许局域网访问（Vite 默认允许，显式声明以明确意图）
    strictPort: false,
    cors: true
  }
})
