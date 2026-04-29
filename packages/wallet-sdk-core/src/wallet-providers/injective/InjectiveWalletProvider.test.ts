import { describe, it, expect, vi, beforeEach } from 'vitest';

const msgExecuteContractFromJSON = vi.fn().mockReturnValue({ kind: 'MsgExecuteContract' });
const msgExecuteContractCompatFromJSON = vi.fn().mockReturnValue({ kind: 'MsgExecuteContractCompat' });
const createTransaction = vi
  .fn()
  .mockReturnValue({ txRaw: { bodyBytes: new Uint8Array([1]), authInfoBytes: new Uint8Array([2]) } });
const broadcastWithPk = vi.fn().mockResolvedValue({ txHash: 'pk-tx-hash', height: '100' });

vi.mock('@injectivelabs/sdk-ts', () => {
  class MsgBroadcasterWithPk {
    public readonly broadcast = broadcastWithPk;
    public privateKey: unknown;
    constructor({ privateKey }: { privateKey: unknown }) {
      this.privateKey = privateKey;
    }
  }
  return {
    MsgExecuteContract: { fromJSON: msgExecuteContractFromJSON },
    MsgExecuteContractCompat: { fromJSON: msgExecuteContractCompatFromJSON },
    createTransaction,
    PrivateKey: {
      fromPrivateKey: vi.fn().mockReturnValue({
        toAddress: () => ({ toBech32: () => 'inj1abc' }),
        toPublicKey: () => ({ toString: () => 'pubkey' }),
      }),
      fromMnemonic: vi.fn(),
    },
    getInjectiveSignerAddress: (s: string) => s,
    MsgBroadcasterWithPk,
  };
});

vi.mock('@injectivelabs/networks', () => ({ Network: { Mainnet: 'mainnet' } }));
vi.mock('@injectivelabs/wallet-core', () => ({}));
vi.mock('@injectivelabs/ts-types', () => ({}));

const { InjectiveWalletProvider } = await import('./InjectiveWalletProvider.js');

const SENDER = 'inj1abc';
const CONTRACT = 'inj1contract';
const CHAIN_ID = 'injective-1';
const MSG = { foo: 'bar' };

function makeProvider(defaults?: ConstructorParameters<typeof InjectiveWalletProvider>[0]['defaults']) {
  return new InjectiveWalletProvider({
    secret: { privateKey: 'pk' },
    // biome-ignore lint/suspicious/noExplicitAny: mocked Network
    network: 'mainnet' as any,
    // biome-ignore lint/suspicious/noExplicitAny: mocked ChainId
    chainId: CHAIN_ID as any,
    defaults,
  });
}

