import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { expectNoAxeViolations } from '../../../testing/axe';
import {
  clickButton,
  clickLabelled,
  fillIn,
  submitForm,
  toggleCheckbox,
} from '../../../testing/dom';
import { AuthBasic } from './auth-basic';

const ORGS = '/api/auth/basic/organisations';

describe('AuthBasic', () => {
  let fixture: ComponentFixture<AuthBasic>;
  let element: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(AuthBasic);
    element = fixture.nativeElement;
    // Resources stay pending until their requests are flushed, so don't wait for stability yet.
    TestBed.tick();
    flushGet(ORGS, [
      { id: 7, name: 'acme' },
      { id: 8, name: 'globex' },
    ]);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  function flushGet(url: string, body: object | null, status = 200): void {
    http
      .expectOne((req) => req.method === 'GET' && req.url.endsWith(url))
      .flush(body, status === 200 ? {} : { status, statusText: 'Error' });
  }

  /** Answers the one request with this method and URL, and returns its body. */
  function expectRequest(method: string, url: string, response: object | null = null): unknown {
    const request = http.expectOne((req) => req.method === method && req.url.endsWith(url));
    request.flush(response);
    return request.request.body;
  }

  /** Selects an organisation and answers its user and group lists. */
  async function selectOrg(name: string, id: number, users: object[] = []): Promise<void> {
    clickLabelled(element, `Select organisation ${name}`);
    TestBed.tick();
    flushGet(`${ORGS}/${id}/users`, users);
    flushGet(`${ORGS}/${id}/groups`, []);
    await fixture.whenStable();
  }

  /** Opens bob's edit panel in acme, where he is in staff and ops also exists. */
  async function openBob(): Promise<Element> {
    await selectOrg('acme', 7, [{ id: 1, name: 'bob', groups: [] }]);
    clickLabelled(element, 'Edit user bob');
    TestBed.tick();
    flushGet(`${ORGS}/7/groups`, [
      { id: 2, name: 'staff' },
      { id: 3, name: 'ops' },
    ]);
    flushGet(`${ORGS}/7/users/1/groups`, [{ id: 2, name: 'staff' }]);
    await fixture.whenStable();
    return element.querySelector('app-org-user-detail')!;
  }

  it('asks for an organisation before showing its users and groups', async () => {
    expect(element.querySelector('h1')?.textContent).toContain('Basic authentication');
    expect(element.textContent).toContain('acme');
    expect(element.textContent).toContain('Select an organisation to manage its users.');
    await expectNoAxeViolations(fixture);
  });

  it('creates an organisation and shows its admin credentials once', async () => {
    const create = element.querySelector('app-organisations-list [create]')!;
    fillIn(create, { Name: 'initech' });
    submitForm(create.querySelector('input')!);

    expect(
      expectRequest('POST', ORGS, {
        id: 9,
        name: 'initech',
        adminUserId: 1,
        adminUsername: 'admin',
        adminPassword: 's3cret',
      }),
    ).toEqual({ name: 'initech' });
    TestBed.tick();
    flushGet(ORGS, [{ id: 9, name: 'initech' }]);
    await fixture.whenStable();

    expect(create.textContent).toContain('s3cret');
    await expectNoAxeViolations(fixture);

    clickButton(create, 'Dismiss');
    await fixture.whenStable();
    expect(create.textContent).not.toContain('s3cret');
  });

  it('loads the users and groups of the selected organisation', async () => {
    clickLabelled(element, 'Select organisation acme');
    TestBed.tick();
    flushGet(`${ORGS}/7/users`, [{ id: 1, name: 'bob', groups: [{ id: 2, name: 'staff' }] }]);
    flushGet(`${ORGS}/7/groups`, [{ id: 2, name: 'staff' }]);
    await fixture.whenStable();

    expect(element.textContent).toContain('bob');
    expect(
      element
        .querySelector('[aria-label="Select organisation acme"]')
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
    await expectNoAxeViolations(fixture);
  });

  it('creates a user in the selected organisation', async () => {
    await selectOrg('acme', 7);

    const create = element.querySelector('app-org-users-list [create]')!;
    fillIn(create, { Name: 'carol', Password: 'secret' });
    submitForm(create.querySelector('input')!);

    expect(expectRequest('POST', `${ORGS}/7/users`)).toEqual({ name: 'carol', password: 'secret' });
    TestBed.tick();
    flushGet(`${ORGS}/7/users`, []);
    await fixture.whenStable();
  });

  it("saves a user's name and groups from the edit panel", async () => {
    const detail = await openBob();

    fillIn(detail, { Name: 'robert' });
    submitForm(detail.querySelector('input')!);
    expect(expectRequest('PUT', `${ORGS}/7/users/1`)).toEqual({ id: 1, name: 'robert' });
    TestBed.tick();
    flushGet(`${ORGS}/7/users`, [{ id: 1, name: 'robert', groups: [] }]);
    await fixture.whenStable();
    expect(detail.textContent).toContain('Name updated successfully.');

    toggleCheckbox(detail, 'ops');
    clickButton(detail, 'Save groups');
    expect(expectRequest('PUT', `${ORGS}/7/users/1/groups`)).toEqual([
      { id: 2, name: 'staff' },
      { id: 3, name: 'ops' },
    ]);
    TestBed.tick();
    flushGet(`${ORGS}/7/users`, []);
    await fixture.whenStable();
    expect(detail.textContent).toContain('Groups updated successfully.');
    await expectNoAxeViolations(fixture);
  });

  it("changes a user's password through the organisation endpoint", async () => {
    const detail = await openBob();

    fillIn(detail, {
      'Current password': 'old',
      'New password': 'new',
      'Confirm new password': 'new',
    });
    await fixture.whenStable();
    clickButton(detail, 'Change password');

    expect(expectRequest('PUT', `${ORGS}/7/users/1/password`)).toEqual({
      oldPassword: 'old',
      password: 'new',
    });
  });

  it('closes the user edit panel when another organisation is selected', async () => {
    await openBob();
    expect(element.querySelector('app-org-user-detail')).not.toBeNull();

    await selectOrg('globex', 8);

    expect(element.querySelector('app-org-user-detail')).toBeNull();
    await expectNoAxeViolations(fixture);
  });

  it("drops the previous organisation's users when the next one fails to load", async () => {
    await selectOrg('acme', 7, [{ id: 1, name: 'bob', groups: [] }]);
    expect(element.textContent).toContain('bob');

    clickLabelled(element, 'Select organisation globex');
    TestBed.tick();
    flushGet(`${ORGS}/8/users`, null, 500);
    flushGet(`${ORGS}/8/groups`, []);
    await fixture.whenStable();

    expect(element.textContent).toContain('Failed to load users.');
    expect(element.textContent).not.toContain('bob');
    await expectNoAxeViolations(fixture);
  });

  it('renames an organisation', async () => {
    clickLabelled(element, 'Edit organisation acme');
    await fixture.whenStable();

    const panel = element.querySelector('app-rename-panel')!;
    expect(panel.querySelector('input')?.value).toBe('acme');
    fillIn(panel, { Name: 'acme-corp' });
    submitForm(panel.querySelector('input')!);

    expect(expectRequest('PUT', `${ORGS}/7`)).toEqual({ id: 7, name: 'acme-corp' });
    // Saving reloads the list, which the resource requests on the next tick.
    TestBed.tick();
    flushGet(ORGS, [{ id: 7, name: 'acme-corp' }]);
    await fixture.whenStable();

    expect(element.querySelector('app-rename-panel')).toBeNull();
    await expectNoAxeViolations(fixture);
  });
});
