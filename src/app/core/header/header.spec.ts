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
  const accountButton = () =>
    fixture.nativeElement.querySelector('[aria-label^="Account"]') as HTMLButtonElement | null;

  it('shows only the brand to guests', async () => {
    expect(navLinks()).toEqual([]);
    expect(accountButton()).toBeNull();
    await expectNoAxeViolations(fixture);
  });

  it('shows navigation and logs a user out from the account menu', async () => {
    auth.signIn('alice');
    await fixture.whenStable();

    expect(navLinks()).toEqual(['Flow', 'Users', 'Basic authentication']);
    expect(accountButton()?.getAttribute('aria-label')).toBe('Account: alice');
    await expectNoAxeViolations(fixture);

    const menu = await loader.getHarness(
      MatMenuHarness.with({ selector: '[aria-label^="Account"]' }),
    );
    await menu.clickItem({ text: /Log out/ });

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
