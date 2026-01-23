import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useOSMDSafe } from './use-osmd-safe'

const mockLoad = vi.fn()
const mockRender = vi.fn()
const mockClear = vi.fn()
const mockShow = vi.fn()
const mockReset = vi.fn()
const mockNext = vi.fn()

vi.mock('opensheetmusicdisplay', () => ({
  OpenSheetMusicDisplay: vi.fn().mockImplementation(() => ({
    load: mockLoad,
    render: mockRender,
    clear: mockClear,
    cursor: {
      show: mockShow,
      reset: mockReset,
      next: mockNext,
    },
  })),
}));

const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay')

const VALID_XML = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part></score-partwise>`
const NEW_XML = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P2"><part-name>Music 2</part-name></score-part></part-list><part id="P2"><measure number="1"><attributes><divisions>1</divisions></attributes><note><pitch><step>D</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part></score-partwise>`

describe('useOSMDSafe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoad.mockResolvedValue(undefined)
  })

  const setupHook = () => {
    const { result, rerender, unmount } = renderHook((props) => useOSMDSafe(props), {
      initialProps: '',
    })
    act(() => {
      result.current.containerRef.current = document.createElement('div')
    })
    return { result, rerender, unmount }
  }

  it('should not initialize if musicXML is empty', () => {
    setupHook()
    expect(OpenSheetMusicDisplay).not.toHaveBeenCalled()
  })

  it('should initialize correctly and render the sheet music', async () => {
    const { result, rerender } = setupHook()
    rerender(VALID_XML)
    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
      expect(result.current.error).toBe(null)
    })
    expect(OpenSheetMusicDisplay).toHaveBeenCalledTimes(1)
    expect(mockLoad).toHaveBeenCalledWith(VALID_XML)
    expect(mockRender).toHaveBeenCalledTimes(1)
    expect(mockShow).toHaveBeenCalledTimes(1)
  })

  it('should handle an error during loading', async () => {
    const errorMessage = 'Failed to load music XML'
    mockLoad.mockRejectedValue(new Error(errorMessage))
    const { result, rerender } = setupHook()
    rerender(VALID_XML)
    await waitFor(() => {
      expect(result.current.isReady).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })
    expect(mockRender).not.toHaveBeenCalled()
  })

  it('should call cursor methods correctly', async () => {
    const { result, rerender } = setupHook()
    rerender(VALID_XML)
    await waitFor(() => expect(result.current.isReady).toBe(true))
    act(() => result.current.advanceCursor())
    expect(mockNext).toHaveBeenCalledTimes(1)
    act(() => result.current.resetCursor())
    expect(mockReset).toHaveBeenCalledTimes(1)
    expect(mockShow).toHaveBeenCalledTimes(2)
  })

  it('should clean up the OSMD instance on unmount', async () => {
    const { unmount, rerender } = setupHook()
    rerender(VALID_XML)
    await waitFor(() => expect(mockRender).toHaveBeenCalledTimes(1))
    unmount()
    expect(mockClear).toHaveBeenCalledTimes(1)
  })

  it('should clear and re-render when musicXML changes', async () => {
    const { result, rerender } = setupHook()
    rerender(VALID_XML)
    await waitFor(() => expect(mockRender).toHaveBeenCalledTimes(1))
    expect(mockLoad).toHaveBeenCalledWith(VALID_XML)
    rerender(NEW_XML)
    await waitFor(() => {
      expect(mockClear).toHaveBeenCalledTimes(1)
      expect(mockRender).toHaveBeenCalledTimes(2)
      expect(result.current.isReady).toBe(true)
    })
    expect(mockLoad).toHaveBeenCalledWith(NEW_XML)
  })
})
