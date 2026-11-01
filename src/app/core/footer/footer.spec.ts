import { TestBed } from '@angular/core/testing';

import { expectNoAxeViolations } from '../../../testing/axe';
import { Footer } from './footer';

describe('Footer', () => {
  it('renders the app name', async () => {
    const fixture = TestBed.createComponent(Footer);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Kerberos');
    await expectNoAxeViolations(fixture);
  });
});
