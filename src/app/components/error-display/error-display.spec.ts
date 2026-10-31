import { TestBed } from '@angular/core/testing';

import { expectNoAxeViolations } from '../../../testing/axe';
import { ErrorDisplay } from './error-display';

describe('ErrorDisplay', () => {
  it('announces every message', async () => {
    const fixture = TestBed.createComponent(ErrorDisplay);
    fixture.componentRef.setInput('errors', ['First problem.', 'Second problem.']);
    await fixture.whenStable();

    const alert: HTMLElement = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert.textContent).toContain('First problem.');
    expect(alert.textContent).toContain('Second problem.');
    await expectNoAxeViolations(fixture);
  });
});
