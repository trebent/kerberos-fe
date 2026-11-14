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
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(Debug);
    fixture.componentRef.setInput('backends', ['echo', 'other']);
    await fixture.whenStable();
  });

  /** Picks an option in one of the panel's selects. Ticks, as pending requests block stability. */
  function choose(selectLabel: string, option: string): void {
    const select = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('mat-form-field'))
      .find((field) => field.querySelector('mat-label')?.textContent?.trim() === selectLabel)!
      .querySelector<HTMLElement>('.mat-mdc-select-trigger')!;
    select.click();
    TestBed.tick();
    Array.from(document.querySelectorAll<HTMLElement>('mat-option'))
      .find((element) => element.textContent?.trim().startsWith(option))!
      .click();
    TestBed.tick();
  }

  afterEach(() => http.verify());

  it('ignores sessions of a backend that is no longer selected', async () => {
    choose('Select backend', 'echo');
    const echoRequest = http.expectOne((req) => req.url.endsWith(sessionsUrl('echo')));

    choose('Select backend', 'other');
    http.expectOne((req) => req.url.endsWith(sessionsUrl('other'))).flush([session(2)]);
    // A resource applies its response after a microtask.
    await fixture.whenStable();

    expect(echoRequest.cancelled).toBe(true);
    choose('Select session', '#2');
    expect(fixture.nativeElement.querySelector('.session-meta')?.textContent).toMatch(
      /Session ID\s*2/,
    );
  });

  it('explains a failed session load', async () => {
    choose('Select backend', 'echo');
    http
      .expectOne((req) => req.url.endsWith(sessionsUrl('echo')))
      .flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load debug sessions.');
    await expectNoAxeViolations(fixture);
  });

  it('explains a session that could not be started', async () => {
    choose('Select backend', 'echo');
    http.expectOne((req) => req.url.endsWith(sessionsUrl('echo'))).flush([]);
    await fixture.whenStable();

    const start = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Start new debug session'))!;
    start.click();
    http
      .expectOne((req) => req.method === 'POST' && req.url.endsWith(sessionsUrl('echo')))
      .flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to start a debug session.');
    await expectNoAxeViolations(fixture);
  });
});
