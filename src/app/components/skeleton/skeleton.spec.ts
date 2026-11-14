import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Skeleton, SkeletonShape } from './skeleton';

@Component({
  imports: [Skeleton],
  template: `<app-skeleton [shape]="shape()" [lines]="lines()" width="12rem" height="5rem" />`,
})
class Host {
  readonly shape = signal<SkeletonShape>('text');
  readonly lines = signal(1);
}

describe('Skeleton', () => {
  const render = async (shape: SkeletonShape, lines = 1) => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.shape.set(shape);
    fixture.componentInstance.lines.set(lines);
    await fixture.whenStable();
    return fixture.nativeElement.querySelector('app-skeleton') as HTMLElement;
  };

  it('is hidden from assistive technology', async () => {
    const skeleton = await render('text');

    expect(skeleton.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders one bar per text line', async () => {
    const skeleton = await render('text', 3);

    expect(skeleton.classList).toContain('app-skeleton-text');
    expect(skeleton.querySelectorAll('.bar')).toHaveLength(3);
    expect(skeleton.style.width).toBe('12rem');
  });

  it('renders a single block for other shapes', async () => {
    const skeleton = await render('rect', 3);

    expect(skeleton.classList).toContain('app-skeleton-rect');
    expect(skeleton.querySelectorAll('.bar')).toHaveLength(1);
    expect(skeleton.style.getPropertyValue('--app-skeleton-height')).toBe('5rem');
  });
});
