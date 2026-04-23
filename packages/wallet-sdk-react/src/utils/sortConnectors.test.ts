import { describe, it, expect } from 'vitest';
import { sortConnectors } from './sortConnectors.js';
import type { IXConnector } from '@/types/interfaces.js';

function connector(overrides: Partial<IXConnector> & { id: string }): IXConnector {
  return {
    xChainType: 'BITCOIN',
    name: overrides.id,
    icon: undefined,
    isInstalled: true,
    connect: async () => undefined,
    disconnect: async () => undefined,
    ...overrides,
  };
}

describe('sortConnectors', () => {
  it('returns empty array for empty input', () => {
    expect(sortConnectors([])).toEqual([]);
  });

  it('preserves original order when no options given and all tied', () => {
    const a = connector({ id: 'a' });
    const b = connector({ id: 'b' });
    const c = connector({ id: 'c' });
    expect(sortConnectors([a, b, c]).map(x => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('ranks preferred[] earlier entries first, in order', () => {
    const a = connector({ id: 'a' });
    const b = connector({ id: 'b' });
    const c = connector({ id: 'c' });
    const result = sortConnectors([a, b, c], { preferred: ['c', 'a'] });
    expect(result.map(x => x.id)).toEqual(['c', 'a', 'b']);
  });

  it('ignores preferred IDs that do not exist in the list', () => {
    const a = connector({ id: 'a' });
    const b = connector({ id: 'b' });
    const result = sortConnectors([a, b], { preferred: ['ghost', 'b'] });
    expect(result.map(x => x.id)).toEqual(['b', 'a']);
  });

  it('ranks installed above not-installed when not in preferred[]', () => {
    const a = connector({ id: 'a', isInstalled: false });
    const b = connector({ id: 'b', isInstalled: true });
    const c = connector({ id: 'c', isInstalled: false });
    expect(sortConnectors([a, b, c]).map(x => x.id)).toEqual(['b', 'a', 'c']);
  });

  it('applies full precedence: preferred[] > isInstalled > original', () => {
    const a = connector({ id: 'a', isInstalled: false });
    const b = connector({ id: 'b', isInstalled: true });
    const c = connector({ id: 'c', isInstalled: false });
    const d = connector({ id: 'd', isInstalled: true });
    // preferred = ['b'] → b ranks first
    // Among {a, c, d}: isInstalled breaks tie → d above a, c (both not installed)
    // a, c keep original order
    const result = sortConnectors([a, b, c, d], { preferred: ['b'] });
    expect(result.map(x => x.id)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('is stable for equal-ranked entries', () => {
    const a = connector({ id: 'a', isInstalled: true });
    const b = connector({ id: 'b', isInstalled: true });
    const c = connector({ id: 'c', isInstalled: true });
    const result = sortConnectors([a, b, c]);
    expect(result.map(x => x.id)).toEqual(['a', 'b', 'c']);
  });
});
