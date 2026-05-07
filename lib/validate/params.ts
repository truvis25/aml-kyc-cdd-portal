/** Typed error for input validation failures — maps to HTTP 400 at the API boundary. */
export class ValidationError extends Error {
  readonly paramName: string
  constructor(paramName: string, message: string) {
    super(message)
    this.name = 'ValidationError'
    this.paramName = paramName
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https?:\/\/.+/i

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

export function assertUuid(value: unknown, paramName = 'id'): string {
  if (!isUuid(value)) {
    throw new ValidationError(paramName, `Invalid ${paramName}: expected a UUID`)
  }
  return value
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function assertNonEmptyString(value: unknown, paramName: string, maxLength = 2048): string {
  if (!isNonEmptyString(value)) {
    throw new ValidationError(paramName, `Invalid ${paramName}: expected a non-empty string`)
  }
  const trimmed = (value as string).trim()
  if (trimmed.length > maxLength) {
    throw new ValidationError(paramName, `Invalid ${paramName}: exceeds max length of ${maxLength}`)
  }
  return trimmed
}

export function isEmail(value: unknown): value is string {
  return typeof value === 'string' && EMAIL_RE.test(value) && value.length <= 254
}

export function assertEmail(value: unknown, paramName = 'email'): string {
  if (!isEmail(value)) {
    throw new ValidationError(paramName, `Invalid ${paramName}: expected a valid email address`)
  }
  return (value as string).toLowerCase().trim()
}

export function isUrl(value: unknown, allowedOrigins?: string[]): value is string {
  if (typeof value !== 'string' || !URL_RE.test(value)) return false
  if (allowedOrigins) {
    try {
      const { origin } = new URL(value)
      return allowedOrigins.includes(origin)
    } catch {
      return false
    }
  }
  return true
}

/** Assert a URL is valid. Pass `allowedOrigins` to prevent SSRF on webhook/redirect inputs. */
export function assertUrl(value: unknown, paramName: string, allowedOrigins?: string[]): string {
  if (!isUrl(value, allowedOrigins)) {
    throw new ValidationError(
      paramName,
      `Invalid ${paramName}: expected a valid http(s) URL${allowedOrigins ? ` from ${allowedOrigins.join(', ')}` : ''}`,
    )
  }
  return value as string
}

export function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

/** Parse a string or number into a positive integer, or throw. */
export function parsePositiveInt(value: unknown, paramName: string): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : Number(value)
  if (!isPositiveInt(n) || String(n) !== String(value).trim()) {
    throw new ValidationError(paramName, `Invalid ${paramName}: expected a positive integer`)
  }
  return n
}
