import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { requestStatus } from './request-status';

@Component({ template: '' })
class Host {
  readonly status = requestStatus({ failure: 'Could not save.' });
}

describe('requestStatus', () => {
  const create = () =>
    TestBed.runInInjectionContext(() =>
      requestStatus({ failure: 'Could not save.', success: 'Saved.' }),
    );

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('is pending until the request ends, then shows its success message for a while', () => {
    const status = create();
    const request$ = new Subject<number>();
    const onSuccess = vi.fn();

    status.run(request$, onSuccess);
    expect(status.pending()).toBe(true);

    request$.next(7);
    request$.complete();
    expect(onSuccess).toHaveBeenCalledWith(7);
    expect(status.pending()).toBe(false);
    expect(status.success()).toBe('Saved.');

    vi.advanceTimersByTime(3000);
    expect(status.success()).toBeNull();
  });

  it('shows the failure message until the next request starts', () => {
    const status = create();
    const failing$ = new Subject<void>();

    status.run(failing$);
    failing$.error(new Error('500'));
    expect(status.error()).toBe('Could not save.');
    expect(status.pending()).toBe(false);

    status.run(new Subject<void>());
    expect(status.error()).toBeNull();
  });

  it('stops listening when its component is destroyed', () => {
    const fixture = TestBed.createComponent(Host);
    const request$ = new Subject<void>();
    const onSuccess = vi.fn();
    fixture.componentInstance.status.run(request$, onSuccess);

    fixture.destroy();
    request$.next();

    expect(onSuccess).not.toHaveBeenCalled();
  });
});
