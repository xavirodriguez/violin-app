import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useOSMDSafe } from './use-osmd-safe'
import { IOSMDOptions } from 'opensheetmusicdisplay'

// Use vi.hoisted to create the mock class and its spies before vi.mock is hoisted
const { MockOSMD, spies } = vi.hoisted(() => {
  const spies = {
    load: vi.fn(),
    render: vi.fn(),
    clear: vi.fn(),
    show: vi.fn(),
    reset: vi.fn(),
    next: vi.fn(),
  }

  class MockOSMDClass {
    constructor() {}
    load = spies.load
    render = spies.render
    clear = spies.clear
    cursor = {
      show: spies.show,
      reset: spies.reset,
      next: spies.next,
    }
  }

  return { MockOSMD: MockOSMDClass, spies }
})

vi.mock('opensheetmusicdisplay', () => ({
  OpenSheetMusicDisplay: MockOSMD,
}))

const VALID_XML = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats:4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part></score-partwise>`
const NEW_XML = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P2"><part-name>Music 2</part-name></score-part></part-list><part id="P2"><measure number="1"><attributes><divisions>1</divisions></attributes><note><pitch><step>D</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part></score-partwise>`

describe('useOSMDSafe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    spies.load.mockResolvedValue(undefined)
  })

  const setupHook = () => {
    const { result, rerender, unmount } = renderHook(
      ({ musicXML, options }: { musicXML: string; options?: IOSMDOptions }) =>
        useOSMDSafe(musicXML, options),
      {
        initialProps: { musicXML: '', options: undefined as IOSMDOptions | undefined },
      },
    )
    act(() => {
      if (result.current.containerRef.current === null) {
        // @ts-expect-error - manipulating ref for testing
        result.current.containerRef.current = document.createElement('div')
      }
    })
    return { result, rerender, unmount }
  }

  it('should not initialize if musicXML is empty', () => {
    setupHook()
    // We can check if any of our spies were called
    expect(spies.load).not.toHaveBeenCalled()
  })

  it('should initialize correctly and render the sheet music', async () => {
    const { result, rerender } = setupHook()
    rerender({ musicXML: VALID_XML, options: undefined })
    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
      expect(result.current.error).toBe(null)
    }, { timeout: 2000 })
    expect(spies.load).toHaveBeenCalledWith(VALID_XML)
    expect(spies.render).toHaveBeenCalledTimes(1)
    expect(spies.show).toHaveBeenCalledTimes(1)
  })

  it('should handle an error during loading', async () => {
    const errorMessage = 'Failed to load music XML'
    spies.load.mockRejectedValue(new Error(errorMessage))
    const { result, rerender } = setupHook()
    rerender({ musicXML: VALID_XML, options: undefined })
    await waitFor(() => {
      expect(result.current.isReady).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })
    expect(spies.render).not.toHaveBeenCalled()
  })

  it('should call cursor methods correctly', async () => {
    const { result, rerender } = setupHook()
    rerender({ musicXML: VALID_XML, options: undefined })
    await waitFor(() => expect(result.current.isReady).toBe(true))
    act(() => result.current.advanceCursor())
    expect(spies.next).toHaveBeenCalledTimes(1)
    act(() => result.current.resetCursor())
    expect(spies.reset).toHaveBeenCalledTimes(1)
    expect(spies.show).toHaveBeenCalledTimes(2) // Once on load, once on reset
  })

  it('should clean up the OSMD instance on unmount', async () => {
    const { unmount, rerender } = setupHook()
    rerender({ musicXML: VALID_XML, options: undefined })
    await waitFor(() => expect(spies.render).toHaveBeenCalledTimes(1))
    unmount()
    expect(spies.clear).toHaveBeenCalledTimes(1)
  })

  it('should clear and re-render when musicXML changes', async () => {
    const { result, rerender } = setupHook()
    rerender({ musicXML: VALID_XML, options: undefined })
    await waitFor(() => expect(spies.render).toHaveBeenCalledTimes(1))
    expect(spies.load).toHaveBeenCalledWith(VALID_XML)
    rerender({ musicXML: NEW_XML, options: undefined })
    await waitFor(() => {
      expect(spies.clear).toHaveBeenCalledTimes(1)
      expect(spies.render).toHaveBeenCalledTimes(2)
      expect(result.current.isReady).toBe(true)
    })
    expect(spies.load).toHaveBeenCalledWith(NEW_XML)
  })
})
