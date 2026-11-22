import { maxLength, minLength, required, SchemaPath } from '@angular/forms/signals';

/** Kerberos accepts new passwords of 10 to 64 characters, for every kind of user. */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 64;

/**
 * The rules for a password field that sets a new password. Kerberos rejects anything else with
 * 400, so checking here lets the form say why before the request goes out. Login and
 * current-password fields keep only `required`, since older passwords may be shorter.
 */
export function newPasswordRules(path: SchemaPath<string>): void {
  required(path);
  minLength(path, PASSWORD_MIN_LENGTH);
  maxLength(path, PASSWORD_MAX_LENGTH);
}
