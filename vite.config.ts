import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'
import fs from 'node:fs'
import path from 'node:path'

// 自签名证书：用于 HTTPS Dev Server，使局域网手机能通过安全上下文访问摄像头
// 证书由 node scripts/gen-certs.mjs 生成（覆盖 localhost + 局域网 IP）
const certsDir = path.resolve(__dirname, '.certs')
const hasCerts = fs.existsSync(path.join(certsDir, 'cert.pem')) &&
  fs.existsSync(path.join(certsDir, 'key.pem'))

export default defineConfig({
  // GitHub Pages project site：资源前缀需带仓库名
  // vite-plugin-cesium 会据此自动拼接 Cesium 资源路径
  base: '/shan-jian/',
  plugins: [react(), cesium()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    cors: true,
    // HTTPS —— 仅当证书存在时启用；无证书则自然降级为 HTTP
    // （TypeScript 类型不接受 false，所以用条件展开 + as any 规避严格类型）
    ...(hasCerts
      ? {
          https: {
            cert: fs.readFileSync(path.join(certsDir, 'cert.pem')),
            key: fs.readFileSync(path.join(certsDir, 'key.pem'))
          }
        }
      : {})
  } as any
})
