# Analytics Dashboard Documentation

## Overview

The Analytics Dashboard displays practice history, skill levels, streaks, and achievements. All data is stored client-side in localStorage via Zustand persist middleware.

## Data Models

### PracticeSession [71](#0-70)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID generated at session start |
| `startTime` | Date | When session started |
| `endTime` | Date | When session ended |
| `duration` | number | Duration in seconds |
| `exerciseId` | string | Which exercise was practiced |
| `exerciseName` | string | Display name |
| `mode` | 'tuner' \| 'practice' | Which mode (only 'practice' currently records) |
| `notesAttempted` | number | Total note detection attempts |
| `notesCompleted` | number | Notes successfully completed |
| `accuracy` | number | Percentage (0-100) |
| `averageCents` | number | Average absolute deviation in cents |
| `noteResults` | NoteResult[] | Per-note detailed results |

### NoteResult [72](#0-71)

Tracks individual note performance within a session.

### UserProgress [73](#0-72)

Aggregate statistics across all sessions:
- Total sessions count
- Total practice time (seconds)
- Completed exercise IDs
- Streak tracking (current and longest)
- Skill levels (0-100 scale)
- Achievements unlocked
- Per-exercise statistics

## Session Recording Flow

### 1. Session Start [74](#0-73)

Creates a new session object with initial values. Called by PracticeStore when user starts practice.

### 2. Note Attempt Recording [75](#0-74)

**When recorded**: Every time pitch is detected for the target note (called by PracticeStore)

**Updates**:
- Increment `notesAttempted`
- Create or update NoteResult for that note index
- Recalculate `averageCents` (running average)
- Recalculate `accuracy` (in-tune notes / total notes)

### 3. Note Completion Recording [76](#0-75)

**When recorded**: When note hold time requirement is met

**Updates**:
- Increment `notesCompleted`
- Record `timeToComplete` for that note

### 4. Session End [77](#0-76)

**When called**: When exercise completes or user stops practice

**Final calculations**:
1. Calculate actual duration (endTime - startTime)
2. Add completed session to sessions array
3. Update total session count and time
4. Update exercise-specific statistics
5. Update streak (see Streak Computation below)
6. Recalculate skill levels
7. Check for new achievements
8. Persist to localStorage

**Session history limit**: [78](#0-77)

Only the last 100 sessions are kept.

## Metrics Calculation

### Accuracy [79](#0-78)

Formula: `(in-tune notes / total note results) × 100`

A note is "in tune" if `wasInTune` is true (based on 25-cent threshold in practice mode).

### Average Cents Deviation [80](#0-79)

Formula: Sum of absolute average cents per note / number of notes

Uses the per-note running average, not individual attempts.

## Streak Computation [81](#0-80)

**Streak logic**:
1. Compare today's date (normalized to midnight) with last session's date
2. **If last session was yesterday OR no sessions exist**: increment streak
3. **If last session was today**: no change to streak
4. **If last session was before yesterday**: reset streak to 1

**Longest streak**: Updated whenever current streak exceeds it

**UNKNOWN**: Whether multiple sessions in one day extend the streak
**WHY IT MATTERS**: Could affect achievement unlocking
**HOW TO CONFIRM**: Test by completing multiple sessions on the same day and checking streak

## Skill Level Calculation

### Intonation Skill [82](#0-81)

**Formula**:
1. Take average accuracy of last 10 sessions
2. Calculate trend: recent session accuracy - 5th most recent session accuracy
3. Skill = avgAccuracy + (trend × 0.5)
4. Clamp to 0-100 range

**Weighting**: Recent performance affects skill more due to trend factor.

### Rhythm Skill [83](#0-82)

Currently not implemented (remains at 0 or previous value).

### Overall Skill [84](#0-83)

Formula: `(intonationSkill + rhythmSkill) / 2`

Rounded to nearest integer.

## Achievements

Three achievements are implemented: [85](#0-84)

| Achievement ID | Name | Trigger | Icon |
|---------------|------|---------|------|
| `first-perfect` | First Perfect Scale | Accuracy = 100% in a session | 🎯 |
| `week-streak` | 7-Day Streak | currentStreak reaches 7 | 🔥 |
| `100-notes` | 100 Notes Mastered | Total notes completed ≥ 100 | 📈 |

**Achievement checking**: [86](#0-85)

Called at end of every session.

**Duplicate prevention**: Each check verifies achievement doesn't already exist in `progress.achievements` array.
