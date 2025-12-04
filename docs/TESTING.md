# Testing Guide

This document describes the testing strategy and configuration for the Amplify IM application.

## Overview

The application uses a comprehensive testing approach combining unit tests and property-based tests to ensure correctness and reliability.

## Testing Framework

### Tools

- **Vitest**: Fast unit test framework (Vite-native)
- **fast-check**: Property-based testing library
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom matchers for DOM assertions

### Configuration

**File**: `vitest.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Test setup and configuration
│   ├── generators.ts         # Property-based test data generators
│   ├── helpers.ts            # Test utilities and helpers
│   ├── validation.test.ts    # Property tests for validation
│   └── README.md             # Testing documentation
├── utils/
│   └── imageCompression.test.ts  # Unit tests for utilities
└── components/
    └── *.test.tsx            # Component tests (future)
```

## Property-Based Testing

### What is Property-Based Testing?

Property-based testing verifies that properties (universal rules) hold true across many randomly generated inputs, rather than testing specific examples.

**Example**:
- Unit test: "Password 'Test123!' should be valid"
- Property test: "All passwords with 8+ chars, uppercase, lowercase, number, and special char should be valid"

### Configuration

All property tests run **100 iterations** minimum:

```typescript
export const PBT_CONFIG = {
  numRuns: 100,
}
```

### Test Annotation

Each property test must reference the design document:

```typescript
// **Feature: amplify-im-app, Property X: Property Name**
it('Property X: description', () => {
  fc.assert(
    fc.property(arbitrary, (value) => {
      // Test property
    }),
    PBT_CONFIG
  )
})
```

## Data Generators

### Available Generators

**File**: `src/test/generators.ts`

| Generator | Description | Usage |
|-----------|-------------|-------|
| `emailArbitrary` | Valid email addresses | Registration/login tests |
| `validPasswordArbitrary` | Secure passwords | Password validation tests |
| `invalidPasswordArbitrary` | Invalid passwords | Negative password tests |
| `verificationCodeArbitrary` | 6-digit codes | Email verification tests |
| `validUsernameArbitrary` | Valid usernames | Username validation tests |
| `whitespaceUsernameArbitrary` | Whitespace strings | Negative username tests |
| `validImageFileArbitrary` | Valid image metadata | File upload tests |
| `invalidImageFileArbitrary` | Invalid file metadata | Negative file tests |
| `userProfileArbitrary` | Complete profiles | Profile management tests |
| `mockFileArbitrary` | Mock File objects | File handling tests |

### Example Usage

```typescript
import * as fc from 'fast-check'
import { emailArbitrary, validPasswordArbitrary } from './generators'
import { PBT_CONFIG } from './helpers'

// **Feature: amplify-im-app, Property 1: Valid registration creates account**
it('Property 1: should create account for valid credentials', () => {
  fc.assert(
    fc.property(
      emailArbitrary,
      validPasswordArbitrary,
      async (email, password) => {
        const result = await signUp(email, password)
        expect(result.userSub).toBeDefined()
      }
    ),
    PBT_CONFIG
  )
})
```

## Test Helpers

### Available Helpers

**File**: `src/test/helpers.ts`

| Helper | Description |
|--------|-------------|
| `mockAmplifyAuth()` | Mock Auth functions |
| `mockAmplifyDataClient()` | Mock Data client |
| `mockAmplifyStorage()` | Mock Storage functions |
| `createMockUser()` | Create mock user objects |
| `createMockProfile()` | Create mock profiles |
| `isValidEmail()` | Validate email format |
| `isValidPassword()` | Validate password strength |
| `isValidUsername()` | Validate username |
| `isValidImageType()` | Validate image type |
| `isValidFileSize()` | Validate file size |

## Running Tests

### Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Watch Mode

Watch mode automatically reruns tests when files change:

```bash
npm run test:watch
```

Features:
- Auto-rerun on file changes
- Filter tests by name
- Run only failed tests
- Interactive mode

### Coverage Report

Generate coverage report:

```bash
npm run test:coverage
```

Output:
- Terminal: Text summary
- `coverage/index.html`: Detailed HTML report
- `coverage/coverage.json`: JSON data

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { formatFileSize } from './imageCompression'

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1024 * 1024)).toBe('1 MB')
  })
})
```

### Property Test Example

```typescript
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { PBT_CONFIG } from './helpers'
import { validUsernameArbitrary } from './generators'

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
})
```

### Component Test Example (Future)

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Profile } from './Profile'

describe('Profile Component', () => {
  it('should render user profile', () => {
    render(<Profile />)
    expect(screen.getByText('个人资料')).toBeInTheDocument()
  })
})
```

## Test Coverage Goals

### Current Coverage

- ✅ Validation functions (email, password, username, file)
- ✅ Image compression utilities
- ✅ Property-based test infrastructure
- ⏳ Component tests (planned)
- ⏳ Integration tests (planned)
- ⏳ E2E tests (planned)

### Target Coverage

- **Unit Tests**: 80%+ code coverage
- **Property Tests**: All validation logic
- **Integration Tests**: Critical user flows
- **E2E Tests**: Complete user journeys

## Best Practices

### 1. Test Naming

Use descriptive names that explain what is being tested:

```typescript
// ❌ Bad
it('test 1', () => { ... })

// ✅ Good
it('should reject passwords shorter than 8 characters', () => { ... })
```

### 2. Property Test Annotations

Always annotate property tests with design document references:

```typescript
// **Feature: amplify-im-app, Property X: Property Name**
it('Property X: description', () => { ... })
```

### 3. Use Generators

Use generators from `generators.ts` for consistent test data:

```typescript
// ❌ Bad
const email = 'test@example.com'

// ✅ Good
fc.assert(
  fc.property(emailArbitrary, (email) => { ... })
)
```

### 4. Test Real Functionality

Avoid mocking unless necessary:

```typescript
// ❌ Bad - over-mocking
const mockValidate = vi.fn(() => true)

// ✅ Good - test real function
expect(isValidEmail(email)).toBe(true)
```

### 5. Keep Tests Focused

Each test should verify one property or behavior:

```typescript
// ❌ Bad - testing multiple things
it('should validate everything', () => {
  expect(isValidEmail(email)).toBe(true)
  expect(isValidPassword(password)).toBe(true)
  expect(isValidUsername(username)).toBe(true)
})

// ✅ Good - focused tests
it('should validate email format', () => {
  expect(isValidEmail(email)).toBe(true)
})

it('should validate password strength', () => {
  expect(isValidPassword(password)).toBe(true)
})
```

## Continuous Integration

### Pre-commit Checks

Run tests before committing:

```bash
npm test
```

### CI Pipeline (Future)

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find module"
**Solution**: Run `npm install` to install dependencies

**Issue**: Property tests timeout
**Solution**: Reduce `numRuns` in PBT_CONFIG temporarily

**Issue**: Mock functions not working
**Solution**: Ensure `vi.fn()` is used correctly and mocks are reset

### Debug Mode

Run tests with debug output:

```bash
DEBUG=* npm test
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [fast-check Documentation](https://fast-check.dev/)
- [Testing Library](https://testing-library.com/)
- [Property-Based Testing Guide](https://fast-check.dev/docs/introduction/)
