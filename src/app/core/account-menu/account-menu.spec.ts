import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { provideRouter } from '@angular/router';

import { AuthStub, createAuthStub, provideAuthStub } from '../../../testing/auth-stub';
import { expectNoAxeViolations } from '../../../testing/axe';
import { fillIn, submitForm } from '../../../testing/dom';
import { AccountMenu } from './account-menu';

describe('AccountMenu', () => {
  let auth: AuthStub;
  let fixture: ComponentFixture<AccountMenu>;
  let loader: HarnessLoader;

  function setUp(options: { username: string; isSuperuser?: boolean }): void {
    auth = createAuthStub(options);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideAuthStub(auth),
        // Dialogs open and close without waiting for animations.
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    fixture = TestBed.createComponent(AccountMenu);
    loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  }

  async function itemTexts(): Promise<string[]> {
    const menu = await loader.getHarness(MatMenuHarness);
    await menu.open();
    return Promise.all((await menu.getItems()).map((item) => item.getText()));
  }

  async function openDialog(item: RegExp): Promise<Element> {
    const menu = await loader.getHarness(MatMenuHarness);
    await menu.clickItem({ text: item });
    // The dialog's code loads on first use.
    await vi.waitFor(() => expect(document.querySelector('mat-dialog-container')).not.toBeNull());
    await fixture.whenStable();
    return document.querySelector('mat-dialog-container')!;
  }

  const snackBarText = () => document.querySelector('mat-snack-bar-container')?.textContent;

  it('offers a user their username, password and logout', async () => {
    setUp({ username: 'alice' });
    await fixture.whenStable();

    expect(await itemTexts()).toEqual([
      'badgeChange username…',
      'passwordChange password…',
      'logoutLog out',
    ]);
    await expectNoAxeViolations(fixture, document.querySelector('[role="menu"]')!);
  });

  it('offers the superuser only a password change and logout', async () => {
    setUp({ username: 'superuser', isSuperuser: true });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('button').getAttribute('aria-label')).toBe(
      'Account: Superuser',
    );
    expect(await itemTexts()).toEqual(['passwordChange password…', 'logoutLog out']);
  });

  it('changes the username in a dialog and confirms it', async () => {
    setUp({ username: 'alice' });
    await fixture.whenStable();
    const dialog = await openDialog(/Change username/);

    expect(dialog.querySelector('input')?.value).toBe('alice');
    await expectNoAxeViolations(fixture, dialog);

    fillIn(dialog, { Username: 'alicia' });
    submitForm(dialog.querySelector('input')!);
    await fixture.whenStable();

    expect(auth.updateUsername).toHaveBeenCalledWith('alicia');
    expect(document.querySelector('app-change-username-dialog')).toBeNull();
    expect(snackBarText()).toContain('Username changed to alicia');
  });

  it('changes the password in a dialog and confirms it', async () => {
    setUp({ username: 'alice' });
    await fixture.whenStable();
    const dialog = await openDialog(/Change password/);

    fillIn(dialog, {
      'Current password': 'old',
      'New password': 'new',
      'Confirm new password': 'new',
    });
    await fixture.whenStable();
    submitForm(dialog.querySelector('input')!);
    await fixture.whenStable();

    expect(auth.changeOwnPassword).toHaveBeenCalledWith('old', 'new');
    expect(document.querySelector('app-change-password-dialog')).toBeNull();
    expect(snackBarText()).toContain('Password changed');
  });
});
