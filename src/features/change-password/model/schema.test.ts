import { describe, it, expect } from 'vitest'
import { changePasswordSchema } from './schema'

describe('changePasswordSchema', () => {
  const base = {
    currentPassword: 'oldpass',
    newPassword: 'newpass',
    confirmPassword: 'newpass',
  }

  it('accepts a well-formed change', () => {
    expect(changePasswordSchema.safeParse(base).success).toBe(true)
  })

  it('rejects a confirmation that does not match', () => {
    const result = changePasswordSchema.safeParse({ ...base, confirmPassword: 'other' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['confirmPassword'])
  })

  it('rejects a new password identical to the current one', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'samepass',
      newPassword: 'samepass',
      confirmPassword: 'samepass',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['newPassword'])
  })

  it('rejects a new password shorter than the registration minimum', () => {
    expect(
      changePasswordSchema.safeParse({ ...base, newPassword: 'abc', confirmPassword: 'abc' }).success,
    ).toBe(false)
  })

  // An account created before any minimum existed must still be able to move off
  // a short password, so the current-password field carries no length floor.
  it('accepts a short current password', () => {
    expect(changePasswordSchema.safeParse({ ...base, currentPassword: 'ab' }).success).toBe(true)
  })

  it('requires the current password', () => {
    const result = changePasswordSchema.safeParse({ ...base, currentPassword: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Введите текущий пароль')
  })
})
