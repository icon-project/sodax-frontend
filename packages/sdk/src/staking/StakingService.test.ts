import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Erc20Service,
  EvmSpokeProvider,
  Sodax,
  SonicSpokeProvider,
  SonicSpokeService,
  type InstantUnstakeParams,
  type StakeParams,
  type StakingParams,
  type UnstakeParams,
} from '../index.js';
import {
  BSC_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type Hash,
  type IEvmWalletProvider,
} from '@sodax/types';

describe('StakingService', () => {
  const sodax = new Sodax();

  const mockEvmWalletProvider = {
    sendTransaction: vi.fn(),
    getWalletAddress: vi.fn().mockResolvedValue('0x9999999999999999999999999999999999999999' as `0x${string}`),
    waitForTransactionReceipt: vi.fn(),
  } as unknown as IEvmWalletProvider;

  const mockBscSpokeProvider = new EvmSpokeProvider(mockEvmWalletProvider, spokeChainConfig[BSC_MAINNET_CHAIN_ID]);
  const mockSonicSpokeProvider = new SonicSpokeProvider(
    mockEvmWalletProvider,
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID],
  );

  const mockCreatorHubWalletAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
  const mockTxHash = '0x1234567890123456789012345678901234567890' as Hash;

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('sodax.staking.isAllowanceValid', () => {
    it('returns true for Sonic provider (no allowance needed)', async () => {
      vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce(mockCreatorHubWalletAddress);
      vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

      const params = {
        action: 'stake',
        amount: 1000n,
        minReceive: 1000n,
        account: await mockSonicSpokeProvider.walletProvider.getWalletAddress(),
      } satisfies StakeParams;

      const result = await sodax.staking.isAllowanceValid({
        params,
        spokeProvider: mockSonicSpokeProvider,
      });

      expect(result.ok && result.value).toBe(true);
    });
  });

  it('returns true for BSC provider (no allowance needed)', async () => {
    vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

    const params = {
      action: 'stake',
      amount: 1000n,
      minReceive: 1000n,
      account: await mockBscSpokeProvider.walletProvider.getWalletAddress(),
    } satisfies StakeParams;

    const result = await sodax.staking.isAllowanceValid({
      params,
      spokeProvider: mockBscSpokeProvider,
    });

    expect(result.ok && result.value).toBe(true);
  });
  it('returns true for Sonic provider (unstake action)', async () => {
    vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce(mockCreatorHubWalletAddress);
    vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

    const params = {
      action: 'unstake',
      amount: 1000n,
      account: await mockSonicSpokeProvider.walletProvider.getWalletAddress(),
    } satisfies UnstakeParams;

    const result = await sodax.staking.isAllowanceValid({
      params,
      spokeProvider: mockSonicSpokeProvider,
    });

    expect(result.ok && result.value).toBe(true);
  });

  it('returns false if Erc20Service.isAllowanceValid fails', async () => {
    vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce({
      ok: false,
      error: new Error('Allowance error'),
    });

    const params = {
      action: 'stake',
      amount: 1000n,
      minReceive: 1000n,
      account: await mockBscSpokeProvider.walletProvider.getWalletAddress(),
    } satisfies StakeParams;

    const result = await sodax.staking.isAllowanceValid({
      params,
      spokeProvider: mockBscSpokeProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('ALLOWANCE_CHECK_FAILED');
    }
  });

  it('returns true for Sonic provider (instantUnstake action)', async () => {
    vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce(mockCreatorHubWalletAddress);
    vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

    const params = {
      action: 'instantUnstake',
      amount: 1000n,
      minAmount: 900n,
      account: await mockSonicSpokeProvider.walletProvider.getWalletAddress(),
    } satisfies InstantUnstakeParams;

    const result = await sodax.staking.isAllowanceValid({
      params,
      spokeProvider: mockSonicSpokeProvider,
    });

    expect(result.ok && result.value).toBe(true);
  });

  it('returns false for invalid staking action param', async () => {
    // Fake param that will trigger the fallback error
    const params = {
      action: 'invalidAction',
      amount: 1000n,
      minReceive: 900n,
      account: await mockBscSpokeProvider.walletProvider.getWalletAddress(),
    } as unknown as StakingParams;

    const result = await sodax.staking.isAllowanceValid({
      params,
      spokeProvider: mockBscSpokeProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('ALLOWANCE_CHECK_FAILED');
      expect(result.error.error).toBeInstanceOf(Error);
    }
  });

  it('returns false if amount is not greater than 0', async () => {
    const params = {
      action: 'stake',
      amount: 0n,
      minReceive: 1000n,
      account: await mockBscSpokeProvider.walletProvider.getWalletAddress(),
    } satisfies StakeParams;

    const result = await sodax.staking.isAllowanceValid({
      params,
      spokeProvider: mockBscSpokeProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('ALLOWANCE_CHECK_FAILED');
    }
  });

  describe('sodax.staking.approve', () => {
    it('it approves for Sonic provider (stake action)', async () => {
      vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce(mockCreatorHubWalletAddress);
      vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockTxHash);

      const params = {
        action: 'stake',
        amount: 1000n,
        minReceive: 1000n,
        account: await mockSonicSpokeProvider.walletProvider.getWalletAddress(),
      } satisfies StakeParams;

      const result = await sodax.staking.approve({
        params,
        spokeProvider: mockSonicSpokeProvider,
      });

      expect(result.ok && result.value).toBe(mockTxHash);
    });

    it('it approves for BSC provider (stake action)', async () => {
      vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockTxHash);

      const params = {
        action: 'stake',
        amount: 1000n,
        minReceive: 1000n,
        account: await mockBscSpokeProvider.walletProvider.getWalletAddress(),
      } satisfies StakeParams;

      const result = await sodax.staking.approve({
        params,
        spokeProvider: mockBscSpokeProvider,
      });

      expect(result.ok && result.value).toBe(mockTxHash);
    });
  });

  it('it unstakes for Sonic provider (unstake action)', async () => {
    vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce(mockCreatorHubWalletAddress);
    vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockTxHash);

    const params = {
      action: 'unstake',
      amount: 1000n,
      account: await mockSonicSpokeProvider.walletProvider.getWalletAddress(),
    } satisfies UnstakeParams;

    const result = await sodax.staking.approve({
      params,
      spokeProvider: mockSonicSpokeProvider,
    });

    expect(result.ok && result.value).toBe(mockTxHash);
  });

  it('it unstakes for BSC provider (unstake action)', async () => {
    vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockTxHash);

    const params = {
      action: 'unstake',
      amount: 1000n,
      account: await mockBscSpokeProvider.walletProvider.getWalletAddress(),
    } satisfies UnstakeParams;

    const result = await sodax.staking.approve({
      params,
      spokeProvider: mockBscSpokeProvider,
    });

    expect(result.ok && result.value).toBe(mockTxHash);
  });

  it('it unstakes for Sonic provider (instantUnstake action)', async () => {
    vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce(mockCreatorHubWalletAddress);
    vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockTxHash);

    const params = {
      action: 'instantUnstake',
      amount: 1000n,
      minAmount: 900n,
      account: await mockSonicSpokeProvider.walletProvider.getWalletAddress(),
    } satisfies InstantUnstakeParams;

    const result = await sodax.staking.approve({
      params,
      spokeProvider: mockSonicSpokeProvider,
    });

    expect(result.ok && result.value).toBe(mockTxHash);
  });

  it('it unstakes for Sonic provider (instantUnstake action)', async () => {
    vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce(mockCreatorHubWalletAddress);
    vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockTxHash);

    const params = {
      action: 'instantUnstake',
      amount: 1000n,
      minAmount: 900n,
      account: await mockSonicSpokeProvider.walletProvider.getWalletAddress(),
    } satisfies InstantUnstakeParams;

    const result = await sodax.staking.approve({
      params,
      spokeProvider: mockSonicSpokeProvider,
    });

    expect(result.ok && result.value).toBe(mockTxHash);
  });

  it('it unstakes for BSC provider (instantUnstake action)', async () => {
    vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockTxHash);

    const params = {
      action: 'instantUnstake',
      amount: 1000n,
      minAmount: 900n,
      account: await mockBscSpokeProvider.walletProvider.getWalletAddress(),
    } satisfies InstantUnstakeParams;

    const result = await sodax.staking.approve({
      params,
      spokeProvider: mockBscSpokeProvider,
    });

    expect(result.ok && result.value).toBe(mockTxHash);
  });
});
