import { httpStatusClass } from './http-status';

describe('httpStatusClass', () => {
  it('marks 2xx codes as successful', () => {
    expect([200, 204, 299].map(httpStatusClass)).toEqual(['status-ok', 'status-ok', 'status-ok']);
  });

  it('marks every other code as an error', () => {
    expect([199, 301, 404, 500].map(httpStatusClass)).toEqual([
      'status-err',
      'status-err',
      'status-err',
      'status-err',
    ]);
  });
});
