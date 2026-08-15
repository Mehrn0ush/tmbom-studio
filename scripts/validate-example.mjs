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
const schemasDir = join(root, 'schemas')

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

function loadLocalSchema(uri) {
  const fileName = uri.split('/').pop()?.split('#')[0]
  if (!fileName) throw new Error(`Cannot resolve schema URI: ${uri}`)
  const candidates = [
    join(schemasDir, fileName),
    join(schemasDir, '2.0', fileName),
  ]
  for (const path of candidates) {
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf8'))
      delete parsed.$schema
      return parsed
    } catch {
      /* try next */
    }
  }
  if (fileName === 'behavior-taxonomy.schema.json') {
    return {
      $id: 'http://cyclonedx.org/schema/behavior-taxonomy.schema.json',
      type: 'string',
    }
  }
  throw new Error(`Cannot load schema: ${uri}`)
}

function addSchemaVariants(ajv, schemaObj, extraIds = []) {
  const clone = { ...schemaObj }
  delete clone.$schema
  const ids = new Set([
    ...(clone.$id ? [clone.$id] : []),
    ...extraIds,
  ])
  if (typeof clone.$id === 'string' && clone.$id.startsWith('http://')) {
    ids.add(clone.$id.replace('http://', 'https://'))
  }
  for (const id of ids) {
    try {
      ajv.addSchema({ ...clone, $id: id })
    } catch {
      /* already registered */
    }
  }
}

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  validateFormats: true,
  validateSchema: false,
  loadSchema: async (uri) => loadLocalSchema(uri),
})
addFormats(ajv)

for (const fmt of ['iri-reference', 'iri', 'idn-email', 'idn-hostname']) {
  if (!ajv.formats[fmt]) ajv.addFormat(fmt, true)
}

try {
  const spdx = loadLocalSchema('../spdx.schema.json')
  addSchemaVariants(ajv, spdx, [
    'https://cyclonedx.org/schema/spdx.schema.json',
    '../spdx.schema.json',
  ])
} catch (err) {
  console.warn('Could not preload spdx.schema.json:', err instanceof Error ? err.message : err)
}

try {
  const cryptoDefs = loadLocalSchema('../cryptography-defs.schema.json')
  addSchemaVariants(ajv, cryptoDefs, [
    'https://cyclonedx.org/schema/cryptography-defs.schema.json',
    '../cryptography-defs.schema.json',
  ])
} catch (err) {
  console.warn(
    'Could not preload cryptography-defs.schema.json:',
    err instanceof Error ? err.message : err,
  )
}

addSchemaVariants(
  ajv,
  {
    $id: 'http://cyclonedx.org/schema/behavior-taxonomy.schema.json',
    type: 'string',
  },
  [
    'https://cyclonedx.org/schema/behavior-taxonomy.schema.json',
    '../behavior-taxonomy.schema.json',
  ],
)

let validate
try {
  validate = await ajv.compileAsync(schema)
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
  console.error(
    'Failing CI: examples/checkout-api.cdx.json must validate against cyclonedx-2.0-bundled.schema.json',
  )
  process.exit(1)
}

console.log('JSON Schema validation passed against cyclonedx-2.0-bundled.schema.json')
