import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { provideRouter, Router } from '@angular/router';

import { ThemeService } from '../../services/theme.service';
import { AuthStub, createAuthStub, provideAuthStub } from '../../../testing/auth-stub';
import { expectNoAxeViolations } from '../../../testing/axe';
import { Header } from './header';

describe('Header', () => {
  let auth: AuthStub;
  let fixture: ComponentFixture<Header>;
  let navigate: ReturnType<typeof vi.spyOn>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    localStorage.clear();
    auth = createAuthStub();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideAuthStub(auth)] });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(Header);
    loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
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
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('switches the color theme', async () => {
    const menu = await loader.getHarness(
      MatMenuHarness.with({ selector: '[aria-label^="Color theme"]' }),
    );
    await menu.clickItem({ text: /Dark/ });

    expect(TestBed.inject(ThemeService).mode()).toBe('dark');
  });
});
