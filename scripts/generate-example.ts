import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSampleExportBom } from '../src/lib/sample.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const examplesDir = join(root, 'examples')
const publicDir = join(root, 'public', 'examples')
mkdirSync(examplesDir, { recursive: true })
mkdirSync(publicDir, { recursive: true })

const outPath = join(examplesDir, 'checkout-api.cdx.json')
writeFileSync(outPath, JSON.stringify(createSampleExportBom(), null, 2) + '\n')
copyFileSync(outPath, join(publicDir, 'checkout-api.cdx.json'))
console.log('Wrote', outPath)
console.log('Wrote', join(publicDir, 'checkout-api.cdx.json'))
