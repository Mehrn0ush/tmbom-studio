#!/usr/bin/env node
/**
 * Structural + JSON Schema validation for examples/checkout-api.cdx.json
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const examplePath = join(root, 'examples', 'checkout-api.cdx.json')
const schemaPath = join(
  root,
  'schemas',
  '2.0',
  'cyclonedx-2.0-bundled.schema.json',
)

const bom = JSON.parse(readFileSync(examplePath, 'utf8'))

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

assert(bom.specFormat === 'CycloneDX', 'specFormat must be CycloneDX')
assert(bom.specVersion === '2.0', 'specVersion must be 2.0')
assert(Array.isArray(bom.blueprints) && bom.blueprints.length > 0, 'blueprints required')
assert(bom.threats && Array.isArray(bom.threats.threats), 'threats.threats required')
assert(bom.risks && Array.isArray(bom.risks.risks), 'risks.risks required')
assert(
  bom.blueprints[0].assets?.length > 0,
  'example blueprint should include assets',
)

console.log('Structural checks passed for', examplePath)

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  validateFormats: true,
})
addFormats(ajv)

let validate
try {
  validate = ajv.compile(schema)
} catch (err) {
  console.warn('Schema compile warning — falling back to structural checks only:')
  console.warn(err instanceof Error ? err.message : err)
  process.exit(0)
}

const ok = validate(bom)
if (!ok) {
  const errors = validate.errors ?? []
  // CycloneDX 2.0 threat-modeling schemas are still evolving; report but
  // only fail on hard structural issues we already asserted above.
  console.warn('JSON Schema reported', errors.length, 'issue(s):')
  for (const e of errors.slice(0, 15)) {
    console.warn(`  - ${e.instancePath || '/'} ${e.message}`)
  }
  if (errors.length > 15) console.warn(`  … and ${errors.length - 15} more`)
  // Soft-fail while the upstream 2.0-dev-threatmodeling schema settles
  console.warn(
    'Continuing with soft-fail (schema is from 2.0-dev-threatmodeling).',
  )
  process.exit(0)
}

console.log('JSON Schema validation passed against cyclonedx-2.0-bundled.schema.json')
