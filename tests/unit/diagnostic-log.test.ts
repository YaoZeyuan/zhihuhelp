import { describe, expect, it } from 'vitest'
import { sanitizeDiagnosticLogTail } from '../../src/shared/logging/diagnostic'

describe('诊断日志导出', () => {
  it('导出前重新脱敏旧 JSONL 和文本尾部', () => {
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
