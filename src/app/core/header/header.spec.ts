import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthStub, createAuthStub, provideAuthStub } from '../../../testing/auth-stub';
import { expectNoAxeViolations } from '../../../testing/axe';
import { Header } from './header';

describe('Header', () => {
  let auth: AuthStub;
  let fixture: ComponentFixture<Header>;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    auth = createAuthStub();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideAuthStub(auth)] });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
  });

  const navLinks = () =>
    Array.from<HTMLAnchorElement>(fixture.nativeElement.querySelectorAll('nav a')).map((link) =>
      link.textContent?.trim(),
    );
  const logoutButton = () =>
    Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Log out',
    );

  it('shows only the brand to guests', async () => {
    expect(navLinks()).toEqual([]);
    expect(logoutButton()).toBeUndefined();
    await expectNoAxeViolations(fixture);
  });

  it('shows navigation and logs a user out', async () => {
    auth.signIn('alice');
    await fixture.whenStable();

    expect(navLinks()).toEqual(['Flow', 'Users', 'Basic authentication']);
    expect(fixture.nativeElement.textContent).toContain('Logged in as alice');
    await expectNoAxeViolations(fixture);

    logoutButton()?.click();

    expect(auth.logout).toHaveBeenCalled();
    expect(auth.superLogout).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('logs a superuser out through the superuser endpoint', async () => {
    auth.signIn('superuser', true);
    await fixture.whenStable();

    logoutButton()?.click();

    expect(auth.superLogout).toHaveBeenCalled();
    expect(auth.logout).not.toHaveBeenCalled();
  });
});
