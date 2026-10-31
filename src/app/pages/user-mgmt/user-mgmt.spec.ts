import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { createAuthStub, provideAuthStub } from '../../../testing/auth-stub';
import { expectNoAxeViolations } from '../../../testing/axe';
import { UserMgmt } from './user-mgmt';

const permissions = [
  { id: 1, name: 'users:read' },
  { id: 2, name: 'users:write' },
];
const groups = [{ id: 1, name: 'admins', permissions }];
const users = [{ id: 1, username: 'alice', groups }];

describe('UserMgmt', () => {
  let fixture: ComponentFixture<UserMgmt>;
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
    // Resources stay pending until their requests are flushed, so don't wait for stability yet.
    TestBed.tick();
  });

  afterEach(() => http.verify());

  const flushAll = (url: string, body: object) =>
    http.match((req) => req.url.endsWith(url)).forEach((req) => req.flush(body));

  it('lists users, groups and permissions', async () => {
    flushAll('/api/admin/users', users);
    flushAll('/api/admin/groups', groups);
    flushAll('/api/admin/permissions', permissions);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
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

  it('opens the user editor', async () => {
    flushAll('/api/admin/users', users);
    flushAll('/api/admin/groups', groups);
    flushAll('/api/admin/permissions', permissions);
    await fixture.whenStable();

    fixture.nativeElement.querySelector('[aria-label="Edit user alice"]').click();
    TestBed.tick();
    flushAll('/api/admin/groups', groups);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-user-edit')).not.toBeNull();
    await expectNoAxeViolations(fixture);
  });
});
