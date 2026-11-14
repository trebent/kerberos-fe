import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SKELETON_MIN_DURATION_MS, skeletonVisible } from './skeleton-visible';

describe('skeletonVisible', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const setup = (initiallyLoading: boolean) => {
    const loading = signal(initiallyLoading);
    const visible = TestBed.runInInjectionContext(() => skeletonVisible(loading));
    TestBed.tick();
    return { loading, visible };
  };

  it('stays hidden when nothing loads', () => {
    const { visible } = setup(false);

    expect(visible()).toBe(false);
  });

  it('keeps a fast load on screen for the minimum duration', () => {
    const { loading, visible } = setup(true);

    vi.advanceTimersByTime(50);
    loading.set(false);
    TestBed.tick();
    expect(visible()).toBe(true);

    vi.advanceTimersByTime(SKELETON_MIN_DURATION_MS - 60);
    expect(visible()).toBe(true);

    vi.advanceTimersByTime(10);
    expect(visible()).toBe(false);
  });

  it('hides a slow load as soon as it finishes', () => {
    const { loading, visible } = setup(true);

    vi.advanceTimersByTime(SKELETON_MIN_DURATION_MS + 100);
    loading.set(false);
    TestBed.tick();
    vi.advanceTimersByTime(0);

    expect(visible()).toBe(false);
  });

  it('stays visible when loading starts again while held', () => {
    const { loading, visible } = setup(true);

    loading.set(false);
    TestBed.tick();
    loading.set(true);
    TestBed.tick();
    vi.advanceTimersByTime(SKELETON_MIN_DURATION_MS * 2);

    expect(visible()).toBe(true);
  });
});
