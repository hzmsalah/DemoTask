import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';

afterEach(() => vi.useRealTimers());

describe('useDebounce', () => {
  it('publishes the latest value only after the delay', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 350), {
      initialProps: { value: 'first' },
    });

    rerender({ value: 'second' });
    expect(result.current).toBe('first');
    act(() => vi.advanceTimersByTime(349));
    expect(result.current).toBe('first');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('second');
  });

  it('cancels its pending timer on unmount', () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useDebounce('value', 350));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
