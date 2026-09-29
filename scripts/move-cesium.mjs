/**
 * postbuild：修正 vite-plugin-cesium 在 base != '/' 时的资源路径
 *
 * 背景：vite-plugin-cesium 会将 Cesium 静态资源复制到 ${outDir}/${base}cesium/，
 * 即 dist/shan-jian/cesium/。但 GitHub Pages 把 dist 部署到 /shan-jian/，
 * 导致实际访问路径变成 /shan-jian/shan-jian/cesium/，与 HTML 中注入的
 * /shan-jian/cesium/ 不匹配。
 *
 * 修复：构建后将 dist/shan-jian/cesium 移动到 dist/cesium。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '..', 'dist')

const src = path.join(distDir, 'shan-jian', 'cesium')
const dest = path.join(distDir, 'cesium')

if (fs.existsSync(src)) {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true })
  }
  fs.renameSync(src, dest)

  // 清理可能变空的 shan-jian 目录
  const shanJianDir = path.join(distDir, 'shan-jian')
  if (fs.existsSync(shanJianDir) && fs.readdirSync(shanJianDir).length === 0) {
    fs.rmdirSync(shanJianDir)
  }

  console.log('[postbuild] Cesium assets moved to dist/cesium/')
} else {
  console.log('[postbuild] dist/shan-jian/cesium not found, skip')
}
