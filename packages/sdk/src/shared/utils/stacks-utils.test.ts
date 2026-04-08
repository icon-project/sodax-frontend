import { describe, it, expect } from 'vitest';
import { loadStacksTransactions, getStacksTransactions, serializeAddressData } from './stacks-utils.js';
import { encodeAddress } from './shared-utils.js';

describe('lazy @stacks/transactions loading (issue #1070)', () => {
  it('loadStacksTransactions resolves the package', async () => {
    const m = await loadStacksTransactions();
    expect(typeof m.Cl).toBe('object');
    expect(typeof m.serializeCV).toBe('function');
  });

  it('getStacksTransactions returns the cache after preload', async () => {
    await loadStacksTransactions();
    const m = getStacksTransactions();
    expect(typeof m.Cl).toBe('object');
  });

  it('serializeAddressData works after preload', async () => {
    await loadStacksTransactions();
    const result = serializeAddressData('SP000000000000000000002Q6VF78');
    expect(result).toMatch(/^0x[0-9a-fA-F]+$/);
  });

  it('encodeAddress with stacks chain id works after preload', async () => {
    await loadStacksTransactions();
    const result = encodeAddress('stacks', 'SP000000000000000000002Q6VF78');
    expect(result).toMatch(/^0x[0-9a-fA-F]+$/);
  });
});
