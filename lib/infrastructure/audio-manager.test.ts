// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AudioManager } from './audio-manager'
import { AppError, ERROR_CODES } from '../errors/app-error'

describe('AudioManager', () => {
  let audioManager: AudioManager

  beforeEach(() => {
    audioManager = new AudioManager()
    vi.restoreAllMocks()

    // Mock AudioContext
    class MockAudioContext {
      createAnalyser() {
        return {
          fftSize: 0,
          smoothingTimeConstant: 0,
          connect: vi.fn(),
          disconnect: vi.fn(),
        }
      }
      createGain() {
        return {
          gain: { value: 1 },
          connect: vi.fn(),
          disconnect: vi.fn(),
        }
      }
      createMediaStreamSource() {
        return {
          connect: vi.fn(),
          disconnect: vi.fn(),
        }
      }
      close() {
        return Promise.resolve()
      }
      state = 'running'
    }
    vi.stubGlobal('AudioContext', MockAudioContext)

    // Mock navigator.mediaDevices
    const mockGetUserMedia = vi.fn()
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: mockGetUserMedia,
      },
    })
  })

  it('should initialize correctly with successful getUserMedia', async () => {
    const mockTrack = { stop: vi.fn() }
    const mockStream = {
      getTracks: vi.fn().mockReturnValue([mockTrack]),
    }
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mockStream as unknown as MediaStream)

    const resources = await audioManager.initialize()
    expect(resources.stream).toBe(mockStream)
    expect(audioManager.isActive()).toBe(true)
  })

  it('should throw AppError with MIC_PERMISSION_DENIED when permission is rejected', async () => {
    const permissionError = new Error('Permission denied')
    permissionError.name = 'NotAllowedError'
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(permissionError)

    try {
      await audioManager.initialize()
      expect.fail('Should have thrown AppError')
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      if (e instanceof AppError) {
        expect(e.code).toBe(ERROR_CODES.MIC_PERMISSION_DENIED)
      }
    }
  })

  it('should clean up resources correctly', async () => {
    const mockTrack = { stop: vi.fn() }
    const mockStream = {
      getTracks: vi.fn().mockReturnValue([mockTrack]),
    }
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mockStream as unknown as MediaStream)

    await audioManager.initialize()
    await audioManager.cleanup()

    expect(mockTrack.stop).toHaveBeenCalled()
    expect(audioManager.isActive()).toBe(false)
  })
})
