import { describe, it, expect } from 'vitest';
import { clamp } from './ui-utils';

describe('clamp', () => {
  it('should not change the value if it is within the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('should clamp the value to the minimum if it is below the range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('should clamp the value to the maximum if it is above the range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should work with negative ranges', () => {
    expect(clamp(-15, -10, 0)).toBe(-10);
    expect(clamp(5, -10, 0)).toBe(0);
  });

  it('should handle cases where min and max are equal', () => {
    expect(clamp(10, 5, 5)).toBe(5);
    expect(clamp(0, 5, 5)).toBe(5);
  });
});
