/**
 * QA assertion helpers used by the QA Engineer agent's adversarial test scripts.
 *
 * All helpers throw with a descriptive message on failure so the test runner
 * (tsx) exits non-zero, making QA_BLOCKED automatic.
 */

import { FORBIDDEN_FIELD_SET } from '@/lib/public/constants'

/** Assert that `condition` is true, otherwise throw with `message`. */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`)
}

/** Assert deep equality using JSON serialisation. */
export function assertEqual<T>(actual: T, expected: T, label = ''): void {
  const a = JSON.stringify(actual)
  const b = JSON.stringify(expected)
  if (a !== b) {
    throw new Error(
      `ASSERT_EQUAL${label ? ` [${label}]` : ''}: expected\n  ${b}\ngot\n  ${a}`,
    )
  }
}

/** Assert that `obj` contains none of the fields in FORBIDDEN_FIELD_SET. */
export function assertNoForbiddenFields(obj: unknown, label = ''): void {
  if (obj == null || typeof obj !== 'object') return
  const record = obj as Record<string, unknown>
  const found: string[] = []
  for (const key of Object.keys(record)) {
    if (FORBIDDEN_FIELD_SET.has(key)) found.push(key)
    if (typeof record[key] === 'object') {
      assertNoForbiddenFields(record[key], `${label}.${key}`)
    }
  }
  if (found.length > 0) {
    throw new Error(
      `FORBIDDEN_FIELDS_LEAKED${label ? ` in ${label}` : ''}: ${found.join(', ')}`,
    )
  }
}

/** Assert that a Response has the given HTTP status. */
export async function assertStatus(
  res: Response,
  expected: number,
  label = '',
): Promise<void> {
  if (res.status !== expected) {
    const body = await res.text().catch(() => '')
    throw new Error(
      `ASSERT_STATUS${label ? ` [${label}]` : ''}: expected ${expected}, got ${res.status}. Body: ${body.slice(0, 200)}`,
    )
  }
}

/** Assert that a Response body JSON matches the given shape (subset check). */
export async function assertResponseShape(
  res: Response,
  expectedShape: Record<string, unknown>,
  label = '',
): Promise<void> {
  let json: unknown
  try {
    json = await res.json()
  } catch {
    const body = await res.text().catch(() => '')
    throw new Error(
      `ASSERT_SHAPE${label ? ` [${label}]` : ''}: response is not valid JSON ` +
      `(status ${res.status}, content-type: ${res.headers.get('content-type')}). ` +
      `Body preview: ${body.slice(0, 200)}`,
    )
  }
  const jsonRecord = json as Record<string, unknown>
  for (const [key, val] of Object.entries(expectedShape)) {
    if (!(key in jsonRecord)) {
      throw new Error(
        `ASSERT_SHAPE${label ? ` [${label}]` : ''}: missing key "${key}" in response`,
      )
    }
    if (val !== undefined && JSON.stringify(jsonRecord[key]) !== JSON.stringify(val)) {
      throw new Error(
        `ASSERT_SHAPE${label ? ` [${label}]` : ''}: key "${key}" — expected ${JSON.stringify(val)}, got ${JSON.stringify(jsonRecord[key])}`,
      )
    }
  }
  assertNoForbiddenFields(jsonRecord, label)
}

/** Print a green PASS line — purely cosmetic. */
export function pass(label: string): void {
  console.log(`  PASS  ${label}`)
}

/** Print a yellow SKIP line — for manual-only scenarios. */
export function skip(label: string, reason: string): void {
  console.log(`  SKIP  ${label} — ${reason}`)
}
