// 自签名证书生成脚本（用于 Vite HTTPS Dev Server）
// 覆盖 localhost + 局域网 IP，供手机同一 Wi-Fi 下访问摄像头
// 运行：node scripts/gen-certs.mjs
import { generate } from 'selfsigned'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '..', '.certs')
fs.mkdirSync(outDir, { recursive: true })

// 你的局域网 IP（换网络时改这里）
const LAN_IP = '10.253.13.225'

const attrs = [{ name: 'commonName', value: 'shanjian.local' }]
const options = {
  days: 365,
  keySize: 2048,
  algorithm: 'sha256',
  extensions: [
    {
      name: 'subjectAltName',
      critical: true,
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' },
        { type: 2, value: LAN_IP },
        { type: 7, ip: LAN_IP }
      ]
    },
    { name: 'keyUsage', critical: true, digitalSignature: true, keyEncipherment: true },
    { name: 'extKeyUsage', serverAuth: true }
  ]
}

const { private: key, cert } = await generate(attrs, options)
fs.writeFileSync(path.join(outDir, 'key.pem'), key)
fs.writeFileSync(path.join(outDir, 'cert.pem'), cert)
console.log(`✅ 证书已生成 → ${path.join(outDir, 'cert.pem')}`)
console.log(`   覆盖地址: localhost, 127.0.0.1, ${LAN_IP}`)
