import { describe, expect, it } from 'vitest'
import { isAuthenticatedZhihuProfile } from '../../client/src/page/home/component/customer_task/library/login_check'

describe('知乎登录资料校验', () => {
  it('只接受具有稳定且非空身份字段的资料', () => {
    expect(isAuthenticatedZhihuProfile({ id: 'member-id' })).toBe(true)
    expect(isAuthenticatedZhihuProfile({ url_token: 'member-token' })).toBe(true)
    expect(isAuthenticatedZhihuProfile({ id: ' ', url_token: '' })).toBe(false)
  })

  it('不将空列表或 data 字段视为已登录', () => {
    expect(isAuthenticatedZhihuProfile({ data: [] })).toBe(false)
    expect(isAuthenticatedZhihuProfile([])).toBe(false)
    expect(isAuthenticatedZhihuProfile({})).toBe(false)
    expect(isAuthenticatedZhihuProfile(null)).toBe(false)
  })
})
