import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';

import { newPasswordRules, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './password-rules';

describe('newPasswordRules', () => {
  function isValid(password: string): boolean {
    const passwordForm = form(signal({ password }), (path) => newPasswordRules(path.password), {
      injector: TestBed.inject(Injector),
    });
    return passwordForm.password().valid();
  }

  it('accepts 10 to 64 characters', () => {
    expect(isValid('a'.repeat(PASSWORD_MIN_LENGTH))).toBe(true);
    expect(isValid('a'.repeat(PASSWORD_MAX_LENGTH))).toBe(true);
  });

  it('rejects an empty, short or long password', () => {
    expect(isValid('')).toBe(false);
    expect(isValid('a'.repeat(PASSWORD_MIN_LENGTH - 1))).toBe(false);
    expect(isValid('a'.repeat(PASSWORD_MAX_LENGTH + 1))).toBe(false);
  });
});
