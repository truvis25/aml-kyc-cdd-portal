import { FORBIDDEN_FIELD_SET } from './constants'

/**
 * Template for a per-model privacy-strip function.
 *
 * Copy this file, rename `ExampleModel` → your model name (e.g. `User`,
 * `Enquiry`, `Order`), and replace the `Pick` type with the actual fields
 * your API consumers need.
 *
 * The `stripForbidden` helper is a safety net — the explicit `Pick` type
 * is the primary guard. Use both.
 */

// ---- Replace with your Prisma-generated model type ----
interface ExampleModel {
  id: string
  name: string
  email: string
  // internal fields that must not leak:
  password_hash?: string
  internal_notes?: string
  [key: string]: unknown
}

// ---- Replace with the fields safe for public consumption ----
type PublicExampleModel = Pick<ExampleModel, 'id' | 'name' | 'email'>

export function toPublicExampleModel(model: ExampleModel): PublicExampleModel {
  return stripForbidden({
    id: model.id,
    name: model.name,
    email: model.email,
  }) as PublicExampleModel
}

// ---- Keep this file as a template; copy + rename for each new model ----

function stripForbidden(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (FORBIDDEN_FIELD_SET.has(key)) continue
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = stripForbidden(val as Record<string, unknown>)
    } else {
      result[key] = val
    }
  }
  return result
}
