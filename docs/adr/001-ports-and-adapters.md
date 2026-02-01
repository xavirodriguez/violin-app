# ADR 001: Ports and Adapters for Audio Infrastructure

## Status
Accepted

## Context
The legacy system was tightly coupled to Web Audio APIs (`AnalyserNode`, `AudioContext`, `navigator.mediaDevices`), making it difficult to test without a browser environment and hard to swap the audio processing logic.

## Decision
We implemented the Ports and Adapters (Hexagonal Architecture) pattern. We defined interfaces (Ports) for audio data retrieval and pitch detection, and implemented Adapters that wrap the Web Audio API.

## Consequences
- The core logic is now independent of the platform.
- Pitch detection and session runners can be tested with synthetic data in Node.js.
- Improved separation of concerns.
