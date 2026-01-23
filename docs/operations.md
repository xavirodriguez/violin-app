# Operations

This document describes operational aspects of the Violin Mentor application, including logging, feature flags, and environment variables.

## Logging

The application uses the standard `console` object for logging.

- **`console.log`**: Used for general informational messages during development.
- **`console.error`**: Used for logging errors. In a production environment, these logs could be sent to a dedicated logging service.

The application also uses `@vercel/analytics` to track usage analytics.

## Feature Flags

Currently, the application does not have a formal feature flag system. New features are deployed directly to production.

## Environment Variables

The application does not require any specific environment variables to run. As a client-side only application, there are no API keys or other secrets to manage.

## Error Handling

The application uses a simple error handling strategy. The `ErrorBoundary` component in `components/error-boundary.tsx` is used to catch and handle rendering errors in its child components, preventing the entire application from crashing.