describe('InjectiveWalletProvider', () => {
  describe('constructor', () => {
    it('initializes with secret (private key) config', () => {
      const provider = makeProvider();
      expect(provider.chainType).toBe('INJECTIVE');
      expect(provider.wallet.msgBroadcaster).toBeDefined();
    });

    it('initializes with browser-extension config', () => {
      // biome-ignore lint/suspicious/noExplicitAny: mocked broadcaster
      const msgBroadcaster: any = { walletStrategy: { getAddresses: vi.fn() } };
      const provider = new InjectiveWalletProvider({ msgBroadcaster });
      expect(provider.chainType).toBe('INJECTIVE');
    });

    it('throws on invalid config', () => {
      expect(() => new InjectiveWalletProvider({} as never)).toThrow('Invalid Injective wallet config');
    });

    it('accepts defaults without throwing', () => {
      const provider = makeProvider({
        defaultMemo: 'sodax',
        defaultFunds: [{ amount: '100', denom: 'inj' }],
        sequence: 5,
        accountNumber: 10,
      });
      expect(provider.chainType).toBe('INJECTIVE');
    });
  });

  describe('getRawTransaction — option merge', () => {
    beforeEach(() => {
      msgExecuteContractFromJSON.mockClear();
      createTransaction.mockClear();
    });

    it('uses defaults: empty funds, empty memo, sequence=0, accountNumber=0 when nothing set', async () => {
      const provider = makeProvider();

      await provider.getRawTransaction(CHAIN_ID, '', SENDER, CONTRACT, MSG);

      const msgArgs = msgExecuteContractFromJSON.mock.calls[0]?.[0];
      expect(msgArgs.funds).toEqual([]);
      const txArgs = createTransaction.mock.calls[0]?.[0];
      expect(txArgs.memo).toBe('');
      expect(txArgs.sequence).toBe(0);
      expect(txArgs.accountNumber).toBe(0);
    });

    it('applies defaults.{defaultFunds, defaultMemo, sequence, accountNumber}', async () => {
      const provider = makeProvider({
        defaultFunds: [{ amount: '100', denom: 'inj' }],
        defaultMemo: 'sodax-memo',
        sequence: 7,
        accountNumber: 13,
      });

      await provider.getRawTransaction(CHAIN_ID, '', SENDER, CONTRACT, MSG);

      const msgArgs = msgExecuteContractFromJSON.mock.calls[0]?.[0];
      expect(msgArgs.funds).toEqual([{ amount: '100', denom: 'inj' }]);
      const txArgs = createTransaction.mock.calls[0]?.[0];
      expect(txArgs.memo).toBe('sodax-memo');
      expect(txArgs.sequence).toBe(7);
      expect(txArgs.accountNumber).toBe(13);
    });

    it('per-call options override defaults', async () => {
      const provider = makeProvider({
        defaultFunds: [{ amount: '100', denom: 'inj' }],
        defaultMemo: 'sodax-memo',
        sequence: 7,
        accountNumber: 13,
      });

      await provider.getRawTransaction(CHAIN_ID, '', SENDER, CONTRACT, MSG, undefined, {
        defaultFunds: [{ amount: '999', denom: 'usdt' }],
        sequence: 99,
        accountNumber: 42,
      });

      const msgArgs = msgExecuteContractFromJSON.mock.calls[0]?.[0];
      expect(msgArgs.funds).toEqual([{ amount: '999', denom: 'usdt' }]);
      const txArgs = createTransaction.mock.calls[0]?.[0];
      expect(txArgs.sequence).toBe(99);
      expect(txArgs.accountNumber).toBe(42);
    });

    it('memo argument wins over defaults.defaultMemo', async () => {
      const provider = makeProvider({ defaultMemo: 'sodax-memo' });

      await provider.getRawTransaction(CHAIN_ID, '', SENDER, CONTRACT, MSG, 'explicit-memo');

      const txArgs = createTransaction.mock.calls[0]?.[0];
      expect(txArgs.memo).toBe('explicit-memo');
    });
  });

  describe('execute — option merge', () => {
    beforeEach(() => {
      msgExecuteContractCompatFromJSON.mockClear();
      broadcastWithPk.mockClear();
      broadcastWithPk.mockResolvedValue({ txHash: 'pk-tx-hash', height: '100' });
    });

    it('applies defaults.defaultFunds when funds arg omitted', async () => {
      const provider = makeProvider({ defaultFunds: [{ amount: '50', denom: 'inj' }] });

      await provider.execute(SENDER, CONTRACT, MSG);

      const msgArgs = msgExecuteContractCompatFromJSON.mock.calls[0]?.[0];
      expect(msgArgs.funds).toEqual([{ amount: '50', denom: 'inj' }]);
    });

    it('explicit funds arg overrides defaults.defaultFunds', async () => {
      const provider = makeProvider({ defaultFunds: [{ amount: '50', denom: 'inj' }] });

      await provider.execute(SENDER, CONTRACT, MSG, [{ amount: '999', denom: 'usdt' }]);

      const msgArgs = msgExecuteContractCompatFromJSON.mock.calls[0]?.[0];
      expect(msgArgs.funds).toEqual([{ amount: '999', denom: 'usdt' }]);
    });

    it('memo absent (no key in broadcast args) when defaults.defaultMemo is undefined', async () => {
      const provider = makeProvider();

      await provider.execute(SENDER, CONTRACT, MSG);

      const broadcastArgs = broadcastWithPk.mock.calls[0]?.[0];
      expect(broadcastArgs).not.toHaveProperty('memo');
    });

    it('memo forwarded as empty string when defaults.defaultMemo is set to empty string', async () => {
      const provider = makeProvider({ defaultMemo: '' });

      await provider.execute(SENDER, CONTRACT, MSG);

      const broadcastArgs = broadcastWithPk.mock.calls[0]?.[0];
      expect(broadcastArgs).toHaveProperty('memo', '');
    });

    it('memo forwarded when defaults.defaultMemo is set to a non-empty value', async () => {
      const provider = makeProvider({ defaultMemo: 'sodax-memo' });

      await provider.execute(SENDER, CONTRACT, MSG);

      const broadcastArgs = broadcastWithPk.mock.calls[0]?.[0];
      expect(broadcastArgs).toHaveProperty('memo', 'sodax-memo');
    });
  });
});
