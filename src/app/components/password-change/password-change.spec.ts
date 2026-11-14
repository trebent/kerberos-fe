import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { expectNoAxeViolations } from '../../../testing/axe';
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
    const element: HTMLElement = fixture.nativeElement;
    for (const [name, value] of [
      ['oldPassword', oldPassword],
      ['newPassword', newPassword],
      ['confirmPassword', confirm],
    ]) {
      const input = element.querySelector<HTMLInputElement>(`[formControlName="${name}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
    }
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

  it('sends the change and confirms it', async () => {
    await fill('old', 'new', 'new');
    submitButton().click();
    await fixture.whenStable();

    expect(change).toHaveBeenCalledWith('old', 'new');
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Password changed successfully.',
    );
  });
});
