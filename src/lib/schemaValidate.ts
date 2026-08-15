import Ajv2020, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import type { AnySchemaObject } from 'ajv'
import bundledSchema from '../../schemas/2.0/cyclonedx-2.0-bundled.schema.json'
import spdxSchema from '../../schemas/spdx.schema.json'
import cryptographyDefsSchema from '../../schemas/cryptography-defs.schema.json'

export type SchemaValidationError = { path: string; message: string }

export type SchemaValidationResult = {
  ok: boolean
  errors: SchemaValidationError[]
}

let validatorPromise: Promise<ValidateFunction | null> | null = null
let compileFailure: string | null = null

function mapErrors(errors: ErrorObject[] | null | undefined): SchemaValidationError[] {
  if (!errors?.length) return []
  return errors.map((e) => ({
    path: e.instancePath || '/',
    message: e.message ?? 'Validation error',
  }))
}

function registerExternalSchema(
  ajv: InstanceType<typeof Ajv2020>,
  schema: AnySchemaObject,
  extraIds: string[] = [],
): void {
  const clone: AnySchemaObject = { ...schema }
  delete clone.$schema
  const ids = [
    ...(typeof clone.$id === 'string' ? [clone.$id] : []),
    ...extraIds,
  ]
  if (typeof clone.$id === 'string' && clone.$id.startsWith('http://')) {
    ids.push(clone.$id.replace('http://', 'https://'))
  }
  const seen = new Set<string>()
  for (const id of ids) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    try {
      ajv.addSchema({ ...clone, $id: id })
    } catch {
      /* already registered */
    }
  }
}

async function buildValidator(): Promise<ValidateFunction | null> {
  compileFailure = null
  try {
    const ajv = new Ajv2020({
      allErrors: true,
      strict: false,
      validateFormats: true,
      validateSchema: false,
    })
    addFormats(ajv)

    for (const fmt of ['iri-reference', 'iri', 'idn-email', 'idn-hostname']) {
      if (!ajv.formats[fmt]) {
        ajv.addFormat(fmt, true)
      }
    }

    registerExternalSchema(ajv, spdxSchema as AnySchemaObject, [
      'https://cyclonedx.org/schema/spdx.schema.json',
      '../spdx.schema.json',
    ])
    registerExternalSchema(ajv, cryptographyDefsSchema as AnySchemaObject, [
      'https://cyclonedx.org/schema/cryptography-defs.schema.json',
      '../cryptography-defs.schema.json',
    ])

    // Upstream taxonomy file is not published yet; stub so compile can proceed
    registerExternalSchema(
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

    return ajv.compile(bundledSchema as AnySchemaObject)
  } catch (err) {
    compileFailure =
      err instanceof Error
        ? `Schema compile failure: ${err.message}`
        : 'Schema compile failure'
    return null
  }
}

function getValidator(): Promise<ValidateFunction | null> {
  if (!validatorPromise) {
    validatorPromise = buildValidator()
  }
  return validatorPromise
}

/** AJV 2020 validation against the CycloneDX 2.0 bundled schema. */
export async function validateBomSchema(
  raw: unknown,
): Promise<SchemaValidationResult> {
  const validate = await getValidator()
  if (!validate) {
    return {
      ok: false,
      errors: [
        {
          path: '/',
          message: compileFailure ?? 'Schema compile failure',
        },
      ],
    }
  }

  const ok = validate(raw)
  if (ok) return { ok: true, errors: [] }
  return { ok: false, errors: mapErrors(validate.errors) }
}
