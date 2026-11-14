/** The global style class for an HTTP status code: `status-ok` for 2xx, `status-err` otherwise. */
export function httpStatusClass(code: number): 'status-ok' | 'status-err' {
  return code >= 200 && code < 300 ? 'status-ok' : 'status-err';
}
