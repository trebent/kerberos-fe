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
      .flush([{ id: 7, name: 'acme' }]);
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
});
