// packages/sdk/src/shared/services/spoke/SpokeService.isAllowanceValid.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChainKeys, defaultSharedChainConfig, HUB_CHAIN_KEY, spokeChainConfig, type Address } from '@sodax/types';
import type { ConfigService } from '../../config/ConfigService.js';
import type { HubProvider } from '../../types/types.js';
import { Erc20Service } from '../erc-20/Erc20Service.js';
import { SpokeService, type SpokeServiceConstructorParams } from './SpokeService.js';

type SpokeServiceWithPublicCtor = new (params: SpokeServiceConstructorParams) => SpokeService;

function createSpokeService(): SpokeService {
  const config = { sharedConfig: defaultSharedChainConfig } as unknown as ConfigService;
  const hubProvider = {
    service: { estimateGas: vi.fn() },
    chainConfig: { addresses: { assetManager: '0x0000000000000000000000000000000000000001' as Address } },
  } as unknown as HubProvider;
  return new (SpokeService as unknown as SpokeServiceWithPublicCtor)({ config, hubProvider });
}

describe('SpokeService.isAllowanceValid', () => {
  let spoke: SpokeService;

  beforeEach(() => {
    spoke = createSpokeService();
    vi.restoreAllMocks();
  });

  it('delegates to SonicSpokeService on hub', async () => {
    const spy = vi.spyOn(spoke.sonicSpokeService, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });
    const intents = '0x1111111111111111111111111111111111111111' as Address;
    const result = await spoke.isAllowanceValid({
      srcChainKey: HUB_CHAIN_KEY,
      token: '0x2222222222222222222222222222222222222222',
      amount: 100n,
      owner: '0x3333333333333333333333333333333333333333',
      spender: intents,
    });
    expect(result).toEqual({ ok: true, value: true });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        spender: intents,
        chainKey: ChainKeys.SONIC_MAINNET,
      }),
    );
  });

  it('delegates to EvmSpokeService with asset manager when spender omitted', async () => {
    const spy = vi.spyOn(spoke.evmSpokeService, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });
    const result = await spoke.isAllowanceValid({
      srcChainKey: ChainKeys.BSC_MAINNET,
      token: '0x2222222222222222222222222222222222222222',
      amount: 50n,
      owner: '0x3333333333333333333333333333333333333333',
    });
    expect(result).toEqual({ ok: true, value: true });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        chainKey: ChainKeys.BSC_MAINNET,
        spender: spokeChainConfig[ChainKeys.BSC_MAINNET].addresses.assetManager,
      }),
    );
  });

  it('uses custom spender on EVM spoke when provided', async () => {
    const spy = vi.spyOn(spoke.evmSpokeService, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });
    const customSpender = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address;
    await spoke.isAllowanceValid({
      srcChainKey: ChainKeys.BSC_MAINNET,
      token: '0x2222222222222222222222222222222222222222',
      amount: 1n,
      owner: '0x3333333333333333333333333333333333333333',
      spender: customSpender,
    });
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ spender: customSpender }));
  });

  it('delegates to Stellar trustline check', async () => {
    const spy = vi.spyOn(spoke.stellarSpokeService, 'hasSufficientTrustline').mockResolvedValueOnce(true);
    const result = await spoke.isAllowanceValid({
      srcChainKey: ChainKeys.STELLAR_MAINNET,
      token: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
      amount: 10n,
      owner: 'GABC123456789012345678901234567890123456789012345678901234567890',
    });
    expect(result).toEqual({ ok: true, value: true });
    expect(spy).toHaveBeenCalledWith(
      'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
      10n,
      'GABC123456789012345678901234567890123456789012345678901234567890',
    );
  });

  it('returns true for chains without allowance semantics', async () => {
    const sonicSpy = vi.spyOn(spoke.sonicSpokeService, 'isAllowanceValid');
    const evmSpy = vi.spyOn(spoke.evmSpokeService, 'isAllowanceValid');
    const result = await spoke.isAllowanceValid({
      srcChainKey: ChainKeys.SOLANA_MAINNET,
      token: 'So11111111111111111111111111111111111111112',
      amount: 1n,
      owner: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    });
    expect(result).toEqual({ ok: true, value: true });
    expect(sonicSpy).not.toHaveBeenCalled();
    expect(evmSpy).not.toHaveBeenCalled();
  });
});

describe('SpokeService.approve', () => {
  let spoke: SpokeService;

  beforeEach(() => {
    spoke = createSpokeService();
    vi.restoreAllMocks();
  });

  it('hub: delegates to Erc20Service.approve', async () => {
    const spy = vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce('0xapprove' as never);
    const wallet = { sendTransaction: vi.fn() };
    const spender = '0x1111111111111111111111111111111111111111' as Address;
    const result = await spoke.approve({
      srcChainKey: HUB_CHAIN_KEY,
      token: '0x2222222222222222222222222222222222222222',
      amount: 5n,
      owner: '0x3333333333333333333333333333333333333333',
      spender,
      raw: false,
      walletProvider: wallet as never,
    });
    expect(result.ok).toBe(true);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ spender, raw: false }));
  });

  it('EVM spoke: defaults spender to asset manager', async () => {
    const spy = vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce('0xapprove' as never);
    const wallet = { sendTransaction: vi.fn() };
    await spoke.approve({
      srcChainKey: ChainKeys.BSC_MAINNET,
      token: '0x2222222222222222222222222222222222222222',
      amount: 3n,
      owner: '0x3333333333333333333333333333333333333333',
      raw: false,
      walletProvider: wallet as never,
    });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        spender: spokeChainConfig[ChainKeys.BSC_MAINNET].addresses.assetManager,
      }),
    );
  });

  it('Stellar: delegates to requestTrustline', async () => {
    const spy = vi.spyOn(spoke.stellarSpokeService, 'requestTrustline').mockResolvedValueOnce('0xstellar' as never);
    const wallet = { signTransaction: vi.fn() };
    await spoke.approve({
      srcChainKey: ChainKeys.STELLAR_MAINNET,
      token: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
      amount: 2n,
      owner: 'GABC123456789012345678901234567890123456789012345678901234567890',
      raw: false,
      walletProvider: wallet as never,
    });
    expect(spy).toHaveBeenCalled();
  });
});
