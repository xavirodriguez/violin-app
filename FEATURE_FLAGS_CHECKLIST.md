# Feature Flag Validation Checklist

Use this checklist whenever adding, modifying, or removing a feature flag to ensure architectural consistency and prevent runtime errors.

## 🆕 Adding a New Flag

- [ ] **Define Name**: Use the `FEATURE_[CATEGORY]_[NAME]` convention (e.g., `FEATURE_UI_DARK_MODE`).
- [ ] **Add Metadata**: Register the flag in `FEATURE_FLAGS_METADATA` within `lib/feature-flags.ts`.
  - [ ] `name`: Match the constant name.
  - [ ] `key`: camelCase version for internal use.
  - [ ] `type`: One of `EXPERIMENTAL`, `BETA`, `UNSTABLE`, `INTEGRATION`, `PERFORMANCE`, `UI_UX`, `DEPRECATED`.
  - [ ] `defaultValue`: Set a safe default (usually `false` for new features).
  - [ ] `riskLevel`: `LOW`, `MEDIUM`, or `HIGH`.
- [ ] **Next.js Client Mapping**: Add the flag to the `getClientValue` switch-case in `lib/feature-flags.ts`. **(CRITICAL for client-side use)**.
- [ ] **Next.js Config**: Add the flag to the `env` block in `next.config.mjs`.
- [ ] **Environment Example**: Add the flag and its `NEXT_PUBLIC_` version to `.env.example`.
- [ ] **Documentation**: Update `FEATURE_CATALOG.md` with the new flag's description and status.

## ✅ Verification Steps

- [ ] **Unit Tests**: Run `pnpm test:unit lib/feature-flags.test.ts`.
- [ ] **Type Check**: Run `pnpm typecheck` to ensure no typos in flag names.
- [ ] **Manual Test (Disabled)**: Verify the application behaves correctly when the flag is `false` (or undefined).
- [ ] **Manual Test (Enabled)**: Set `NEXT_PUBLIC_FEATURE_XXX=true` in `.env.local` and verify the feature works.
- [ ] **Prefix Check**: Ensure that if a flag is used in a client component, it has the `NEXT_PUBLIC_` prefix in the environment.

## 🧹 Cleanup (Feature Promotion)

- [ ] **Stable Verification**: Feature has been in production/beta for sufficient time with no major issues.
- [ ] **Code Removal**: Remove conditional logic (`if (isEnabled)`, `useFeatureFlag`) and keep the "enabled" branch.
- [ ] **Metadata Removal**: Remove from `FEATURE_FLAGS_METADATA` and `getClientValue`.
- [ ] **Config Cleanup**: Remove from `next.config.mjs` and `.env.example`.
- [ ] **Documentation Update**: Move to "Historical/Stable" section in `FEATURE_CATALOG.md` or remove if no longer relevant.

## 🚨 Troubleshooting

- **Flag always returns default**: Check if it's added to `getClientValue` in `lib/feature-flags.ts`.
- **Flag works on server but not client**: Ensure `NEXT_PUBLIC_` prefix is used in `.env` AND it's mapped in `getClientValue`.
- **TypeScript Error**: Ensure the flag name is exactly as defined in the metadata keys.
