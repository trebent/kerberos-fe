import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { expectNoAxeViolations } from '../../../testing/axe';
import { AuthBasic } from './auth-basic';

describe('AuthBasic', () => {
  let fixture: ComponentFixture<AuthBasic>;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(AuthBasic);
    // Resources stay pending until their requests are flushed, so don't wait for stability yet.
    TestBed.tick();
    http
      .expectOne((req) => req.url.endsWith('/api/auth/basic/organisations'))
      .flush([
        { id: 7, name: 'acme' },
        { id: 8, name: 'globex' },
      ]);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('asks for an organisation before showing its users and groups', async () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('h1')?.textContent).toContain('Basic authentication');
    expect(element.textContent).toContain('acme');
    expect(element.textContent).toContain('Select an organisation to manage its users.');
    await expectNoAxeViolations(fixture);
  });

  it('loads the users and groups of the selected organisation', async () => {
    fixture.nativeElement.querySelector('[aria-label="Select organisation acme"]').click();
    TestBed.tick();

    http
      .expectOne((req) => req.url.endsWith('/api/auth/basic/organisations/7/users'))
      .flush([{ id: 1, name: 'bob', groups: [{ id: 2, name: 'staff' }] }]);
    http
      .expectOne((req) => req.url.endsWith('/api/auth/basic/organisations/7/groups'))
      .flush([{ id: 2, name: 'staff' }]);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('bob');
    expect(
      element
        .querySelector('[aria-label="Select organisation acme"]')
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
    await expectNoAxeViolations(fixture);
  });

  it('closes the user edit panel when another organisation is selected', async () => {
    const element: HTMLElement = fixture.nativeElement;
    const click = (label: string) =>
      element.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!.click();

    click('Select organisation acme');
    TestBed.tick();
    http
      .expectOne((req) => req.url.endsWith('/api/auth/basic/organisations/7/users'))
      .flush([{ id: 1, name: 'bob', groups: [] }]);
    http.expectOne((req) => req.url.endsWith('/api/auth/basic/organisations/7/groups')).flush([]);
    await fixture.whenStable();

    click('Edit user bob');
    TestBed.tick();
    http.expectOne((req) => req.url.endsWith('/api/auth/basic/organisations/7/groups')).flush([]);
    http
      .expectOne((req) => req.url.endsWith('/api/auth/basic/organisations/7/users/1/groups'))
      .flush([]);
    await fixture.whenStable();
    expect(element.querySelector('app-org-user-detail')).not.toBeNull();

    click('Select organisation globex');
    TestBed.tick();
    http.expectOne((req) => req.url.endsWith('/api/auth/basic/organisations/8/users')).flush([]);
    http.expectOne((req) => req.url.endsWith('/api/auth/basic/organisations/8/groups')).flush([]);
    await fixture.whenStable();

    expect(element.querySelector('app-org-user-detail')).toBeNull();
    await expectNoAxeViolations(fixture);
  });

  it("drops the previous organisation's users when the next one fails to load", async () => {
    const element: HTMLElement = fixture.nativeElement;
    const click = (label: string) =>
      element.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!.click();

    click('Select organisation acme');
    TestBed.tick();
    http
      .expectOne((req) => req.url.endsWith('/api/auth/basic/organisations/7/users'))
      .flush([{ id: 1, name: 'bob', groups: [] }]);
    http.expectOne((req) => req.url.endsWith('/api/auth/basic/organisations/7/groups')).flush([]);
    await fixture.whenStable();
    expect(element.textContent).toContain('bob');

    click('Select organisation globex');
    TestBed.tick();
    http
      .expectOne((req) => req.url.endsWith('/api/auth/basic/organisations/8/users'))
      .flush(null, { status: 500, statusText: 'Server Error' });
    http.expectOne((req) => req.url.endsWith('/api/auth/basic/organisations/8/groups')).flush([]);
    await fixture.whenStable();

    expect(element.textContent).toContain('Failed to load users.');
    expect(element.textContent).not.toContain('bob');
    await expectNoAxeViolations(fixture);
  });

  it('renames an organisation', async () => {
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('[aria-label="Edit organisation acme"]')!.click();
    await fixture.whenStable();

    const input = element.querySelector<HTMLInputElement>('app-rename-panel input')!;
    expect(input.value).toBe('acme');
    input.value = 'acme-corp';
    input.dispatchEvent(new Event('input'));
    input.form!.requestSubmit();

    const request = http.expectOne((req) => req.url.endsWith('/api/auth/basic/organisations/7'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ id: 7, name: 'acme-corp' });
    request.flush(null);
    // Saving reloads the list, which the resource requests on the next tick.
    TestBed.tick();
    http
      .expectOne((req) => req.url.endsWith('/api/auth/basic/organisations'))
      .flush([{ id: 7, name: 'acme-corp' }]);
    await fixture.whenStable();

    expect(element.querySelector('app-rename-panel')).toBeNull();
    await expectNoAxeViolations(fixture);
  });
});
