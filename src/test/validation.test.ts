/**
 * Property-based tests for validation functions
 * These tests verify that validation logic works correctly across many random inputs
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidImageType,
  isValidFileSize,
  PBT_CONFIG,
} from './helpers'
import {
  emailArbitrary,
  validPasswordArbitrary,
  invalidPasswordArbitrary,
  validUsernameArbitrary,
  whitespaceUsernameArbitrary,
  validImageFileArbitrary,
  invalidImageFileArbitrary,
} from './generators'

describe('Validation Property Tests', () => {
  describe('Email Validation', () => {
    it('should accept all generated valid emails', () => {
      fc.assert(
        fc.property(emailArbitrary, (email) => {
          expect(isValidEmail(email)).toBe(true)
        }),
        PBT_CONFIG
      )
    })

    it('should reject emails without @ symbol', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !s.includes('@')),
          (invalidEmail) => {
            expect(isValidEmail(invalidEmail)).toBe(false)
          }
        ),
        PBT_CONFIG
      )
    })
  })

  describe('Password Validation', () => {
    // **Feature: amplify-im-app, Property 2: 无效密码被拒绝**
    it('Property 2: should accept all valid passwords', () => {
      fc.assert(
        fc.property(validPasswordArbitrary, (password) => {
          expect(isValidPassword(password)).toBe(true)
        }),
        PBT_CONFIG
      )
    })

    // **Feature: amplify-im-app, Property 2: 无效密码被拒绝**
    it('Property 2: should reject all invalid passwords', () => {
      fc.assert(
        fc.property(invalidPasswordArbitrary, (password) => {
          expect(isValidPassword(password)).toBe(false)
        }),
        PBT_CONFIG
      )
    })
  })

  describe('Username Validation', () => {
    // **Feature: amplify-im-app, Property 11: 空白用户名被拒绝**
    it('Property 11: should accept all valid usernames', () => {
      fc.assert(
        fc.property(validUsernameArbitrary, (username) => {
          expect(isValidUsername(username)).toBe(true)
        }),
        PBT_CONFIG
      )
    })

    // **Feature: amplify-im-app, Property 11: 空白用户名被拒绝**
    it('Property 11: should reject all whitespace-only usernames', () => {
      fc.assert(
        fc.property(whitespaceUsernameArbitrary, (username) => {
          expect(isValidUsername(username)).toBe(false)
        }),
        PBT_CONFIG
      )
    })

    it('should reject usernames longer than 50 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 51, maxLength: 100 }),
          (longUsername) => {
            expect(isValidUsername(longUsername)).toBe(false)
          }
        ),
        PBT_CONFIG
      )
    })
  })

  describe('Image File Validation', () => {
    // **Feature: amplify-im-app, Property 12: 非图片文件被拒绝**
    it('Property 12: should accept all valid image types', () => {
      fc.assert(
        fc.property(validImageFileArbitrary, (fileMetadata) => {
          expect(isValidImageType(fileMetadata.type)).toBe(true)
          expect(isValidFileSize(fileMetadata.size)).toBe(true)
        }),
        PBT_CONFIG
      )
    })

    // **Feature: amplify-im-app, Property 12: 非图片文件被拒绝**
    it('Property 12: should reject invalid file types or sizes', () => {
      fc.assert(
        fc.property(invalidImageFileArbitrary, (fileMetadata) => {
          const validType = isValidImageType(fileMetadata.type)
          const validSize = isValidFileSize(fileMetadata.size)
          // At least one should be invalid
          expect(validType && validSize).toBe(false)
        }),
        PBT_CONFIG
      )
    })

    it('should reject files larger than 5MB', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5 * 1024 * 1024 + 1, max: 10 * 1024 * 1024 }),
          (largeSize) => {
            expect(isValidFileSize(largeSize)).toBe(false)
          }
        ),
        PBT_CONFIG
      )
    })
  })
})
