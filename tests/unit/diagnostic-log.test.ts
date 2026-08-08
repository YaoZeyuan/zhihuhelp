import { describe, expect, it } from 'vitest'
import { sanitizeDiagnosticLogTail } from '../../src/shared/logging/diagnostic'

describe('diagnostic log export', () => {
  it('re-sanitizes legacy JSONL and text tails before exporting them', () => {
    const content = [
      JSON.stringify({ message: 'old record', cookieContent: 'legacy-secret', responseData: { answer: 'private' } }),
      'request Cookie: d_c0=another-secret',
    ].join('\n')
    const result = sanitizeDiagnosticLogTail(content)

    expect(result).not.toContain('legacy-secret')
    expect(result).not.toContain('another-secret')
    expect(result).not.toContain('private')
    expect(result).toContain('[REDACTED]')
  })
})
