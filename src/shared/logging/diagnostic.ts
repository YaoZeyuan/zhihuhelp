import { sanitizeLogValue } from '~/src/shared/logging/log_contract'

export function sanitizeDiagnosticLogTail(content: string, maxLines = 800): string {
  return content
    .split('\n')
    .slice(-maxLines)
    .map((line) => {
      if (line.trim() === '') {
        return ''
      }
      try {
        return JSON.stringify(sanitizeLogValue(JSON.parse(line)))
      } catch {
        return String(sanitizeLogValue(line))
      }
    })
    .join('\n')
}
