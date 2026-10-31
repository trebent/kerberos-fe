# Testing Material components (component harnesses)

Condensed from https://material.angular.dev/guide/using-component-harnesses. The Angular
team strongly encourages harnesses: they interact with components the way a user would and
insulate tests from DOM-structure changes.

## Why harnesses

- Readable: `await buttonHarness.click()` beats querying `button.mat-mdc-button`.
- Robust: internal class names/DOM can change across Material versions; harness APIs don't.
- Same harness works in Karma unit tests and Selenium/WebDriver e2e.

## Unit test setup

```ts
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {HarnessLoader} from '@angular/cdk/testing';
import {MatButtonHarness} from '@angular/material/button/testing';

describe('Login', () => {
  let loader: HarnessLoader;
  let fixture: ComponentFixture<Login>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('submits when enabled', async () => {
    const submit = await loader.getHarness(MatButtonHarness.with({text: 'Sign in'}));
    await submit.click();  // all harness APIs are async — await them
  });
});
```

Path map: `@angular/cdk/testing` (shared), `@angular/cdk/testing/testbed` (Karma),
`@angular/cdk/testing/selenium-webdriver` (e2e).

## Loading harnesses

- `loader.getHarness(MatButtonHarness)` — first match; throws if none.
- `loader.getAllHarnesses(MatButtonHarness)` — all matches.
- `loader.getChildLoader('.footer')` — scoped sub-loader.
- Filter with the static `with()` (a `HarnessPredicate`):

```ts
await loader.getHarness(MatButtonHarness.with({text: 'Sign in', disabled: false}));
```

Harnesses live at `@angular/material/<component>/testing`, e.g.
`@angular/material/form-field/testing` (`MatFormFieldHarness`), `@angular/material/input/testing`
(`MatInputHarness`), `@angular/material/select/testing` (`MatSelectHarness`),
`@angular/material/table/testing` (`MatTableHarness`, `MatRowHarness`), etc.

## Typical interactions

```ts
const input = await loader.getHarness(MatInputHarness.with({selector: '#email'}));
await input.setValue('a@b.com');
await input.isDisabled();   // boolean getters, also async

const select = await loader.getHarness(MatSelectHarness);
await select.open();
const options = await select.getOptions();
await options[1].click();
```

## What to assert where

- Use harnesses for user interactions (click, type, select); keep regular Angular test
  patterns for component state (signals, services, router).
- Do NOT assert on Material internal classes or DOM structure in tests — that defeats the
  harness and breaks on upgrades.
- For dialogs/snack bars rendered in overlay containers, load harnesses via
  `TestbedHarnessEnvironment.documentRootLoader(fixture)` — overlay content is outside the
  fixture's root element.
- Custom Material form controls: implement `MatFormFieldControl` harnesses via
  `HarnessLoader` composition when needed (see CDK testing docs).
