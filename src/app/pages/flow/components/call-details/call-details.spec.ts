import { ComponentFixture, TestBed } from '@angular/core/testing';

import { expectNoAxeViolations } from '../../../../../testing/axe';
import { DebugSessionCall } from '../../../../services/admin';
import { CallDetails } from './call-details';

const call = {
  id: 9,
  method: 'GET',
  statusCode: 404,
  url: '/items/1',
  startedAt: '2026-01-01T10:00:00.000100Z',
  stoppedAt: '2026-01-01T10:00:00.002350Z',
  flowTransitions: [],
} as unknown as DebugSessionCall;

describe('CallDetails', () => {
  let fixture: ComponentFixture<CallDetails>;

  async function render(details: Partial<DebugSessionCall> = {}): Promise<HTMLElement> {
    fixture = TestBed.createComponent(CallDetails);
    fixture.componentRef.setInput('call', { ...call, ...details });
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  const value = (element: HTMLElement, label: string) =>
    Array.from(element.querySelectorAll('dt')).find((term) => term.textContent === label)
      ?.nextElementSibling;

  it('shows the duration to the microsecond', async () => {
    const element = await render();

    expect(value(element, 'Duration')?.textContent).toBe('2.250ms');
    await expectNoAxeViolations(fixture);
  });

  it('shows a dash while the call has not stopped', async () => {
    const element = await render({ stoppedAt: undefined });

    expect(value(element, 'Duration')?.textContent).toBe('—');
  });

  it('colors the status by whether the call succeeded', async () => {
    expect(value(await render(), 'Status')?.className).toContain('status-err');
    expect(value(await render({ statusCode: 201 }), 'Status')?.className).toContain('status-ok');
  });
});
