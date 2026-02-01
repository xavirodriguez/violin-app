# Feature Flags System

This project uses a centralized feature flag system to manage experimental features, beta functionalities, and conditional code execution.

## 🛠 How it Works

The system is powered by:
- **`lib/feature-flags.ts`**: The core logic, including `FeatureFlagsManager` and React hooks.
- **Environment Variables**: Flags are enabled/disabled via `.env` files.
- **`FEATURE_FLAGS_METADATA`**: Centralized definition of all available flags, their types, and descriptions.

## 🚀 Adding a New Feature Flag

1.  **Define the flag name**: Use the convention `FEATURE_[CATEGORY]_[NAME]` (e.g., `FEATURE_UI_NEW_THEME`).
2.  **Add metadata to `lib/feature-flags.ts`**:
    ```typescript
    export const FEATURE_FLAGS_METADATA: Record<string, FeatureFlagMetadata> = {
      // ...
      FEATURE_UI_NEW_THEME: {
        name: 'FEATURE_UI_NEW_THEME',
        key: 'uiNewTheme',
        type: 'EXPERIMENTAL',
        description: 'Enable the new experimental dark theme.',
        defaultValue: false,
        riskLevel: 'LOW',
        affectedFiles: ['components/theme-provider.tsx'],
        rollbackStrategy: 'Revert to the default theme.'
      }
    }
    ```
3.  **Add to `.env.example`**:
    ```env
    # Enable the new experimental dark theme.
    FEATURE_UI_NEW_THEME=false
    NEXT_PUBLIC_FEATURE_UI_NEW_THEME=false
    ```

## 💻 Usage in Code

### React Components (Client-side)
Use the `useFeatureFlag` hook:

```tsx
import { useFeatureFlag } from '@/lib/feature-flags'

export function MyComponent() {
  const isEnabled = useFeatureFlag('FEATURE_UI_NEW_THEME')

  return (
    <div>
      {isEnabled ? <NewThemeView /> : <OldThemeView />}
    </div>
  )
}
```

### Server-side or General TypeScript
Use the `featureFlags` singleton:

```typescript
import { featureFlags } from '@/lib/feature-flags'

if (featureFlags.isEnabled('FEATURE_UI_NEW_THEME')) {
  // Execute experimental logic
}
```

## ⚠️ Important Considerations

- **Next.js & Environment Variables**: For flags to be accessible on the client-side in Next.js, they MUST be prefixed with `NEXT_PUBLIC_`. The `FeatureFlagsManager` automatically checks for both the original name and the prefixed version.
- **Default Values**: Always define a safe default value in the metadata.
- **Cleanup**: Once a feature is stable and fully rolled out, remember to remove the flag and the conditional code to keep the codebase clean.

## 📊 Feature Categories

- **EXPERIMENTAL**: Code in development active, possible changes.
- **BETA**: Funcionalidad completa pero no validada en producción.
- **UNSTABLE**: Features que podrían fallar en ciertos escenarios.
- **INTEGRATION**: Integraciones externas que podrían necesitar fallback.
- **PERFORMANCE**: Optimizaciones experimentales.
- **UI_UX**: Cambios de interfaz no validados.
- **DEPRECATED**: Código antiguo que será reemplazado.
