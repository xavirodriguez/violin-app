import { describe, it, expect } from 'vitest'
import { AppError, toAppError, ERROR_CODES } from './app-error'

describe('toAppError', () => {
  it('should return an AppError instance as-is', () => {
    const originalError = new AppError({
      message: 'This is a test error',
      code: ERROR_CODES.NOT_IMPLEMENTED,
    })
    const result = toAppError(originalError)
    expect(result).toBe(originalError)
    expect(result.code).toBe(ERROR_CODES.NOT_IMPLEMENTED)
  })

  it('should merge new context with an existing AppError', () => {
    const originalError = new AppError({
      message: 'Initial error',
      context: { initial: 'value' },
    })
    const result = toAppError(originalError, ERROR_CODES.UNKNOWN, { new: 'context' })

    // It should be a new instance because the context was merged
    expect(result).not.toBe(originalError)
    expect(result.context).toEqual({ initial: 'value', new: 'context' })
  })

  it('should convert a standard Error into an AppError', () => {
    const standardError = new Error('A standard error message')
    const result = toAppError(standardError, ERROR_CODES.DATA_VALIDATION_ERROR, {
      field: 'test',
    })

    expect(result).toBeInstanceOf(AppError)
    expect(result.message).toBe('A standard error message')
    expect(result.code).toBe(ERROR_CODES.DATA_VALIDATION_ERROR)
    expect(result.cause).toBe(standardError)
    expect(result.context).toEqual({ field: 'test' })
  })

  // --- DOMException Mapping ---

  it('should map an error named "NotAllowedError" to MIC_PERMISSION_DENIED', () => {
    const domException = new Error('User denied permission')
    domException.name = 'NotAllowedError'
    const result = toAppError(domException)

    expect(result).toBeInstanceOf(AppError)
    expect(result.code).toBe(ERROR_CODES.MIC_PERMISSION_DENIED)
    expect(result.message).toContain('Microphone access was denied')
  })

  it('should map an error named "NotFoundError" to MIC_NOT_FOUND', () => {
    const domException = new Error('Device not found')
    domException.name = 'NotFoundError'
    const result = toAppError(domException)

    expect(result).toBeInstanceOf(AppError)
    expect(result.code).toBe(ERROR_CODES.MIC_NOT_FOUND)
    expect(result.message).toContain('No microphone was found')
  })

  it('should map an error named "NotReadableError" to MIC_IN_USE', () => {
    const domException = new Error('Could not start source')
    domException.name = 'NotReadableError'
    const result = toAppError(domException)

    expect(result).toBeInstanceOf(AppError)
    expect(result.code).toBe(ERROR_CODES.MIC_IN_USE)
  })

  // --- Non-Error Types ---

  it('should convert a plain string into an AppError', () => {
    const errorString = 'Something went wrong as a string'
    const result = toAppError(errorString, ERROR_CODES.UNKNOWN)

    expect(result).toBeInstanceOf(AppError)
    expect(result.message).toBe(errorString)
    expect(result.code).toBe(ERROR_CODES.UNKNOWN)
    expect(result.cause).toBe(errorString)
  })

  it('should convert an object into an AppError', () => {
    const errorObject = { info: 'Some error data' }
    const result = toAppError(errorObject)

    expect(result).toBeInstanceOf(AppError)
    expect(result.message).toContain('An unknown error occurred')
    expect(result.message).toContain(JSON.stringify(errorObject))
    expect(result.cause).toBe(errorObject)
  })

  it('should handle null and undefined', () => {
    const nullResult = toAppError(null)
    expect(nullResult).toBeInstanceOf(AppError)
    expect(nullResult.message).toContain('An unknown error occurred')

    const undefinedResult = toAppError(undefined)
    expect(undefinedResult).toBeInstanceOf(AppError)
    expect(undefinedResult.message).toContain('An unknown error occurred')
  })
})
