/**
 * Property-based testing data generators using fast-check
 * These generators create random test data for property tests
 */

import * as fc from 'fast-check'

/**
 * Generate valid email addresses
 * Used for testing registration and login flows
 */
export const emailArbitrary = fc.emailAddress()

/**
 * Generate valid passwords that meet security requirements
 * Requirements: At least 8 characters, contains uppercase, lowercase, number, and special character
 */
export const validPasswordArbitrary = fc
  .tuple(
    fc.stringMatching(/[A-Z]/), // At least one uppercase
    fc.stringMatching(/[a-z]/), // At least one lowercase
    fc.stringMatching(/[0-9]/), // At least one number
    fc.stringMatching(/[!@#$%^&*(),.?":{}|<>]/), // At least one special char
    fc.string({ minLength: 4, maxLength: 20 }) // Additional characters
  )
  .map(([upper, lower, num, special, rest]) => {
    // Shuffle all characters together
    const combined = (upper + lower + num + special + rest).split('')
    return combined.sort(() => Math.random() - 0.5).join('')
  })

/**
 * Generate invalid passwords (don't meet security requirements)
 * Used for testing password validation
 */
export const invalidPasswordArbitrary = fc.oneof(
  fc.string({ maxLength: 7 }), // Too short
  fc.stringMatching(/^[a-z]+$/), // Only lowercase
  fc.stringMatching(/^[A-Z]+$/), // Only uppercase
  fc.stringMatching(/^[0-9]+$/), // Only numbers
  fc.string({ minLength: 8 }).filter(s => !/[A-Z]/.test(s)), // No uppercase
  fc.string({ minLength: 8 }).filter(s => !/[a-z]/.test(s)), // No lowercase
  fc.string({ minLength: 8 }).filter(s => !/[0-9]/.test(s)), // No numbers
  fc.string({ minLength: 8 }).filter(s => !/[!@#$%^&*(),.?":{}|<>]/.test(s)) // No special chars
)

/**
 * Generate valid verification codes (6 digits)
 * Used for testing email verification flow
 */
export const verificationCodeArbitrary = fc
  .integer({ min: 0, max: 999999 })
  .map(n => n.toString().padStart(6, '0'))

/**
 * Generate invalid verification codes
 * Used for testing verification code validation
 */
export const invalidVerificationCodeArbitrary = fc.oneof(
  fc.string({ minLength: 1, maxLength: 5 }), // Too short
  fc.string({ minLength: 7 }), // Too long
  fc.stringMatching(/[a-zA-Z]+/), // Contains letters
  fc.constant('') // Empty
)

/**
 * Generate valid usernames
 * Requirements: Non-empty after trimming, max 50 characters
 */
export const validUsernameArbitrary = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0)

/**
 * Generate invalid usernames (whitespace only)
 * Requirement 3.4: Empty or whitespace-only usernames should be rejected
 */
export const whitespaceUsernameArbitrary = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 20 })
  .map(chars => chars.join(''))

/**
 * Generate valid image file metadata
 * Requirements: image/jpeg, image/png, image/gif, image/webp, <= 5MB
 */
export const validImageFileArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`),
  type: fc.constantFrom('image/jpeg', 'image/png', 'image/gif', 'image/webp'),
  size: fc.integer({ min: 1, max: 5 * 1024 * 1024 }), // Up to 5MB
})

/**
 * Generate invalid image files (wrong type or too large)
 * Used for testing file validation
 */
export const invalidImageFileArbitrary = fc.oneof(
  // Wrong file type
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.pdf`),
    type: fc.constantFrom('application/pdf', 'text/plain', 'video/mp4'),
    size: fc.integer({ min: 1, max: 1024 * 1024 }),
  }),
  // File too large
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`),
    type: fc.constantFrom('image/jpeg', 'image/png'),
    size: fc.integer({ min: 5 * 1024 * 1024 + 1, max: 10 * 1024 * 1024 }), // Over 5MB
  })
)

/**
 * Generate user profile data
 */
export const userProfileArbitrary = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  username: validUsernameArbitrary,
  email: emailArbitrary,
  avatarUrl: fc.option(fc.webUrl(), { nil: undefined }),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.date().map(d => d.toISOString()),
})

/**
 * Generate mock File objects for testing
 * This creates a File-like object that can be used in tests
 */
export function createMockFile(
  name: string,
  type: string,
  size: number,
  content?: string
): File {
  const blob = new Blob([content || 'mock file content'], { type })
  const file = new File([blob], name, { type })
  
  // Override size property for testing
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  })
  
  return file
}

/**
 * Arbitrary for creating mock File objects
 */
export const mockFileArbitrary = validImageFileArbitrary.map(({ name, type, size }) =>
  createMockFile(name, type, size)
)

/**
 * Arbitrary for creating invalid mock File objects
 */
export const invalidMockFileArbitrary = invalidImageFileArbitrary.map(({ name, type, size }) =>
  createMockFile(name, type, size)
)
