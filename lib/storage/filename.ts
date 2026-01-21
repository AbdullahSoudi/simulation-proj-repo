const MAX_LEN = 120
const SAFE_CHARS = /[^a-zA-Z0-9._-]+/g

export function sanitizeFilename(name: string): string {
  const base = name || 'document'
  const noPath = base.replace(/[\\/]/g, '')
  const trimmed = noPath.trim().replace(/\s+/g, '_')
  const cleaned = trimmed.replace(SAFE_CHARS, '')
  if (cleaned.length === 0) return 'document'
  if (cleaned.length <= MAX_LEN) return cleaned
  return cleaned.slice(0, MAX_LEN)
}

