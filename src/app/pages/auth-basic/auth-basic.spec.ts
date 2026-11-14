import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { expectNoAxeViolations } from '../../../testing/axe';
import {
  clickButton,
  clickLabelled,
  fillIn,
  openDialog,
  snackBarText,
  submitForm,
  toggleCheckbox,
} from '../../../testing/dom';
import { AuthBasic } from './auth-basic';

const ORGS = '/api/auth/basic/organisations';
const orgs = [
  { id: 7, name: 'acme' },
  { id: 8, name: 'globex' },
];

describe('AuthBasic', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'auth-basic', component: AuthBasic }], withComponentInputBinding()),
        // Dialogs open and close without waiting for animations.
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  /** Answers the one GET for `url`, once the page has sent it. */
  async function flushGet(url: string, body: object | null, status = 200): Promise<void> {
    await vi.waitFor(() => {
      TestBed.tick();
      http
        .expectOne((req) => req.method === 'GET' && req.url.endsWith(url))
        .flush(body, status === 200 ? {} : { status, statusText: 'Error' });
    });
  }

  /** Answers the one request with this method and URL, and returns its body. */
  async function expectRequest(
    method: string,
    url: string,
    response: object | null = null,
  ): Promise<unknown> {
    let body: unknown;
    await vi.waitFor(() => {
      const request = http.expectOne((req) => req.method === method && req.url.endsWith(url));
      request.flush(response);
      body = request.request.body;
    });
    return body;
  }

  /** Answers the user and group lists of organisation `id`. */
  async function flushOrg(id: number, users: object[] = [], groups: object[] = []): Promise<void> {
    await flushGet(`${ORGS}/${id}/users`, users);
    await flushGet(`${ORGS}/${id}/groups`, groups);
    await harness.fixture.whenStable();
  }

  /** Opens the page with no organisation selected, and answers the organisation list. */
  async function open(): Promise<void> {
    const navigation = harness.navigateByUrl('/auth-basic');
    await flushGet(ORGS, orgs);
    await navigation;
    await harness.fixture.whenStable();
    element = harness.routeNativeElement!;
  }

  /** Opens the page on acme, and answers the organisation list and acme's lists. */
  async function openAcme(users: object[] = [], groups: object[] = []): Promise<void> {
    const navigation = harness.navigateByUrl('/auth-basic?org=7');
    await flushGet(ORGS, orgs);
    await flushOrg(7, users, groups);
    await navigation;
    element = harness.routeNativeElement!;
  }

  /** Opens bob's edit dialog in acme, where he is in staff and ops also exists. */
  async function openBob(): Promise<Element> {
    await openAcme([{ id: 1, name: 'bob', groups: [] }]);
    clickLabelled(element, 'Edit user bob');
    await flushGet(`${ORGS}/7/groups`, [
      { id: 2, name: 'staff' },
      { id: 3, name: 'ops' },
    ]);
    await flushGet(`${ORGS}/7/users/1/groups`, [{ id: 2, name: 'staff' }]);
    await harness.fixture.whenStable();
    return openDialog();
  }

  const orgLink = (name: string) =>
    Array.from(element.querySelectorAll<HTMLAnchorElement>('mat-nav-list a')).find((link) =>
      link.textContent?.includes(name),
    )!;

  it('shows placeholders while the organisations load', async () => {
    const navigation = harness.navigateByUrl('/auth-basic');
    await vi.waitFor(() => {
      TestBed.tick();
      expect(document.querySelectorAll('app-organisations-list .skeleton-item').length).toBe(4);
    });
    await flushGet(ORGS, orgs);
    await navigation;
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement!.querySelector('.skeleton-item')).toBeNull();
  });

  it('asks for an organisation before showing its users and groups', async () => {
    await open();

    expect(element.querySelector('h1')?.textContent).toContain('Basic authentication');
    expect(orgLink('acme').textContent).toContain('ID 7');
    expect(element.textContent).toContain('Select an organisation to manage its users and groups.');
    expect(element.querySelector('app-org-users-list')).toBeNull();
    await expectNoAxeViolations(harness.fixture, element);
  });

  it('loads the organisation named in the URL', async () => {
    await openAcme(
      [{ id: 1, name: 'bob', groups: [{ id: 2, name: 'staff' }] }],
      [{ id: 2, name: 'staff' }],
    );

    expect(element.querySelector('#org-detail-heading')?.textContent?.trim()).toBe('acme');
    expect(orgLink('acme').getAttribute('aria-current')).toBe('page');
    expect(element.querySelector('app-org-users-list')?.textContent).toContain('bob');
    await expectNoAxeViolations(harness.fixture, element);
  });

  it('selects an organisation through its link', async () => {
    await open();

    orgLink('globex').click();
    await flushOrg(8);

    expect(TestBed.inject(Router).url).toBe('/auth-basic?org=8');
    expect(element.querySelector('#org-detail-heading')?.textContent?.trim()).toBe('globex');
  });

  it('creates an organisation, shows its admin credentials once, then selects it', async () => {
    await open();
    clickLabelled(element, 'Add organisation');
    await harness.fixture.whenStable();
    const dialog = openDialog();

    fillIn(dialog, { Name: 'initech' });
    submitForm(dialog.querySelector('input')!);
    expect(
      await expectRequest('POST', ORGS, {
        id: 9,
        name: 'initech',
        adminUserId: 1,
        adminUsername: 'admin',
        adminPassword: 's3cret',
      }),
    ).toEqual({ name: 'initech' });
    await harness.fixture.whenStable();

    expect(dialog.textContent).toContain('s3cret');
    await expectNoAxeViolations(harness.fixture, dialog);

    clickButton(dialog, "I've saved these");
    await flushGet(ORGS, [...orgs, { id: 9, name: 'initech' }]);
    await flushOrg(9);

    expect(TestBed.inject(Router).url).toBe('/auth-basic?org=9');
    expect(document.querySelector('app-org-create')).toBeNull();
  });

  it('creates a user in the selected organisation', async () => {
    await openAcme();
    clickButton(element.querySelector('app-org-users-list')!, 'Add user');
    await harness.fixture.whenStable();
    const dialog = openDialog();
    // Password managers offer to save the new login only when they can pair these two fields.
    expect(dialog.querySelector('input:not([type])')?.getAttribute('autocomplete')).toBe(
      'username',
    );
    expect(dialog.querySelector('input[type="password"]')?.getAttribute('autocomplete')).toBe(
      'new-password',
    );

    fillIn(dialog, { Name: 'carol', Password: 'secret' });
    submitForm(dialog.querySelector('input')!);

    expect(await expectRequest('POST', `${ORGS}/7/users`)).toEqual({
      name: 'carol',
      password: 'secret',
    });
    await flushGet(`${ORGS}/7/users`, [{ id: 2, name: 'carol', groups: [] }]);
    await harness.fixture.whenStable();
    expect(snackBarText()).toContain('User carol created');
  });

  it("saves a user's name and groups with one Save, and reloads the users", async () => {
    const detail = await openBob();
    await expectNoAxeViolations(harness.fixture, detail);

    fillIn(detail, { Name: 'robert' });
    toggleCheckbox(detail, 'ops');
    submitForm(detail.querySelector('input')!);

    expect(await expectRequest('PUT', `${ORGS}/7/users/1`)).toEqual({ id: 1, name: 'robert' });
    expect(await expectRequest('PUT', `${ORGS}/7/users/1/groups`)).toEqual([
      { id: 2, name: 'staff' },
      { id: 3, name: 'ops' },
    ]);
    await flushGet(`${ORGS}/7/users`, [{ id: 1, name: 'robert', groups: [] }]);
    await harness.fixture.whenStable();

    expect(document.querySelector('app-org-user-detail')).toBeNull();
    expect(snackBarText()).toContain('User robert updated');
    expect(element.textContent).toContain('robert');
  });

  it("changes a user's password through the organisation endpoint", async () => {
    const detail = await openBob();

    fillIn(detail, {
      'Current password': 'old',
      'New password': 'new',
      'Confirm new password': 'new',
    });
    await harness.fixture.whenStable();
    clickButton(detail, 'Change password');

    expect(await expectRequest('PUT', `${ORGS}/7/users/1/password`)).toEqual({
      oldPassword: 'old',
      password: 'new',
    });
  });

  it("drops the previous organisation's users when the next one fails to load", async () => {
    await openAcme([{ id: 1, name: 'bob', groups: [] }]);
    expect(element.textContent).toContain('bob');

    orgLink('globex').click();
    await flushGet(`${ORGS}/8/users`, null, 500);
    await flushGet(`${ORGS}/8/groups`, []);
    await harness.fixture.whenStable();

    expect(element.textContent).toContain('Failed to load users.');
    expect(element.textContent).not.toContain('bob');
    await expectNoAxeViolations(harness.fixture, element);
  });

  it('renames the selected organisation', async () => {
    await openAcme();
    clickLabelled(element, 'Rename organisation acme');
    await harness.fixture.whenStable();

    const dialog = openDialog();
    expect(dialog.querySelector('h2')?.textContent).toBe('Rename organisation');
    expect(dialog.querySelector('input')?.value).toBe('acme');
    await expectNoAxeViolations(harness.fixture, dialog);
    fillIn(dialog, { Name: 'acme-corp' });
    submitForm(dialog.querySelector('input')!);

    expect(await expectRequest('PUT', `${ORGS}/7`)).toEqual({ id: 7, name: 'acme-corp' });
    await flushGet(ORGS, [{ id: 7, name: 'acme-corp' }]);
    await harness.fixture.whenStable();

    expect(document.querySelector('app-name-dialog')).toBeNull();
    expect(element.querySelector('#org-detail-heading')?.textContent?.trim()).toBe('acme-corp');
  });

  it('deletes the selected organisation once confirmed, and clears the selection', async () => {
    await openAcme();
    clickLabelled(element, 'Delete organisation acme');
    await harness.fixture.whenStable();

    const dialog = openDialog();
    expect(dialog.querySelector('h2')?.textContent).toBe('Delete organisation acme?');
    clickButton(dialog, 'Delete');

    await expectRequest('DELETE', `${ORGS}/7`);
    await flushGet(ORGS, [orgs[1]]);
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/auth-basic');
    expect(snackBarText()).toContain('Organisation acme deleted');
  });
});
