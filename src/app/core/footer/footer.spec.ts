import { TestBed } from '@angular/core/testing';

import { expectNoAxeViolations } from '../../../testing/axe';
import { Footer } from './footer';

describe('Footer', () => {
  it('renders the app name and a copyright notice with trebent and license links', async () => {
    const fixture = TestBed.createComponent(Footer);
    await fixture.whenStable();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Kerberos');
    expect(text).toContain(`© ${new Date().getFullYear()}`);

    const links = Array.from<HTMLAnchorElement>(fixture.nativeElement.querySelectorAll('a')).map(
      (link) => [link.textContent?.trim(), link.href],
    );
    expect(links).toEqual([
      ['trebent', 'https://github.com/trebent'],
      ['BSD 3-Clause License', 'https://github.com/trebent/kerberos/blob/main/LICENSE'],
    ]);
    await expectNoAxeViolations(fixture);
  });
});
