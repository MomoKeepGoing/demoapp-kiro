/**
 * Test helper utilities for property-based testing
 */

import { vi } from 'vitest'

/**
 * Property-based test configuration
 * All property tests should run at least 100 iterations
 */
export const PBT_CONFIG = {
  numRuns: 100,
}

/**
 * Mock Amplify Auth functions for testing
 */
export function mockAmplifyAuth() {
  return {
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    confirmSignUp: vi.fn(),
    resendSignUpCode: vi.fn(),
    resetPassword: vi.fn(),
    confirmResetPassword: vi.fn(),
    fetchAuthSession: vi.fn(),
  }
}

/**
 * Mock Amplify Data client for testing
 */
export function mockAmplifyDataClient() {
  return {
    models: {
      UserProfile: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
      },
    },
  }
}

/**
 * Mock Amplify Storage functions for testing
 */
export function mockAmplifyStorage() {
  return {
    uploadData: vi.fn(),
    getUrl: vi.fn(),
    remove: vi.fn(),
    list: vi.fn(),
  }
}

/**
 * Create a mock user object for testing
 */
export function createMockUser(overrides?: Partial<any>) {
  return {
    userId: 'test-user-id',
    username: 'testuser',
    signInDetails: {
      loginId: 'test@example.com',
    },
    ...overrides,
  }
}

/**
 * Create a mock user profile for testing
 */
export function createMockProfile(overrides?: Partial<any>) {
  return {
    id: 'profile-id',
    userId: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if a string is valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Check if a password meets security requirements
 * Requirements: At least 8 characters, contains uppercase, lowercase, number, and special character
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/[a-z]/.test(password)) return false
  if (!/[0-9]/.test(password)) return false
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false
  return true
}

/**
 * Check if a username is valid
 * Requirements: Non-empty after trimming, max 50 characters
 */
export function isValidUsername(username: string): boolean {
  const trimmed = username.trim()
  return trimmed.length > 0 && trimmed.length <= 50
}

/**
 * Check if a file is a valid image
 * Requirements: image/jpeg, image/png, image/gif, image/webp
 */
export function isValidImageType(type: string): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  return validTypes.includes(type)
}

/**
 * Check if a file size is within limits
 * Requirement: <= 5MB
 */
export function isValidFileSize(size: number): boolean {
  const maxSize = 5 * 1024 * 1024 // 5MB
  return size > 0 && size <= maxSize
}

/**
 * Simulate authorization error
 */
export function createAuthorizationError(context: 'profile' | 'storage') {
  if (context === 'profile') {
    return {
      errors: [
        {
          errorType: 'Unauthorized',
          message: 'Not authorized to access this resource',
        },
      ],
    }
  }
  return {
    name: 'AccessDeniedException',
    message: 'Access Denied',
  }
}

/**
 * Simulate validation error
 */
export function createValidationError(message: string) {
  return {
    errors: [
      {
        errorType: 'ValidationException',
        message,
      },
    ],
  }
}
