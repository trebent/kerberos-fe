import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { expectNoAxeViolations } from '../../../testing/axe';
import { fillIn } from '../../../testing/dom';
import { PasswordReset } from './password-reset';

describe('PasswordReset', () => {
  let fixture: ComponentFixture<PasswordReset>;
  let reset: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    reset = vi.fn(() => of(null));
    fixture = TestBed.createComponent(PasswordReset);
    fixture.componentRef.setInput('reset', reset);
    await fixture.whenStable();
  });

  async function fill(newPassword: string, confirm: string): Promise<void> {
    fillIn(fixture.nativeElement, {
      'New password': newPassword,
      'Confirm new password': confirm,
    });
    await fixture.whenStable();
  }

  const submitButton = () =>
    fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

  it('does not allow a password outside 10 to 64 characters, or a differing confirmation', async () => {
    await fill('short', 'short');
    expect(submitButton().disabled).toBe(true);

    await fill('new-password', 'new-passwrd');
    expect(fixture.nativeElement.textContent).toContain('Passwords do not match.');
    expect(submitButton().disabled).toBe(true);
    await expectNoAxeViolations(fixture);
  });

  it('sends the reset and says the user was logged out', async () => {
    await fill('new-password', 'new-password');
    submitButton().click();
    await fixture.whenStable();

    expect(reset).toHaveBeenCalledWith('new-password');
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'The user has been logged out everywhere.',
    );
  });
});
