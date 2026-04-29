import { describe, it, expect, vi, afterEach } from 'vitest';
import { EvmWalletProvider } from './EvmWalletProvider.js';
import type { BrowserExtensionEvmWalletConfig, EvmWalletConfig } from './types.js';
import type { EvmRawTransaction } from '@sodax/types';
import { ChainKeys } from '@sodax/types';
import { createWalletClient, createPublicClient, http, type TransactionReceipt } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sonic } from 'viem/chains';

const PRIVATE_KEY = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as const;
const RPC_URL = sonic.rpcUrls.default.http[0];

function makeBrowserExtensionConfig(): BrowserExtensionEvmWalletConfig {
  const account = privateKeyToAccount(PRIVATE_KEY);
  const walletClient = createWalletClient({ chain: sonic, transport: http(RPC_URL), account });
  const publicClient = createPublicClient({ chain: sonic, transport: http(RPC_URL) });
  return { walletClient, publicClient };
}

function makeFakeReceipt(): TransactionReceipt {
  return {
    blockHash: '0xb1ock',
    blockNumber: 100n,
    contractAddress: null,
    cumulativeGasUsed: 21_000n,
    effectiveGasPrice: 1_000_000_000n,
    from: '0x0000000000000000000000000000000000000001',
    gasUsed: 21_000n,
    logs: [],
    logsBloom: '0x',
    status: 'success',
    to: '0x0000000000000000000000000000000000000002',
    transactionHash: '0xtxhash',
    transactionIndex: 0,
    type: 'eip1559',
  };
}

