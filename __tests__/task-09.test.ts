import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePageVisibility } from '../hooks/use-page-visibility'

describe('usePageVisibility', () => {
  it('should return true by default', () => {
    const { result } = renderHook(() => usePageVisibility())
    expect(result.current).toBe(true)
  })

  it('should respond to visibilitychange events', () => {
    const { result } = renderHook(() => usePageVisibility())

    // Simulate visibility change to hidden
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current).toBe(false)

    // Simulate visibility change to visible
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current).toBe(true)
  })
})
