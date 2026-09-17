// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSignalData } from './index';

describe('useSignalData import transaction', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the active dataset when a later import fails', () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useSignalData());

    act(() => {
      const imported = result.current.loadCustomData({
        activities: [
          {
            id: 'safe-import',
            date: '2026-09-10',
            category: 'learning',
            title: 'Imported safely',
            duration: 30,
            tags: ['Testing'],
          },
        ],
        skills: [null],
      });
      expect(imported.ok).toBe(true);
    });

    const activeData = result.current.data;
    expect(activeData.activities[0].id).toBe('safe-import');

    act(() => {
      const failed = result.current.loadCustomData({ activities: [null] });
      expect(failed.ok).toBe(false);
    });

    expect(result.current.data).toBe(activeData);
    expect(result.current.data.activities[0].id).toBe('safe-import');
    unmount();
  });
});
