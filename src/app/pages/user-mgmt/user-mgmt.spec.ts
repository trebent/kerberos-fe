import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';

import { createAuthStub, provideAuthStub } from '../../../testing/auth-stub';
import { expectNoAxeViolations } from '../../../testing/axe';
import {
  clickButton,
  clickLabelled,
  fillIn,
  openDialog,
  snackBarText,
  submitForm,
  toggleCheckbox,
  typeInto,
} from '../../../testing/dom';
import { UserMgmt } from './user-mgmt';

const permissions = [
  { id: 1, name: 'users:read' },
  { id: 2, name: 'users:write' },
];
const groups = [{ id: 1, name: 'admins', permissions }];
const users = [{ id: 1, username: 'alice', groups }];

describe('UserMgmt', () => {
  let fixture: ComponentFixture<UserMgmt>;
  let element: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAuthStub(createAuthStub({ username: 'alice' })),
        // Dialogs open and close without waiting for animations.
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(UserMgmt);
    element = fixture.nativeElement;
    // Resources stay pending until their requests are flushed, so don't wait for stability yet.
    TestBed.tick();
  });

  afterEach(() => http.verify());

  /** Answers every pending GET for `url`; several cards load the same list. */
  const flushGets = (url: string, body: object) =>
    http
      .match((req) => req.method === 'GET' && req.url.endsWith(url))
      .forEach((req) => req.flush(body));

  /** Answers the one request with this method and URL, and returns its body. */
  const expectRequest = (method: string, url: string): unknown => {
    const request = http.expectOne((req) => req.method === method && req.url.endsWith(url));
    request.flush(null);
    return request.request.body;
  };

  /** Answers the list reload a closing dialog triggers, once the dialog has finished closing. */
  async function flushReload(url: string, body: object): Promise<void> {
    await vi.waitFor(() => {
      TestBed.tick();
      http.expectOne((req) => req.method === 'GET' && req.url.endsWith(url)).flush(body);
    });
    await fixture.whenStable();
  }

  async function loadPage(body: { groups?: object[] } = {}): Promise<void> {
    flushGets('/api/admin/users', users);
    flushGets('/api/admin/groups', body.groups ?? groups);
    flushGets('/api/admin/permissions', permissions);
    await fixture.whenStable();
  }

  /** Opens a dialog from the page, answers the list it loads, and returns it. */
  async function openFromPage(open: () => void, url?: string, body?: object[]): Promise<Element> {
    open();
    TestBed.tick();
    if (url && body) flushGets(url, body);
    await fixture.whenStable();
    return openDialog();
  }

  it('shows placeholder rows while the lists load', async () => {
    const users = element.querySelector('app-users')!;
    expect(users.querySelectorAll('.skeleton-row').length).toBe(5);
    expect(users.querySelector('[aria-busy="true"] [role="status"]')?.textContent).toContain(
      'Loading users…',
    );

    await loadPage();
    expect(users.querySelector('.skeleton-row')).toBeNull();
  });

  it('lists users, groups and permissions', async () => {
    await loadPage();

    expect(element.querySelector('h1')?.textContent).toContain('User management');
    expect(Array.from(element.querySelectorAll('h2')).map((h) => h.textContent?.trim())).toEqual([
      'Users',
      'Groups',
      'Permissions',
    ]);
    expect(element.textContent).toContain('alice');
    expect(element.textContent).toContain('users:write');
    await expectNoAxeViolations(fixture);
  });

  it('says when the filter matches nothing', async () => {
    await loadPage();
    const usersCard = element.querySelector('app-users')!;

    typeInto(usersCard.querySelector('input[aria-label="Filter users"]')!, 'zed');
    await fixture.whenStable();

    expect(usersCard.textContent).toContain('No users match “zed”');
    await expectNoAxeViolations(fixture);
  });

  it('creates a user in a dialog, reloads the list and confirms it', async () => {
    await loadPage();
    const dialog = await openFromPage(() =>
      clickButton(element.querySelector('app-users')!, 'Add user'),
    );
    await expectNoAxeViolations(fixture, dialog);

    fillIn(dialog, { Username: 'bob', Password: 'secret' });
    submitForm(dialog.querySelector('input')!);

    expect(expectRequest('POST', '/api/admin/users')).toEqual({
      username: 'bob',
      password: 'secret',
    });
    await flushReload('/api/admin/users', users);
    expect(document.querySelector('app-user-create')).toBeNull();
    expect(snackBarText()).toContain('User bob created');
  });

  it('creates a group with the ticked permissions', async () => {
    await loadPage();
    const dialog = await openFromPage(
      () => clickButton(element.querySelector('app-groups')!, 'Add group'),
      '/api/admin/permissions',
      permissions,
    );

    fillIn(dialog, { Name: 'writers' });
    toggleCheckbox(dialog, 'users:write');
    submitForm(dialog.querySelector('input')!);

    expect(expectRequest('POST', '/api/admin/groups')).toEqual({
      name: 'writers',
      permissionIDs: [2],
    });
    await flushReload('/api/admin/groups', groups);
    expect(snackBarText()).toContain('Group writers created');
  });

  it('shows placeholder checkboxes while the editor loads its groups', async () => {
    await loadPage();
    clickLabelled(element, 'Edit user alice');
    // The groups request is still pending, so render without waiting for stability.
    TestBed.tick();
    fixture.detectChanges();

    const dialog = openDialog();
    expect(dialog.querySelectorAll('.skeleton-line').length).toBe(3);
    expect(dialog.querySelector('[role="status"]')?.textContent).toContain('Loading groups…');
    flushGets('/api/admin/groups', groups);
    await fixture.whenStable();
    expect(dialog.querySelector('.skeleton-line')).toBeNull();
  });

  it('opens the user editor in a dialog', async () => {
    await loadPage();
    const dialog = await openFromPage(
      () => clickLabelled(element, 'Edit user alice'),
      '/api/admin/groups',
      groups,
    );

    expect(dialog.querySelector('app-user-edit')).not.toBeNull();
    expect(dialog.querySelector('input')?.value).toBe('alice');
    await expectNoAxeViolations(fixture, dialog);
  });

  it('saves the username, then the group membership', async () => {
    await loadPage();
    const editor = await openFromPage(
      () => clickLabelled(element, 'Edit user alice'),
      '/api/admin/groups',
      groups,
    );

    fillIn(editor, { Username: 'alicia' });
    toggleCheckbox(editor, 'admins');
    submitForm(editor.querySelector('input')!);

    expect(expectRequest('PUT', '/api/admin/users/1')).toEqual({ username: 'alicia' });
    expect(expectRequest('PUT', '/api/admin/users/1/groups')).toEqual({ groupIDs: [] });
    await flushReload('/api/admin/users', users);

    expect(document.querySelector('app-user-edit')).toBeNull();
    expect(snackBarText()).toContain('User alicia updated');
  });

  it('opens the group editor for a group listed without its permissions', async () => {
    await loadPage({ groups: [{ id: 2, name: 'staff' }] });
    const editor = await openFromPage(
      () => clickLabelled(element, 'Edit group staff'),
      '/api/admin/permissions',
      permissions,
    );

    expect(editor.querySelector('input')?.value).toBe('staff');
    await expectNoAxeViolations(fixture, editor);
  });

  it('saves a group with its name and ticked permissions', async () => {
    await loadPage();
    const editor = await openFromPage(
      () => clickLabelled(element, 'Edit group admins'),
      '/api/admin/permissions',
      permissions,
    );

    fillIn(editor, { Name: 'owners' });
    toggleCheckbox(editor, 'users:read');
    submitForm(editor.querySelector('input')!);

    expect(expectRequest('PUT', '/api/admin/groups/1')).toEqual({
      name: 'owners',
      permissionIDs: [2],
    });
    await flushReload('/api/admin/groups', groups);

    expect(document.querySelector('app-group-edit')).toBeNull();
  });

  it('asks before deleting, and does nothing when cancelled', async () => {
    await loadPage();
    const dialog = await openFromPage(() => clickLabelled(element, 'Delete user alice'));

    expect(dialog.querySelector('h2')?.textContent).toBe('Delete user alice?');
    await expectNoAxeViolations(fixture, dialog);

    clickButton(dialog, 'Cancel');
    await fixture.whenStable();
    expect(document.querySelector('app-confirm-delete')).toBeNull();
  });

  it('deletes a user once confirmed', async () => {
    await loadPage();
    const dialog = await openFromPage(() => clickLabelled(element, 'Delete user alice'));

    clickButton(dialog, 'Delete');
    await vi.waitFor(() => expectRequest('DELETE', '/api/admin/users/1'));
    await flushReload('/api/admin/users', []);

    expect(snackBarText()).toContain('User alice deleted');
    expect(element.querySelector('app-users')?.textContent).toContain('No users yet');
  });

  it('explains a failed delete', async () => {
    await loadPage();
    const dialog = await openFromPage(() => clickLabelled(element, 'Delete user alice'));

    clickButton(dialog, 'Delete');
    await vi.waitFor(() =>
      http
        .expectOne((req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/users/1'))
        .flush(null, { status: 403, statusText: 'Forbidden' }),
    );
    await fixture.whenStable();

    expect(element.textContent).toContain('Failed to delete user.');
    await expectNoAxeViolations(fixture);
  });
});
