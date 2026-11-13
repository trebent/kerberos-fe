import { joinNames } from './names';

describe('joinNames', () => {
  it('lists the names', () => {
    expect(joinNames([{ name: 'admins' }, { name: 'staff' }])).toBe('admins, staff');
  });

  it('shows a dash when there are none', () => {
    expect(joinNames([])).toBe('—');
    expect(joinNames(undefined)).toBe('—');
  });
});
