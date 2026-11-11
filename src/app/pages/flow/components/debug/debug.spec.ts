import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { expectNoAxeViolations } from '../../../../../testing/axe';
import { Debug } from './debug';

const sessionsUrl = (backend: string) => `/api/admin/debug/${backend}/sessions`;
const session = (id: number) => ({
  id,
  startedAt: '2026-01-01T10:00:00Z',
  expiresAt: '2026-01-01T11:00:00Z',
});

describe('Debug', () => {
  let fixture: ComponentFixture<Debug>;
  let debug: Debug;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(Debug);
    fixture.componentRef.setInput('backends', ['echo', 'other']);
    debug = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('ignores sessions of a backend that is no longer selected', () => {
    debug.selectedBackend.set('echo');
    TestBed.tick();
    const echoRequest = http.expectOne((req) => req.url.endsWith(sessionsUrl('echo')));

    debug.selectedBackend.set('other');
    TestBed.tick();
    http.expectOne((req) => req.url.endsWith(sessionsUrl('other'))).flush([session(2)]);

    expect(echoRequest.cancelled).toBe(true);
    expect(debug.sessions().map((s) => s.id)).toEqual([2]);
  });

  it('explains a failed session load', async () => {
    debug.selectedBackend.set('echo');
    TestBed.tick();
    http
      .expectOne((req) => req.url.endsWith(sessionsUrl('echo')))
      .flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load debug sessions.');
    await expectNoAxeViolations(fixture);
  });
});
