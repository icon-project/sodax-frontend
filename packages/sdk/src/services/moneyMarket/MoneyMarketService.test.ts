import { describe, expect, it, vi } from 'vitest';
import {
  isMoneyMarketReserveAsset,
  MoneyMarketService,
  moneyMarketReserveAssets,
  EvmHubProvider,
  type EvmHubProviderConfig,
  getHubChainConfig,
  SONIC_MAINNET_CHAIN_ID,
  type IEvmWalletProvider,
  BSC_MAINNET_CHAIN_ID,
  EvmSpokeProvider,
  spokeChainConfig,
  getSupportedMoneyMarketTokens,
  EvmWalletAbstraction,
  SpokeService,
  type EvmRawTransaction,
  type PacketData,
  type Address,
} from '../../index.js';
import * as IntentRelayApiService from '../intentRelay/IntentRelayApiService.js';

describe('MoneyMarketService', () => {
  const mockEvmWalletProvider = {
    sendTransaction: vi.fn(),
    getWalletAddress: vi.fn().mockReturnValue('0x9999999999999999999999999999999999999999'),
    getWalletAddressBytes: vi.fn().mockReturnValue('0x9999999999999999999999999999999999999999'),
    waitForTransactionReceipt: vi.fn(),
  } as unknown as IEvmWalletProvider;

  const mockBscSpokeProvider = new EvmSpokeProvider(mockEvmWalletProvider, spokeChainConfig[BSC_MAINNET_CHAIN_ID]);

  const supportedTokens = getSupportedMoneyMarketTokens(BSC_MAINNET_CHAIN_ID);

  const hubConfig = {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
  } satisfies EvmHubProviderConfig;

  const moneyMarket = new MoneyMarketService(
    {
      partnerFee: {
        address: '0x9999999999999999999999999999999999999999',
        percentage: 100,
      },
    },
    new EvmHubProvider(hubConfig),
  );

  it('should have supported tokens', () => {
    expect(supportedTokens.length).toBeGreaterThan(0);
  });

  it('should supply a token', async () => {
    vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(
      mockEvmWalletProvider.getWalletAddressBytes(),
    );
    vi.spyOn(moneyMarket, 'supplyData').mockReturnValueOnce('0x');
    vi.spyOn(SpokeService, 'deposit').mockResolvedValueOnce('0x');

    const result = await moneyMarket.supply(
      {
        token: supportedTokens[0]?.address as Address,
        amount: 1000000000000000000n,
      },
      mockBscSpokeProvider,
      false,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('0x');
    }
  });

  it('should supply a token raw', async () => {
    const rawEvmTx = {
      from: mockEvmWalletProvider.getWalletAddressBytes(),
      to: "0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3",
      value: 1000000000000000000n,
      data: '0xc6b4180b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000001499999999999999999999999999999999999999990000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    } satisfies EvmRawTransaction;

    vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(
      mockEvmWalletProvider.getWalletAddressBytes(),
    );
    vi.spyOn(moneyMarket, 'supplyData').mockReturnValueOnce('0x');

    const result = await moneyMarket.supply(
      {
        token: supportedTokens[0]?.address as Address,
        amount: rawEvmTx.value,
      },
      mockBscSpokeProvider,
      true,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(rawEvmTx);
    }
  });

  it('should supply a token and submit', async () => {
    vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(
      mockEvmWalletProvider.getWalletAddressBytes(),
    );
    vi.spyOn(moneyMarket, 'supply').mockReturnValueOnce({
      ok: true,
      value: '0x',
    });
    vi.spyOn(IntentRelayApiService, 'relayTxAndWaitPacket').mockResolvedValueOnce({
      ok: true,
      value: {
        dst_tx_hash: '0x',
      } as PacketData,
    });

    const result = await moneyMarket.supplyAndSubmit(
      {
        token: supportedTokens[0]?.address as Address,
        amount: 1000000000000000000n,
      },
      mockBscSpokeProvider,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual(['0x', '0x']);
    }
  });

  it('should borrow a token', async () => {
    vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(
      mockEvmWalletProvider.getWalletAddressBytes(),
    );
    vi.spyOn(moneyMarket, 'borrowData').mockReturnValueOnce('0x');
    vi.spyOn(SpokeService, 'callWallet').mockResolvedValueOnce('0x');

    const result = await moneyMarket.borrow(
      {
        token: supportedTokens[0]?.address as Address,
        amount: 1000000000000000000n,
      },
      mockBscSpokeProvider,
      false,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('0x');
    }
  });

  it('should borrow a token raw', async () => {
    const rawEvmTx = {
      from: mockEvmWalletProvider.getWalletAddressBytes(),
      to: "0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3",
      value: 1000000000000000000n,
      data: '0xc6b4180b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000001499999999999999999999999999999999999999990000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    } satisfies EvmRawTransaction;

    vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(
      mockEvmWalletProvider.getWalletAddressBytes(),
    );
    vi.spyOn(moneyMarket, 'borrowData').mockReturnValueOnce('0x');
    vi.spyOn(SpokeService, 'callWallet').mockResolvedValueOnce(rawEvmTx);

    const result = await moneyMarket.borrow(
      {
        token: supportedTokens[0]?.address as Address,
        amount: rawEvmTx.value,
      },
      mockBscSpokeProvider,
      true,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(rawEvmTx);
    }
  });

  it('should borrow a token and submit', async () => {
    vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(
      mockEvmWalletProvider.getWalletAddressBytes(),
    );
    vi.spyOn(moneyMarket, 'borrow').mockReturnValueOnce({
      ok: true,
      value: '0x',
    });
    vi.spyOn(IntentRelayApiService, 'relayTxAndWaitPacket').mockResolvedValueOnce({
      ok: true,
      value: {
        dst_tx_hash: '0x',
      } as PacketData,
    });

    const result = await moneyMarket.borrowAndSubmit(
      {
        token: supportedTokens[0]?.address as Address,
        amount: 1000000000000000000n,
      },
      mockBscSpokeProvider,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual(['0x', '0x']);
    }
  });

  it('should withdraw a token', async () => {
    vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(
      mockEvmWalletProvider.getWalletAddressBytes(),
    );
    vi.spyOn(moneyMarket, 'withdrawData').mockReturnValueOnce('0x');
    vi.spyOn(SpokeService, 'callWallet').mockResolvedValueOnce('0x');

    const result = await moneyMarket.withdraw(
      {
        token: supportedTokens[0]?.address as Address,
        amount: 1000000000000000000n,
      },
      mockBscSpokeProvider,
      false,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('0x');
    }
  });

  it('should withdraw a token raw', async () => {
    const rawEvmTx = {
      from: mockEvmWalletProvider.getWalletAddressBytes(),
      to: "0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3",
      value: 1000000000000000000n,
      data: '0xc6b4180b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000001499999999999999999999999999999999999999990000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    } satisfies EvmRawTransaction;

    vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(
      mockEvmWalletProvider.getWalletAddressBytes(),
    );
    vi.spyOn(moneyMarket, 'withdrawData').mockReturnValueOnce('0x');
    vi.spyOn(SpokeService, 'callWallet').mockResolvedValueOnce(rawEvmTx);

    const result = await moneyMarket.withdraw(
      {
        token: supportedTokens[0]?.address as Address,
        amount: rawEvmTx.value,
      },
      mockBscSpokeProvider,
      true,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(rawEvmTx);
    }
  });

  it('should withdraw a token and submit', async () => {
    vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(
      mockEvmWalletProvider.getWalletAddressBytes(),
    );
    vi.spyOn(moneyMarket, 'withdraw').mockReturnValueOnce({
      ok: true,
      value: '0x',
    });
    vi.spyOn(IntentRelayApiService, 'relayTxAndWaitPacket').mockResolvedValueOnce({
      ok: true,
      value: {
        dst_tx_hash: '0x',
      } as PacketData,
    });

    const result = await moneyMarket.withdrawAndSubmit(
      {
        token: supportedTokens[0]?.address as Address,
        amount: 1000000000000000000n,
      },
      mockBscSpokeProvider,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual(['0x', '0x']);
    }
  });

  it('should repay a token', async () => {
    vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(
      mockEvmWalletProvider.getWalletAddressBytes(),
    );
    vi.spyOn(moneyMarket, 'repayData').mockReturnValueOnce('0x');
    vi.spyOn(SpokeService, 'deposit').mockResolvedValueOnce('0x');

    const result = await moneyMarket.repay(
      {
        token: supportedTokens[0]?.address as Address,
        amount: 1000000000000000000n,
      },
      mockBscSpokeProvider,
      false,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('0x');
    }
  });

  it('should repay a token raw', async () => {
    const rawEvmTx = {
      from: mockEvmWalletProvider.getWalletAddressBytes(),
      to: "0x348BE44F63A458be9C1b13D6fD8e99048F297Bc3",
      value: 1000000000000000000n,
      data: '0xc6b4180b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000001499999999999999999999999999999999999999990000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    } satisfies EvmRawTransaction;

    vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(
      mockEvmWalletProvider.getWalletAddressBytes(),
    );
    vi.spyOn(moneyMarket, 'repayData').mockReturnValueOnce('0x');
    vi.spyOn(SpokeService, 'deposit').mockResolvedValueOnce(rawEvmTx);

    const result = await moneyMarket.repay(
      {
        token: supportedTokens[0]?.address as Address,
        amount: rawEvmTx.value,
      },
      mockBscSpokeProvider,
      true,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(rawEvmTx);
    }
  });

  it('should repay a token and submit', async () => {
    vi.spyOn(EvmWalletAbstraction, 'getUserHubWalletAddress').mockResolvedValueOnce(
      mockEvmWalletProvider.getWalletAddressBytes(),
    );
    vi.spyOn(moneyMarket, 'repay').mockReturnValueOnce({
      ok: true,
      value: '0x',
    });
    vi.spyOn(IntentRelayApiService, 'relayTxAndWaitPacket').mockResolvedValueOnce({
      ok: true,
      value: {
        dst_tx_hash: '0x',
      } as PacketData,
    });

    const result = await moneyMarket.repayAndSubmit(
      {
        token: supportedTokens[0]?.address as Address,
        amount: 1000000000000000000n,
      },
      mockBscSpokeProvider,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toEqual(['0x', '0x']);
    }
  });

  it('should be defined', () => {
    expect(MoneyMarketService).toBeDefined();
    const testAsset = moneyMarketReserveAssets[0];
    const wrongAsset = '0x0000000000000000000000000000000000000000';

    expect(isMoneyMarketReserveAsset(testAsset)).toBe(true);
    expect(isMoneyMarketReserveAsset(wrongAsset)).toBe(false);
  });
});
