/**
 * DOM helpers for specs that drive components the way a user does: by labels and accessible
 * names rather than by selectors tied to how a form is implemented.
 */

/** The input of the Material form field labelled `label` inside `root`. */
export function field(root: Element, label: string): HTMLInputElement {
  const formField = Array.from(root.querySelectorAll('mat-form-field')).find(
    (candidate) => candidate.querySelector('mat-label')?.textContent?.trim() === label,
  );
  const input = formField?.querySelector<HTMLInputElement>('input');
  if (!input) throw new Error(`No form field labelled "${label}"`);
  return input;
}

/** Types `value` into `input` and leaves it, as a user tabbing through a form would. */
export function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
}

/** Fills the fields labelled by the keys of `values` inside `root`. */
export function fillIn(root: Element, values: Record<string, string>): void {
  for (const [label, value] of Object.entries(values)) {
    typeInto(field(root, label), value);
  }
}

/** Clicks the element whose accessible name is set with `aria-label`. */
export function clickLabelled(root: Element, label: string): void {
  const element = root.querySelector<HTMLElement>(`[aria-label="${label}"]`);
  if (!element) throw new Error(`Nothing labelled "${label}"`);
  element.click();
}

/** Clicks the button whose text is `text`. */
export function clickButton(root: Element, text: string): void {
  const button = Array.from(root.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === text,
  );
  if (!button) throw new Error(`No button "${text}"`);
  button.click();
}

/** Toggles the Material checkbox labelled `label` inside `root`. */
export function toggleCheckbox(root: Element, label: string): void {
  const checkbox = Array.from(root.querySelectorAll('mat-checkbox')).find(
    (candidate) => candidate.textContent?.trim() === label,
  );
  const input = checkbox?.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (!input) throw new Error(`No checkbox "${label}"`);
  input.click();
}

/** Submits the form that contains `element`. */
export function submitForm(element: Element): void {
  const form = element.closest('form') ?? element.querySelector('form');
  if (!form) throw new Error('No form to submit');
  form.requestSubmit();
}
