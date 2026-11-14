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

  it('shows a spinner while the flow loads', async () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[aria-label="Loading flow"]')).not.toBeNull();

    http.expectOne((req) => req.url.endsWith('/api/admin/flow')).flush(flow);
    await fixture.whenStable();
    expect(element.querySelector('[aria-label="Loading flow"]')).toBeNull();
  });

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

  it('opens an OpenAPI specification from the tools menu', async () => {
    http.expectOne((req) => req.url.endsWith('/api/admin/flow')).flush(flow);
    await fixture.whenStable();

    // Drive the menu by hand: harnesses wait for stability, which the pending spec request blocks.
    fixture.nativeElement.querySelector('[aria-label="OpenAPI specification"]').click();
    await fixture.whenStable();
    document.querySelector<HTMLButtonElement>('[role="menuitemradio"]')?.click();
    TestBed.tick();
    http
      .expectOne((req) => req.url.endsWith('/api/admin/oas/echo'))
      .flush(new Blob(['openapi: 3.0.0']));
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('app-oas h2')?.textContent).toContain('echo');
    expect(element.querySelector('app-oas pre')?.textContent).toContain('openapi: 3.0.0');
    await expectNoAxeViolations(fixture);
  });

  it('toggles the debug panel', async () => {
    http.expectOne((req) => req.url.endsWith('/api/admin/flow')).flush(flow);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const debugButton = Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim().endsWith('Debug'),
    )!;
    expect(debugButton.getAttribute('aria-expanded')).toBe('false');

    debugButton.click();
    await fixture.whenStable();
    expect(debugButton.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('app-debug')).not.toBeNull();
    await expectNoAxeViolations(fixture);

    debugButton.click();
    await fixture.whenStable();
    expect(element.querySelector('app-debug')).toBeNull();
  });

  it('shows the debug panel and a specification at the same time', async () => {
    http.expectOne((req) => req.url.endsWith('/api/admin/flow')).flush(flow);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    Array.from(element.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.trim().endsWith('Debug'))!
      .click();
    await fixture.whenStable();

    element.querySelector<HTMLButtonElement>('[aria-label="OpenAPI specification"]')!.click();
    await fixture.whenStable();
    document.querySelector<HTMLButtonElement>('[role="menuitemradio"]')?.click();
    TestBed.tick();
    http
      .expectOne((req) => req.url.endsWith('/api/admin/oas/echo'))
      .flush(new Blob(['openapi: 3.0.0']));
    await fixture.whenStable();

    // Both panels sit in the tool column, debug above the specification.
    const panels = Array.from(
      element.querySelectorAll('.flow-tools app-debug, .flow-tools app-oas'),
    );
    expect(panels.map((panel) => panel.tagName.toLowerCase())).toEqual(['app-debug', 'app-oas']);
    await expectNoAxeViolations(fixture);
  });
});
