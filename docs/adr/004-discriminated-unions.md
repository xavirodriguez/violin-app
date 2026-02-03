# ADR 004: Explicit States with Discriminated Unions

## Status
Accepted

## Context
`PracticeStore` used multiple boolean flags (`isStarting`, `isActive`, `error`, etc.) to represent its state. This led to impossible state combinations (e.g., `isStarting=true` and `isActive=true`) and complex conditional logic.

## Decision
We refactored `PracticeStore` to use a Discriminated Union for its state. The store now has a single `state` property with a `status` discriminator (`idle`, `initializing`, `ready`, `active`, `error`).

## Consequences
- Impossible states are now unrepresentable in the type system.
- Components use `switch` statements on `status`, leading to more robust UI rendering.
- State transitions are explicit and easier to debug.
