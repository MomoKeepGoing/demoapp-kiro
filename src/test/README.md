# Testing Documentation

This directory contains test utilities, generators, and property-based tests for the Amplify IM application.

## Testing Strategy

We use a dual testing approach:

1. **Unit Tests**: Verify specific examples, edge cases, and error conditions
2. **Property-Based Tests (PBT)**: Verify universal properties that should hold across all inputs

## Property-Based Testing

Property-based testing uses the `fast-check` library to generate random test data and verify that properties hold across many iterations.

### Configuration

All property-based tests run **100 iterations** minimum, as specified in `helpers.ts`:

```typescript
export const PBT_CONFIG = {
  numRuns: 100,
}
```

### Test Annotation Format

Each property-based test MUST be annotated with a comment linking it to the design document:

```typescript
// **Feature: amplify-im-app, Property X: Property Name**
it('Property X: description', () => {
  // test implementation
})
```

### Available Generators

The `generators.ts` file provides arbitraries for generating test data:

- `emailArbitrary` - Valid email addresses
- `validPasswordArbitrary` - Passwords meeting security requirements
- `invalidPasswordArbitrary` - Passwords that don't meet requirements
- `verificationCodeArbitrary` - 6-digit verification codes
- `validUsernameArbitrary` - Valid usernames (1-50 chars, non-whitespace)
- `whitespaceUsernameArbitrary` - Whitespace-only strings
- `validImageFileArbitrary` - Valid image file metadata
- `invalidImageFileArbitrary` - Invalid file metadata
- `userProfileArbitrary` - Complete user profile objects
- `mockFileArbitrary` - Mock File objects for testing

### Helper Functions

The `helpers.ts` file provides utilities for testing:

- `PBT_CONFIG` - Configuration for property tests (100 iterations)
- `mockAmplifyAuth()` - Mock Amplify Auth functions
- `mockAmplifyDataClient()` - Mock Amplify Data client
- `mockAmplifyStorage()` - Mock Amplify Storage functions
- `createMockUser()` - Create mock user objects
- `createMockProfile()` - Create mock profile objects
- Validation functions: `isValidEmail`, `isValidPassword`, `isValidUsername`, etc.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest'

describe('MyComponent', () => {
  it('should handle specific case', () => {
    // Test specific behavior
    expect(result).toBe(expected)
  })
})
```

### Property-Based Test Example

```typescript
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { PBT_CONFIG } from './helpers'
import { emailArbitrary } from './generators'

describe('Email Validation', () => {
  // **Feature: amplify-im-app, Property 1: Valid emails are accepted**
  it('Property 1: should accept all valid emails', () => {
    fc.assert(
      fc.property(emailArbitrary, (email) => {
        expect(isValidEmail(email)).toBe(true)
      }),
      PBT_CONFIG
    )
  })
})
```

## Test Coverage Goals

- **Unit Tests**: Cover specific examples, edge cases, and error conditions
- **Property Tests**: Cover general correctness properties across all inputs
- **Integration Tests**: Verify multi-component interactions
- **E2E Tests**: Verify complete user flows

## Best Practices

1. Always use `PBT_CONFIG` for property tests to ensure 100 iterations
2. Annotate property tests with the design document reference
3. Use generators from `generators.ts` for consistent test data
4. Keep tests focused and minimal - avoid over-testing
5. Test real functionality, not mocks
6. Write descriptive test names that explain what is being tested
