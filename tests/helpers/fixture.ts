import crypto from 'node:crypto'

export type FixtureEnvelope = {
  schemaVersion: 1
  sourceType: string
  sourceUrl?: string
  capturedAt: string
  checksum: string
  data: unknown
}

export function calculateFixtureChecksum(data: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
}

export function validateFixtureEnvelope(value: unknown): asserts value is FixtureEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('fixture must be an object')
  }
  const record = value as Record<string, unknown>
  if (record.schemaVersion !== 1) {
    throw new Error('fixture.schemaVersion must be 1')
  }
  if (typeof record.sourceType !== 'string' || record.sourceType.length === 0) {
    throw new Error('fixture.sourceType is required')
  }
  if (typeof record.capturedAt !== 'string' || Number.isNaN(Date.parse(record.capturedAt))) {
    throw new Error('fixture.capturedAt must be an ISO date')
  }
  if (typeof record.checksum !== 'string' || record.checksum !== calculateFixtureChecksum(record.data)) {
    throw new Error('fixture.checksum does not match fixture.data')
  }
}
