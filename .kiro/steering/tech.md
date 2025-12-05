---
inclusion: always
---

# Technology Stack & Development Guidelines

## Core Stack
- **Frontend**: React 19 + TypeScript + Vite 7
- **Backend**: AWS Amplify Gen2 (AppSync GraphQL + DynamoDB + Cognito + S3)
- **Styling**: Plain CSS files (no CSS-in-JS, no Tailwind)
- **Testing**: Vitest + React Testing Library + fast-check

## Critical Development Rules

### TypeScript
- Always use strict TypeScript - no `any` types without justification
- Define interfaces for all data models matching GraphQL schema
- Use proper typing for Amplify client responses

### React Patterns
- Use functional components with hooks only (no class components)
- Implement lazy loading with `React.lazy()` + `Suspense` for heavy components
- Extract reusable logic into custom hooks in `src/hooks/`
- Keep components focused on UI, move business logic to `src/utils/`

### Styling Conventions
- Use separate CSS files co-located with components (e.g., `Component.tsx` + `Component.css`)
- Never use inline styles or CSS-in-JS libraries
- Import shared styles from `src/styles/buttons.css` for buttons
- Follow mobile-first responsive design approach
- Use CSS custom properties for theming when needed

### Amplify Client Usage
- Import client from `amplify_outputs.json`: `import outputs from '../amplify_outputs.json'`
- Configure client: `const client = generateClient<Schema>()`
- Use `client.models.ModelName.list()` for queries
- Use `client.models.ModelName.create()` for mutations
- Always handle errors with try-catch blocks
- Show user-friendly Chinese error messages via toast notifications

### GraphQL Subscriptions
- Use the `useSubscription` custom hook from `src/hooks/useSubscription.ts`
- Always clean up subscriptions in useEffect cleanup functions
- Subscribe to real-time updates for messages and conversations

### Image Handling
- Always compress images before upload using `browser-image-compression`
- Use S3 storage with entity-based access control
- Path pattern: `profile-pictures/{entity_id}/*`
- Validate image types and sizes client-side

### Testing Requirements
- Write tests alongside source files with `.test.tsx` suffix
- Use test utilities from `src/test/helpers.ts` and `src/test/generators.ts`
- Mock Amplify client using helpers from `src/test/helpers.ts`
- Use fast-check for property-based testing of utilities
- Test user interactions, not implementation details
- Run tests with `npm test` before committing

## Development Workflow

### Starting Development
1. Start backend: `npx ampx sandbox` (in one terminal)
2. Start frontend: `npm run dev` (in another terminal)
3. Backend must be running before frontend can connect

### Before Committing
1. Run linter: `npm run lint`
2. Run tests: `npm test`
3. Check TypeScript: `npm run build` (ensures no type errors)

### Testing Commands
- `npm test` - Run all tests once
- `npm run test:watch` - Watch mode for development
- `npm run test:ui` - Interactive UI mode
- `npm run test:coverage` - Generate coverage report

## Performance Guidelines
- Keep vendor chunks under 1000KB
- Use code splitting for routes and heavy components
- Compress images before upload (target: <500KB)
- Lazy load Profile component and other heavy UI
- Use React.memo() for expensive re-renders only when profiling shows benefit

## Common Pitfalls to Avoid
- Don't forget to configure Amplify client before using it
- Don't use Amplify client before outputs are loaded
- Don't forget to clean up subscriptions to prevent memory leaks
- Don't upload images without compression
- Don't use inline styles - always use CSS files
- Don't run tests in watch mode in CI/CD - use `npm test`
- Don't forget both terminals (backend + frontend) for development
