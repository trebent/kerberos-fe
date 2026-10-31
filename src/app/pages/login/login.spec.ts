import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { provideRouter, Router } from '@angular/router';
import { throwError } from 'rxjs';

import { AuthStub, createAuthStub, provideAuthStub } from '../../../testing/auth-stub';
import { expectNoAxeViolations } from '../../../testing/axe';
import { Login } from './login';

describe('Login', () => {
  let auth: AuthStub;
  let fixture: ComponentFixture<Login>;
  let loader: HarnessLoader;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    auth = createAuthStub();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideAuthStub(auth)] });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(Login);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  const submitButton = () => loader.getHarness(MatButtonHarness.with({ text: 'Sign in' }));

  async function fillIn(username: string, password: string) {
    await (
      await loader.getHarness(MatInputHarness.with({ selector: '[autocomplete="username"]' }))
    ).setValue(username);
    await (
      await loader.getHarness(MatInputHarness.with({ selector: '[type="password"]' }))
    ).setValue(password);
  }

  it('keeps the submit button disabled until both fields are filled', async () => {
    expect(await (await submitButton()).isDisabled()).toBe(true);

    await fillIn('alice', 'secret');

    expect(await (await submitButton()).isDisabled()).toBe(false);
    await expectNoAxeViolations(fixture);
  });

  it('logs a user in and goes to the start page', async () => {
    await fillIn('alice', 'secret');
    await (await submitButton()).click();

    expect(auth.login).toHaveBeenCalledWith('alice', 'secret');
    expect(auth.superLogin).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('logs a superuser in', async () => {
    await (await loader.getHarness(MatSlideToggleHarness)).toggle();
    await fillIn('client', 'secret');
    await (await submitButton()).click();

    expect(auth.superLogin).toHaveBeenCalledWith('client', 'secret');
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('announces a failed login', async () => {
    auth.login.mockReturnValue(throwError(() => new Error('401')));
    await fillIn('alice', 'wrong');
    await (await submitButton()).click();
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Could not sign in');
    expect(navigate).not.toHaveBeenCalled();
    await expectNoAxeViolations(fixture);
  });
});
