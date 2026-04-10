import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOURCE  = resolve(__dirname, '../../../imagens/logo 1.webp')
const OUT_DIR = resolve(__dirname, '../public')

mkdirSync(OUT_DIR, { recursive: true })

const icons = [
  { file: 'favicon-16x16.png',    size: 16  },
  { file: 'favicon-32x32.png',    size: 32  },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192x192.png',     size: 192 },
  { file: 'icon-512x512.png',     size: 512 },
]

for (const { file, size } of icons) {
  const out = resolve(OUT_DIR, file)
  await sharp(SOURCE)
    .resize(size, size, { fit: 'contain', background: { r: 10, g: 15, b: 10, alpha: 1 } })
    .png()
    .toFile(out)
  console.log(`✓ ${file} (${size}x${size})`)
}

console.log('\nDone! Ícones salvos em public/')