describe('EvmWalletProvider', () => {
  describe('constructor', () => {
    it('initializes with private key wallet config', () => {
      const provider = new EvmWalletProvider({
        privateKey: PRIVATE_KEY,
        chainId: ChainKeys.SONIC_MAINNET,
        rpcUrl: RPC_URL,
      });
      expect(provider).toBeInstanceOf(EvmWalletProvider);
      expect(provider.publicClient).toBeDefined();
      expect(provider.chainType).toBe('EVM');
    });

    it('initializes with browser extension wallet config', () => {
      const config = makeBrowserExtensionConfig();
      const provider = new EvmWalletProvider(config);
      expect(provider.publicClient).toBe(config.publicClient);
      expect(provider.chainType).toBe('EVM');
    });

    it('throws on invalid wallet config', () => {
      expect(() => new EvmWalletProvider({} as EvmWalletConfig)).toThrow('Invalid EVM wallet config');
    });

    it('accepts defaults without throwing', () => {
      const provider = new EvmWalletProvider({
        privateKey: PRIVATE_KEY,
        chainId: ChainKeys.SONIC_MAINNET,
        rpcUrl: RPC_URL,
        defaults: {
          transport: { timeout: 10_000, retryCount: 5 },
          publicClient: { pollingInterval: 4_000 },
          waitForTransactionReceipt: { confirmations: 2, timeout: 60_000 },
        },
      });
      expect(provider.chainType).toBe('EVM');
    });
  });

  describe('defaults — browser-extension mode', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('preserves the supplied publicClient instance unchanged when defaults are set', () => {
      const config = makeBrowserExtensionConfig();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const provider = new EvmWalletProvider({
        ...config,
        defaults: { transport: { timeout: 99_999 } }, // ignored — consumer brings their own client
      });
      expect(provider.publicClient).toBe(config.publicClient);
      warnSpy.mockRestore();
    });

    it('warns when ignored defaults keys are supplied in browser-extension mode', () => {
      const config = makeBrowserExtensionConfig();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      new EvmWalletProvider({
        ...config,
        defaults: { transport: { timeout: 99_999 } },
      });

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(/ignored in browser-extension mode/);
    });

    it('does not warn when only method-level defaults are supplied in browser-extension mode', () => {
      const config = makeBrowserExtensionConfig();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      new EvmWalletProvider({
        ...config,
        defaults: { waitForTransactionReceipt: { confirmations: 1 } },
      });

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('waitForTransactionReceipt — option merge', () => {
    it('passes only { hash } when no defaults and no per-call options supplied', async () => {
      const config = makeBrowserExtensionConfig();
      const provider = new EvmWalletProvider(config);
      const spy = vi.spyOn(config.publicClient, 'waitForTransactionReceipt').mockResolvedValue(makeFakeReceipt());

      await provider.waitForTransactionReceipt('0xabc');

      expect(spy).toHaveBeenCalledWith({ hash: '0xabc' });
    });

    it('applies defaults when no per-call options supplied', async () => {
      const config = makeBrowserExtensionConfig();
      const provider = new EvmWalletProvider({
        ...config,
        defaults: { waitForTransactionReceipt: { confirmations: 3, timeout: 30_000 } },
      });
      const spy = vi.spyOn(config.publicClient, 'waitForTransactionReceipt').mockResolvedValue(makeFakeReceipt());

      await provider.waitForTransactionReceipt('0xabc');

      expect(spy).toHaveBeenCalledWith({ hash: '0xabc', confirmations: 3, timeout: 30_000 });
    });

    it('per-call options override defaults via shallow merge', async () => {
      const config = makeBrowserExtensionConfig();
      const provider = new EvmWalletProvider({
        ...config,
        defaults: { waitForTransactionReceipt: { confirmations: 1, timeout: 5_000 } },
      });
      const spy = vi.spyOn(config.publicClient, 'waitForTransactionReceipt').mockResolvedValue(makeFakeReceipt());

      await provider.waitForTransactionReceipt('0xabc', { confirmations: 5 });

      // Per-call confirmations wins; defaults timeout still applies (shallow merge)
      expect(spy).toHaveBeenCalledWith({ hash: '0xabc', confirmations: 5, timeout: 5_000 });
    });
  });

  describe('sendTransaction — option merge', () => {
    const RAW_TX: EvmRawTransaction = {
      from: '0x0000000000000000000000000000000000000001',
      to: '0x0000000000000000000000000000000000000002',
      value: 1_000n,
      data: '0x',
    };

    it('passes raw tx fields through unchanged when no defaults and no per-call options', async () => {
      const config = makeBrowserExtensionConfig();
      const provider = new EvmWalletProvider(config);
      const spy = vi.spyOn(config.walletClient, 'sendTransaction').mockResolvedValue('0xtxhash');

      await provider.sendTransaction(RAW_TX);

      expect(spy).toHaveBeenCalledWith(expect.objectContaining(RAW_TX));
    });

    it('applies defaults.sendTransaction when no per-call options supplied', async () => {
      const config = makeBrowserExtensionConfig();
      const provider = new EvmWalletProvider({
        ...config,
        defaults: { sendTransaction: { gas: 100_000n } },
      });
      const spy = vi.spyOn(config.walletClient, 'sendTransaction').mockResolvedValue('0xtxhash');

      await provider.sendTransaction(RAW_TX);

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ ...RAW_TX, gas: 100_000n }));
    });

    it('per-call options override defaults', async () => {
      const config = makeBrowserExtensionConfig();
      const provider = new EvmWalletProvider({
        ...config,
        defaults: { sendTransaction: { gas: 100_000n } },
      });
      const spy = vi.spyOn(config.walletClient, 'sendTransaction').mockResolvedValue('0xtxhash');

      await provider.sendTransaction(RAW_TX, { gas: 500_000n });

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ ...RAW_TX, gas: 500_000n }));
    });

    it('tx data is preserved alongside policy fields without collision', async () => {
      const config = makeBrowserExtensionConfig();
      const provider = new EvmWalletProvider({
        ...config,
        defaults: { sendTransaction: { gas: 100_000n, nonce: 5 } },
      });
      const spy = vi.spyOn(config.walletClient, 'sendTransaction').mockResolvedValue('0xtxhash');

      await provider.sendTransaction(RAW_TX, { maxFeePerGas: 2_000_000_000n });

      // Type system guarantees policy can never carry from/to/value/data, so tx data
      // and policy fields coexist without overriding each other.
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          ...RAW_TX,
          gas: 100_000n, // from defaults
          nonce: 5, // from defaults
          maxFeePerGas: 2_000_000_000n, // from per-call options
        }),
      );
    });

    it('rejects tx data fields in options at compile time', () => {
      const config = makeBrowserExtensionConfig();
      const provider = new EvmWalletProvider(config);
      vi.spyOn(config.walletClient, 'sendTransaction').mockResolvedValue('0xtxhash');

      // @ts-expect-error — `from` belongs to EvmRawTransaction, must not appear in EvmSendTransactionPolicy
      void provider.sendTransaction(RAW_TX, { from: '0xOther' });
      // @ts-expect-error — `value` belongs to EvmRawTransaction
      void provider.sendTransaction(RAW_TX, { value: 999n });
      // @ts-expect-error — `to` belongs to EvmRawTransaction
      void provider.sendTransaction(RAW_TX, { to: '0xOther' });
      // @ts-expect-error — `data` belongs to EvmRawTransaction
      void provider.sendTransaction(RAW_TX, { data: '0xdead' });
    });
  });
});
