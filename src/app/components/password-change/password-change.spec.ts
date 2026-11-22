import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { expectNoAxeViolations } from '../../../testing/axe';
import { fillIn } from '../../../testing/dom';
import { PasswordChange } from './password-change';

describe('PasswordChange', () => {
  let fixture: ComponentFixture<PasswordChange>;
  let change: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    change = vi.fn(() => of(null));
    fixture = TestBed.createComponent(PasswordChange);
    fixture.componentRef.setInput('change', change);
    await fixture.whenStable();
  });

  async function fill(oldPassword: string, newPassword: string, confirm: string): Promise<void> {
    fillIn(fixture.nativeElement, {
      'Current password': oldPassword,
      'New password': newPassword,
      'Confirm new password': confirm,
    });
    await fixture.whenStable();
  }

  const submitButton = () =>
    fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

  it('does not allow a confirmation that differs from the new password', async () => {
    await fill('old', 'new', 'typo');

    expect(fixture.nativeElement.textContent).toContain('Passwords do not match.');
    expect(submitButton().disabled).toBe(true);
    await expectNoAxeViolations(fixture);
  });

  it('does not allow a new password shorter than 10 characters', async () => {
    await fill('old', 'short', 'short');
    fixture.nativeElement
      .querySelector('input[autocomplete="new-password"]')
      .dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Use 10 to 64 characters.');
    expect(submitButton().disabled).toBe(true);
  });

  it('sends the change and confirms it', async () => {
    const changed = vi.fn();
    fixture.componentInstance.changed.subscribe(changed);
    await fill('old', 'new-password', 'new-password');
    submitButton().click();
    await fixture.whenStable();

    expect(change).toHaveBeenCalledWith('old', 'new-password');
    expect(changed).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Password changed successfully.',
    );
  });
});
