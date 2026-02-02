# ADR 002: Decomposition of the Analytics God Object

## Status
Accepted

## Context
`AnalyticsStore` was a "God Object" responsible for session tracking, long-term progress, achievements, and statistics. It was hard to maintain and grew too large.

## Decision
We decomposed `AnalyticsStore` into four domain-specific stores:
- `SessionStore`: Manages the active practice session.
- `ProgressStore`: Manages long-term statistics and streaks.
- `AchievementsStore`: Manages unlocked achievements.
- `SessionHistoryStore`: Manages past sessions.

A facade (`AnalyticsFacade`) was created to maintain backward compatibility while components are migrated.

## Consequences
- Reduced cognitive load when working on specific domain areas.
- Better scalability for future features.
- Easier to implement targeted persistence for each domain.
