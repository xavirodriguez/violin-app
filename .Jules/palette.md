# 🎨 Palette's Journal

This journal is for CRITICAL UX/accessibility learnings ONLY.

---

## 2024-07-25 - A Calmer UI with Tooltip Delays
**Learning:** Tooltips that appear instantly (`delayDuration: 0`) can create a visually jarring experience, causing distracting "flashes" as the user's mouse moves across interactive elements. It makes the UI feel busy and hyper-sensitive.
**Action:** I've set the default `delayDuration` for the entire app's `TooltipProvider` to `300ms`. This prevents accidental tooltip activation and makes the interface feel more considered and calm. This should be the default for all new tooltips.
