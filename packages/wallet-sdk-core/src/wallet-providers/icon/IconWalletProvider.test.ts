import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IcxCallTransaction } from '@sodax/types';

const mockLoadPrivateKey = vi.fn().mockReturnValue({ getAddress: () => 'hxabc' });
const sendTransactionExecute = vi.fn().mockResolvedValue('0xtxhash');
const sendTransactionFn = vi.fn().mockReturnValue({ execute: sendTransactionExecute });
const builderState: Record<string, unknown> = {};

vi.mock('icon-sdk-js', () => {
  class IconService {
    static HttpProvider = class {};
    static SignedTransaction = class {
      constructor(
        public readonly builtTx: unknown,
        public readonly wallet: unknown,
      ) {}
    };
    sendTransaction = sendTransactionFn;
    waitTransactionResult() {
      return { execute: vi.fn() };
    }
  }
  const Wallet = { loadPrivateKey: mockLoadPrivateKey };
  const Converter = { toHex: (n: number | string) => `0x${Number(n).toString(16)}` };
  class CallTransactionBuilder {
    from(value: unknown) {
      builderState.from = value;
      return this;
    }
    to(value: unknown) {
      builderState.to = value;
      return this;
    }
    stepLimit(value: unknown) {
      builderState.stepLimit = value;
      return this;
    }
    nid(value: unknown) {
      builderState.nid = value;
      return this;
    }
    version(value: unknown) {
      builderState.version = value;
      return this;
    }
    timestamp(value: unknown) {
      builderState.timestamp = value;
      return this;
    }
    value(value: unknown) {
      builderState.value = value;
      return this;
    }
    method(value: unknown) {
      builderState.method = value;
      return this;
    }
    params(value: unknown) {
      builderState.params = value;
      return this;
    }
    build() {
      return { ...builderState };
    }
  }
  const sdk = { IconService, Wallet, Converter, CallTransactionBuilder };
  return { ...sdk, default: sdk };
});

const { IconWalletProvider } = await import('./IconWalletProvider.js');

const PRIVATE_KEY = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as const;
const RPC_URL = 'https://ctz.solidwallet.io/api/v3' as const;

const TX_BASE: IcxCallTransaction = {
  from: 'hxfrom',
  to: 'cxto',
  nid: '0x1',
  value: '0x0',
  method: 'doThing',
  params: { foo: 'bar' },
};

function makeProvider(defaults?: ConstructorParameters<typeof IconWalletProvider>[0]['defaults']) {
  return new IconWalletProvider({ privateKey: PRIVATE_KEY, rpcUrl: RPC_URL, defaults });
}

describe('IconWalletProvider', () => {
  describe('constructor', () => {
    it('initializes with private-key config', () => {
      const provider = new IconWalletProvider({ privateKey: PRIVATE_KEY, rpcUrl: RPC_URL });
      expect(provider.chainType).toBe('ICON');
      expect(provider.iconService).toBeDefined();
    });

    it('initializes with browser-extension config', () => {
      const provider = new IconWalletProvider({
        walletAddress: 'hx1234567890abcdef1234567890abcdef12345678',
        rpcUrl: RPC_URL,
      });
      expect(provider.chainType).toBe('ICON');
    });

    it('throws on invalid config', () => {
      // biome-ignore lint/suspicious/noExplicitAny: testing invalid config rejection
      expect(() => new IconWalletProvider({} as any)).toThrow('Invalid Icon wallet config');
    });

    it('accepts defaults without throwing', () => {
      const provider = new IconWalletProvider({
        privateKey: PRIVATE_KEY,
        rpcUrl: RPC_URL,
        defaults: { stepLimit: 5_000_000, version: '0x4', jsonRpcId: 42 },
      });
      expect(provider.chainType).toBe('ICON');
    });
  });

  describe('sendTransaction — option merge (PK path)', () => {
    beforeEach(() => {
      sendTransactionExecute.mockClear();
      sendTransactionFn.mockClear();
      for (const k of Object.keys(builderState)) delete builderState[k];
    });

    it('uses DEFAULT_STEP_LIMIT/DEFAULT_VERSION/DEFAULT_JSON_RPC_ID when no defaults nor tx fields', async () => {
      const provider = makeProvider();

      await provider.sendTransaction(TX_BASE);

      expect(builderState.stepLimit).toBe('0x2dc6c0'); // 3_000_000 in hex
      expect(builderState.version).toBe('0x3');
    });

    it('applies defaults.stepLimit/version when no per-call options nor tx fields', async () => {
      const provider = makeProvider({ stepLimit: 5_000_000, version: '0x4' });

      await provider.sendTransaction(TX_BASE);

      expect(builderState.stepLimit).toBe('0x4c4b40'); // 5_000_000 hex
      expect(builderState.version).toBe('0x4');
    });

    it('per-call options override defaults', async () => {
      const provider = makeProvider({ stepLimit: 5_000_000, version: '0x4' });

      await provider.sendTransaction(TX_BASE, { stepLimit: 1_000_000, version: '0x5' });

      expect(builderState.stepLimit).toBe('0xf4240'); // 1_000_000 hex
      expect(builderState.version).toBe('0x5');
    });

    it('tx-level version wins over both per-call options and defaults', async () => {
      const provider = makeProvider({ version: '0x4' });

      await provider.sendTransaction({ ...TX_BASE, version: '0x9' }, { version: '0x5' });

      expect(builderState.version).toBe('0x9');
    });

    it('tx-level timestamp wins over defaults.timestampProvider', async () => {
      const timestampProvider = vi.fn().mockReturnValue(1234);
      const provider = makeProvider({ timestampProvider });

      await provider.sendTransaction({ ...TX_BASE, timestamp: 0xabc });

      expect(timestampProvider).not.toHaveBeenCalled();
      expect(builderState.timestamp).toBe('0xabc');
    });

    it('invokes defaults.timestampProvider when tx.timestamp omitted', async () => {
      const timestampProvider = vi.fn().mockReturnValue(0x1000);
      const provider = makeProvider({ timestampProvider });

      await provider.sendTransaction(TX_BASE);

      expect(timestampProvider).toHaveBeenCalledTimes(1);
      expect(builderState.timestamp).toBe('0x1000');
    });
  });
});
