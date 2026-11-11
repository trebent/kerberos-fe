import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlowMeta } from '../../../../services/admin';
import { FlowPipeline } from './flow-pipeline';

const flow = [
  { name: 'obs', data: {} },
  { name: 'router', data: { backends: [{ name: 'echo', host: 'echo.local', port: 8080 }] } },
] as unknown as FlowMeta[];

describe('FlowPipeline', () => {
  let fixture: ComponentFixture<FlowPipeline>;

  /** jsdom has no layout, so give the flow card the widths a browser would report. */
  function fakeCardWidths(widths: { content: number; box: number }): void {
    const width = (name: 'scrollWidth' | 'clientWidth' | 'offsetWidth', value: number) =>
      vi.spyOn(HTMLElement.prototype, name, 'get').mockImplementation(function (this: HTMLElement) {
        return this.classList.contains('flow-card') ? value : 0;
      });
    width('scrollWidth', widths.content);
    width('clientWidth', widths.box);
    width('offsetWidth', widths.box);
  }

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(FlowPipeline);
    fixture.componentRef.setInput('flowMetas', flow);
    await fixture.whenStable();
  }

  const isVertical = () => (fixture.nativeElement as HTMLElement).classList.contains('vertical');

  afterEach(() => vi.restoreAllMocks());

  it('runs left to right when the pipeline fits', async () => {
    fakeCardWidths({ content: 600, box: 600 });
    await render();

    expect(isVertical()).toBe(false);
  });

  it('runs top to bottom instead of scrolling when the pipeline does not fit', async () => {
    fakeCardWidths({ content: 900, box: 600 });
    await render();

    expect(isVertical()).toBe(true);
  });
});
