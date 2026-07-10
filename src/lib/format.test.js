import { formatCount, formatDateTime, formatPercent } from './format';

describe('format helpers', () => {
  it('formats dates and counts', () => {
    expect(formatDateTime('2026-07-06T18:51:19.924Z')).toContain('2026');
    expect(formatCount(1, 'teste')).toBe('1 teste');
    expect(formatCount(3, 'teste')).toBe('3 testes');
    expect(formatPercent(42.2)).toBe('42%');
  });
});
