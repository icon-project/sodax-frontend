import { describe, it, expect, vi, beforeEach } from 'vitest';

const networkFrom = vi.fn().mockReturnValue({ client: { baseUrl: 'https://stacks.example' } });
const broadcastTransaction = vi.fn().mockResolvedValue({ txid: 'tx-123' });
const makeContractCall = vi.fn().mockResolvedValue({ kind: 'tx' });
const stacksRequest = vi.fn().mockResolvedValue({ txid: 'browser-tx-123' });

vi.mock('@stacks/network', () => ({
  networkFrom,
}));

vi.mock('@stacks/transactions', () => ({
  broadcastTransaction,
  fetchCallReadOnlyFunction: vi.fn(),
  getAddressFromPrivateKey: vi.fn().mockReturnValue('SP1ADDR'),
  makeContractCall,
  PostConditionMode: { Allow: 0x01, Deny: 0x02 },
  privateKeyToPublic: vi.fn().mockReturnValue('pub'),
  publicKeyToHex: vi.fn().mockReturnValue('hex'),
}));

vi.mock('@stacks/connect', () => ({ request: stacksRequest }));

const { StacksWalletProvider } = await import('./StacksWalletProvider.js');

const PK = 'pk';
const BROWSER_ADDRESS = 'SP1ADDR';
const TX_PARAMS_BASE = {
  contractAddress: 'SP000',
  contractName: 'my-contract',
  functionName: 'do-thing',
  functionArgs: [],
};

describe('StacksWalletProvider', () => {
  describe('constructor', () => {
    it('initializes with private-key config', () => {
      const provider = new StacksWalletProvider({ privateKey: PK });
      expect(provider.chainType).toBe('STACKS');
    });

    it('initializes with browser-extension config', () => {
      const provider = new StacksWalletProvider({ address: BROWSER_ADDRESS });
      expect(provider.chainType).toBe('STACKS');
    });

    it('throws on invalid config', () => {
      expect(() => new StacksWalletProvider({} as never)).toThrow('Invalid Stacks wallet configuration');
    });

    it('accepts defaults without throwing', () => {
      const provider = new StacksWalletProvider({
        privateKey: PK,
        defaults: { network: 'testnet' },
      });
      expect(provider.chainType).toBe('STACKS');
    });
  });

  describe('constructor — defaults.network forwarded to networkFrom', () => {
    beforeEach(() => {
      networkFrom.mockClear();
    });

    it("defaults to 'mainnet' when defaults.network is unset", () => {
      const provider = new StacksWalletProvider({ privateKey: PK });
      expect(provider.chainType).toBe('STACKS');
      expect(networkFrom).toHaveBeenCalledWith('mainnet');
    });

    it('forwards defaults.network to networkFrom', () => {
      const provider = new StacksWalletProvider({ privateKey: PK, defaults: { network: 'testnet' } });
      expect(provider.chainType).toBe('STACKS');
      expect(networkFrom).toHaveBeenCalledWith('testnet');
    });
  });

  describe('sendTransaction — option merge (PK path)', () => {
    beforeEach(() => {
      makeContractCall.mockClear();
      broadcastTransaction.mockClear();
    });

    it('applies defaults.postConditionMode to makeContractCall when neither tx nor options specify', async () => {
      const provider = new StacksWalletProvider({
        privateKey: PK,
        defaults: { postConditionMode: 0x01 },
      });

      await provider.sendTransaction(TX_PARAMS_BASE);

      const call = makeContractCall.mock.calls[0]?.[0];
      expect(call.postConditionMode).toBe(0x01);
    });

    it('per-call options.postConditionMode overrides defaults', async () => {
      const provider = new StacksWalletProvider({
        privateKey: PK,
        defaults: { postConditionMode: 0x01 },
      });

      await provider.sendTransaction(TX_PARAMS_BASE, { postConditionMode: 0x02 });

      const call = makeContractCall.mock.calls[0]?.[0];
      expect(call.postConditionMode).toBe(0x02);
    });

    it('tx-level postConditionMode wins over per-call options and defaults', async () => {
      const provider = new StacksWalletProvider({
        privateKey: PK,
        defaults: { postConditionMode: 0x01 },
      });

      await provider.sendTransaction(
        { ...TX_PARAMS_BASE, postConditionMode: 0x02 },
        { postConditionMode: 0x01 },
      );

      const call = makeContractCall.mock.calls[0]?.[0];
      expect(call.postConditionMode).toBe(0x02);
    });

    it('postConditionMode stays undefined when no source provides it', async () => {
      const provider = new StacksWalletProvider({ privateKey: PK });

      await provider.sendTransaction(TX_PARAMS_BASE);

      const call = makeContractCall.mock.calls[0]?.[0];
      expect(call.postConditionMode).toBeUndefined();
    });
  });

  describe('sendTransaction — browser-extension path', () => {
    beforeEach(() => {
      stacksRequest.mockClear();
      stacksRequest.mockResolvedValue({ txid: 'browser-tx-123' });
    });

    it('forwards defaults.postConditionMode (translated to name) to stx_callContract request', async () => {
      const provider = new StacksWalletProvider({
        address: BROWSER_ADDRESS,
        defaults: { postConditionMode: 0x01 },
      });

      await provider.sendTransaction(TX_PARAMS_BASE);

      // request('stx_callContract', params)
      const params = stacksRequest.mock.calls[0]?.[1];
      expect(params.postConditionMode).toBe('allow');
    });

    it("uses defaults.network in the request payload (defaults to 'mainnet')", async () => {
      const provider = new StacksWalletProvider({
        address: BROWSER_ADDRESS,
        defaults: { network: 'testnet' },
      });

      await provider.sendTransaction(TX_PARAMS_BASE);

      const params = stacksRequest.mock.calls[0]?.[1];
      expect(params.network).toBe('testnet');
    });

    it("falls back to network='mainnet' in the request payload when defaults.network is unset", async () => {
      const provider = new StacksWalletProvider({ address: BROWSER_ADDRESS });

      await provider.sendTransaction(TX_PARAMS_BASE);

      const params = stacksRequest.mock.calls[0]?.[1];
      expect(params.network).toBe('mainnet');
    });
  });
});
