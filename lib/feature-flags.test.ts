import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { featureFlags, FEATURE_FLAGS_METADATA } from './feature-flags'

describe('FeatureFlagsManager', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return the default value when the flag is not set in environment', () => {
    const flagName = 'FEATURE_AUDIO_WEB_WORKER'
    const metadata = FEATURE_FLAGS_METADATA[flagName]

    // Ensure it's not in env
    delete process.env[flagName]
    delete process.env[`NEXT_PUBLIC_${flagName}`]

    expect(featureFlags.isEnabled(flagName)).toBe(metadata.defaultValue)
  })

  it('should return true when the flag is set to "true" in environment', () => {
    const flagName = 'FEATURE_AUDIO_WEB_WORKER'
    process.env[flagName] = 'true'

    expect(featureFlags.isEnabled(flagName)).toBe(true)
  })

  it('should return false when the flag is set to "false" in environment', () => {
    // We need a flag that is true by default or we set it to true then false
    const flagName = 'FEATURE_AUDIO_WEB_WORKER'
    process.env[flagName] = 'false'

    expect(featureFlags.isEnabled(flagName)).toBe(false)
  })

  it('should respect NEXT_PUBLIC_ prefix for client-side flags', () => {
    const flagName = 'FEATURE_AUDIO_WEB_WORKER'
    delete process.env[flagName]
    process.env[`NEXT_PUBLIC_${flagName}`] = 'true'

    expect(featureFlags.isEnabled(flagName)).toBe(true)
  })

  it('should return false and warn for undefined flags', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const flagName = 'NON_EXISTENT_FLAG'

    expect(featureFlags.isEnabled(flagName as any)).toBe(false)
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(flagName))

    consoleSpy.mockRestore()
  })

  it('should return all flags with their current values', () => {
    process.env['FEATURE_AUDIO_WEB_WORKER'] = 'true'

    const allFlags = featureFlags.getAll()

    expect(allFlags['FEATURE_AUDIO_WEB_WORKER']).toBe(true)
    expect(Object.keys(allFlags)).toEqual(Object.keys(FEATURE_FLAGS_METADATA))
  })

  it('should get raw values using get()', () => {
    process.env['SOME_RANDOM_FLAG'] = 'some-value'
    // Since it's not in metadata, it should still return the env value if we use get()

    expect(featureFlags.get('SOME_RANDOM_FLAG' as any)).toBe('some-value')
  })

  it('should return default value from get() when env is missing', () => {
    const flagName = 'FEATURE_AUDIO_WEB_WORKER'
    delete process.env[flagName]
    delete process.env[`NEXT_PUBLIC_${flagName}`]

    expect(featureFlags.get(flagName)).toBe(FEATURE_FLAGS_METADATA[flagName].defaultValue)
  })

  it('should return provided default value from get() when both env and metadata are missing', () => {
    expect(featureFlags.get('TOTALLY_MISSING' as any, 'custom-default')).toBe('custom-default')
  })

  it('should verify FEATURE_UI_INTONATION_HEATMAPS is STABLE and true by default', () => {
    const flagName = 'FEATURE_UI_INTONATION_HEATMAPS'
    const metadata = FEATURE_FLAGS_METADATA[flagName]

    expect(metadata.type).toBe('STABLE')
    expect(metadata.defaultValue).toBe(true)

    // Ensure it's not overridden in test env
    delete process.env[flagName]
    delete process.env[`NEXT_PUBLIC_${flagName}`]

    expect(featureFlags.isEnabled(flagName)).toBe(true)
  })
})
