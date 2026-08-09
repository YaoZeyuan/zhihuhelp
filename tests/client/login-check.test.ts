import { describe, expect, it } from 'vitest'
import { isAuthenticatedZhihuProfile } from '../../client/src/page/home/component/customer_task/library/login_check'

describe('Zhihu login profile validation', () => {
  it('accepts only a profile with a stable non-empty identity field', () => {
    expect(isAuthenticatedZhihuProfile({ id: 'member-id' })).toBe(true)
    expect(isAuthenticatedZhihuProfile({ url_token: 'member-token' })).toBe(true)
    expect(isAuthenticatedZhihuProfile({ id: ' ', url_token: '' })).toBe(false)
  })

  it('does not treat an empty list or a data field as authenticated', () => {
    expect(isAuthenticatedZhihuProfile({ data: [] })).toBe(false)
    expect(isAuthenticatedZhihuProfile([])).toBe(false)
    expect(isAuthenticatedZhihuProfile({})).toBe(false)
    expect(isAuthenticatedZhihuProfile(null)).toBe(false)
  })
})
