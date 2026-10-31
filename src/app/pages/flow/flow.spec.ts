import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { expectNoAxeViolations } from '../../../testing/axe';
import { FlowMeta } from '../../services/admin';
import { Flow } from './flow';

const flow = [
  { name: 'obs', data: {} },
  { name: 'router', data: { backends: [{ name: 'echo', host: 'echo.local', port: 8080 }] } },
  { name: 'oas-validator', data: { backends: ['echo'] } },
  { name: 'forwarder', data: {} },
] as unknown as FlowMeta[];

describe('Flow', () => {
  let fixture: ComponentFixture<Flow>;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(Flow);
    // Resources stay pending until their requests are flushed, so don't wait for stability yet.
    TestBed.tick();
  });

  afterEach(() => http.verify());

  it('renders the pipeline and its backends', async () => {
    http.expectOne((req) => req.url.endsWith('/api/admin/flow')).flush(flow);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('h1')?.textContent).toContain('Flow');
    expect(
      Array.from(element.querySelectorAll('.flow-box')).map((box) => box.textContent?.trim()),
    ).toEqual(['obs', 'router', 'oas-validator', 'forwarder']);
    expect(element.querySelector('.backend-box')?.textContent?.trim()).toBe('echo');
    await expectNoAxeViolations(fixture);
  });

  it('explains a failed load', async () => {
    http
      .expectOne((req) => req.url.endsWith('/api/admin/flow'))
      .flush(null, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load flow view.');
    await expectNoAxeViolations(fixture);
  });
});
