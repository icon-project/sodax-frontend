import { XService } from '@/core/XService';
import type { XToken, ISuiWalletProvider } from '@sodax/types';
import { SuiWalletProvider } from '@sodax/wallet-sdk-core';
import { isNativeToken } from '@/utils';
import { assert, hasFunctionProperty, hasStringProperty, isRecord } from '@/shared/guards';

// These fields are hydrated by SuiHydrator from @mysten/dapp-kit hooks.
// We use structural interfaces instead of importing nominal types from @mysten/wallet-standard
// because dapp-kit may resolve a different version than wallet-sdk-core, causing nominal mismatch.
// The `getBalance` method is the only field we call directly — the rest are passed through.
interface SuiClientLike {
  getBalance(input: { owner: string; coinType: string }): Promise<{ totalBalance: string }>;
}

export class SuiXService extends XService {
  private static instance: SuiXService;

  // Hydrated by SuiHydrator. Start undefined because wallet may not be connected yet.
  // suiClient is typed structurally for the methods we call directly.
  // suiWallet/suiAccount are opaque — stored and passed through to SuiWalletProvider.
  public suiClient: SuiClientLike | undefined;
  public suiWallet: unknown;
  public suiAccount: unknown;

  private constructor() {
    super('SUI');
  }

  public static getInstance(): SuiXService {
    if (!SuiXService.instance) {
      SuiXService.instance = new SuiXService();
    }
    return SuiXService.instance;
  }

  createWalletProvider(): ISuiWalletProvider | undefined {
    if (!this.suiClient || !this.suiWallet || !this.suiAccount) {
      console.warn(
        '[SuiXService] createWalletProvider: missing dependencies — wallet not connected yet',
        { hasClient: !!this.suiClient, hasWallet: !!this.suiWallet, hasAccount: !!this.suiAccount },
      );
      return undefined;
    }

    // Runtime validation before passing data to wallet-sdk-core. This avoids "trust me bro" casting.
    // Note: we validate the minimum shape we rely on; the exact nominal types may differ by package version.
    const clientOk =
      isRecord(this.suiClient) &&
      hasFunctionProperty(this.suiClient, 'executeTransactionBlock') &&
      hasFunctionProperty(this.suiClient, 'devInspectTransactionBlock') &&
      hasFunctionProperty(this.suiClient, 'getCoins');
    assert(clientOk, '[SuiXService] createWalletProvider: invalid Sui client shape');

    const walletOk = isRecord(this.suiWallet) && hasStringProperty(this.suiWallet, 'name');
    assert(walletOk, '[SuiXService] createWalletProvider: invalid Sui wallet shape');

    const accountOk = isRecord(this.suiAccount) && hasStringProperty(this.suiAccount, 'address');
    assert(accountOk, '[SuiXService] createWalletProvider: invalid Sui account shape');

    // Version mismatch cast: dapp-kit hooks return types from their bundled @mysten/wallet-standard,
    // which differs nominally from wallet-sdk-core's version. Structurally identical at runtime.
    type SuiWalletProviderConfig = ConstructorParameters<typeof SuiWalletProvider>[0];
    return new SuiWalletProvider({
      client: this.suiClient,
      wallet: this.suiWallet,
      account: this.suiAccount,
    } as unknown as SuiWalletProviderConfig);
  }

  // getBalance is not used because getBalances uses getAllBalances which returns all balances

  async getBalances(address: string | undefined, xTokens: readonly XToken[]): Promise<Record<string, bigint>> {
    if (!address || !this.suiClient) return {};
    // Capture in local so the closure sees a narrowed (non-undefined) reference.
    const client = this.suiClient;
    try {
      const balancePromises = xTokens.map(async xToken => {
        let coinType = isNativeToken(xToken) ? '0x2::sui::SUI' : xToken.address;

        //  TODO: hard coded for getting legacy bnUSD balance
        if (
          coinType ===
          '0x03917a812fe4a6d6bc779c5ab53f8a80ba741f8af04121193fc44e0f662e2ceb::balanced_dollar::BALANCED_DOLLAR'
        ) {
          coinType =
            '0x3917a812fe4a6d6bc779c5ab53f8a80ba741f8af04121193fc44e0f662e2ceb::balanced_dollar::BALANCED_DOLLAR';
        }

        const balance = await client.getBalance({
          owner: address,
          coinType: coinType,
        });

        return {
          address: xToken.address,
          balance: balance ? BigInt(balance.totalBalance) : undefined,
        };
      });

      const results = await Promise.all(balancePromises);

      const tokenMap: Record<string, bigint> = {};
      results.forEach(result => {
        if (result.balance !== undefined) {
          tokenMap[result.address] = result.balance;
        }
      });

      return tokenMap;
    } catch (error) {
      console.error('[wallet-sdk-react] SUI getBalances failed:', error);
      return {};
    }
  }
}
