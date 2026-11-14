import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { createAuthStub, provideAuthStub } from '../../../testing/auth-stub';
import { expectNoAxeViolations } from '../../../testing/axe';
import { clickLabelled, fillIn, submitForm, toggleCheckbox } from '../../../testing/dom';
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

  async function loadPage(body: { groups?: object[] } = {}): Promise<void> {
    flushGets('/api/admin/users', users);
    flushGets('/api/admin/groups', body.groups ?? groups);
    flushGets('/api/admin/permissions', permissions);
    await fixture.whenStable();
  }

  /** Clicks an edit button and answers the list its panel loads. */
  async function openEditor(label: string, url: string, body: object[]): Promise<void> {
    clickLabelled(element, label);
    TestBed.tick();
    flushGets(url, body);
    await fixture.whenStable();
  }

  it('lists users, groups and permissions', async () => {
    await loadPage();

    expect(element.querySelector('h1')?.textContent).toContain('User management');
    expect(Array.from(element.querySelectorAll('h2')).map((h) => h.textContent?.trim())).toEqual([
      'Profile',
      'Users',
      'Groups',
      'Permissions',
    ]);
    expect(element.textContent).toContain('alice');
    expect(element.textContent).toContain('users:write');
    await expectNoAxeViolations(fixture);
  });

  it('creates a user and reloads the list', async () => {
    await loadPage();

    const create = element.querySelector('app-users [create]')!;
    fillIn(create, { Username: 'bob', Password: 'secret' });
    submitForm(create.querySelector('input')!);

    expect(expectRequest('POST', '/api/admin/users')).toEqual({
      username: 'bob',
      password: 'secret',
    });
    TestBed.tick();
    flushGets('/api/admin/users', users);
    await fixture.whenStable();
  });

  it('creates a group with the ticked permissions', async () => {
    await loadPage();

    const create = element.querySelector('app-groups [create]')!;
    fillIn(create, { Name: 'writers' });
    toggleCheckbox(create, 'users:write');
    submitForm(create.querySelector('input')!);

    expect(expectRequest('POST', '/api/admin/groups')).toEqual({
      name: 'writers',
      permissionIDs: [2],
    });
    TestBed.tick();
    flushGets('/api/admin/groups', groups);
    await fixture.whenStable();
  });

  it('opens the user editor', async () => {
    await loadPage();
    await openEditor('Edit user alice', '/api/admin/groups', groups);

    expect(element.querySelector('app-user-edit')).not.toBeNull();
    await expectNoAxeViolations(fixture);
  });

  it('saves the username, then the group membership', async () => {
    await loadPage();
    await openEditor('Edit user alice', '/api/admin/groups', groups);

    const editor = element.querySelector('app-user-edit')!;
    fillIn(editor, { Username: 'alicia' });
    toggleCheckbox(editor, 'admins');
    submitForm(editor.querySelector('input')!);

    expect(expectRequest('PUT', '/api/admin/users/1')).toEqual({ username: 'alicia' });
    expect(expectRequest('PUT', '/api/admin/users/1/groups')).toEqual({ groupIDs: [] });
    TestBed.tick();
    flushGets('/api/admin/users', users);
    await fixture.whenStable();

    expect(element.querySelector('app-user-edit')).toBeNull();
  });

  it('opens the group editor for a group listed without its permissions', async () => {
    await loadPage({ groups: [{ id: 2, name: 'staff' }] });
    await openEditor('Edit group staff', '/api/admin/permissions', permissions);

    const nameInput = element.querySelector<HTMLInputElement>('app-group-edit input');
    expect(nameInput?.value).toBe('staff');
    await expectNoAxeViolations(fixture);
  });

  it('saves a group with its name and ticked permissions', async () => {
    await loadPage();
    await openEditor('Edit group admins', '/api/admin/permissions', permissions);

    const editor = element.querySelector('app-group-edit')!;
    fillIn(editor, { Name: 'owners' });
    toggleCheckbox(editor, 'users:read');
    submitForm(editor.querySelector('input')!);

    expect(expectRequest('PUT', '/api/admin/groups/1')).toEqual({
      name: 'owners',
      permissionIDs: [2],
    });
    TestBed.tick();
    flushGets('/api/admin/groups', groups);
    await fixture.whenStable();

    expect(element.querySelector('app-group-edit')).toBeNull();
  });

  it('keeps the user editor open and explains a failed delete', async () => {
    await loadPage();
    await openEditor('Edit user alice', '/api/admin/groups', groups);

    clickLabelled(element, 'Delete user alice');
    http
      .expectOne((req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/users/1'))
      .flush(null, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();

    expect(element.textContent).toContain('Failed to delete user.');
    expect(element.querySelector('app-user-edit')).not.toBeNull();
    await expectNoAxeViolations(fixture);
  });

  it('confirms a username change', async () => {
    await loadPage();

    const profile = element.querySelector('app-profile')!;
    fillIn(profile, { 'New username': 'alicia' });
    await fixture.whenStable();
    submitForm(profile.querySelector('input')!);
    await fixture.whenStable();

    expect(profile.querySelector('[role="status"]')?.textContent).toContain(
      'Username updated successfully.',
    );
    await expectNoAxeViolations(fixture);
  });
});
