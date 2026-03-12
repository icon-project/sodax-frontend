import { XService } from '@/core/XService';
import { StellarWalletsKit, WalletNetwork, allowAllModules } from '@creit.tech/stellar-wallets-kit';
import * as StellarSdk from '@stellar/stellar-sdk';
import CustomSorobanServer from './CustomSorobanServer';
import { getTokenBalance } from './utils';
import type { XToken } from '@sodax/types';

/** Base reserve in stroops (0.5 XLM). Each subentry (trustline, signer, data entry, offer) adds one base reserve. */
const STELLAR_BASE_RESERVE_STROOPS = 5_000_000;

/** Horizon account fields used for minimum balance. Minimum = (2 + subentry_count + num_sponsoring - num_sponsored) * base_reserve + selling_liabilities. */
interface StellarAccountReserveFields {
  subentry_count?: number;
  num_sponsoring?: number;
  num_sponsored?: number;
}

/** Parse XLM balance string (e.g. "198.8944970") to stroops (1 XLM = 10^7 stroops). */
function parseXlmBalanceToStroops(balanceStr: string): bigint {
  const parts = balanceStr.split('.');
  const whole = parts[0] ?? '0';
  const frac = (parts[1] ?? '').padEnd(7, '0').slice(0, 7);
  return BigInt(whole + frac);
}

export class StellarXService extends XService {
  private static instance: StellarXService;

  public walletsKit: StellarWalletsKit;
  public server: StellarSdk.Horizon.Server;
  public sorobanServer: CustomSorobanServer;

  private constructor() {
    super('STELLAR');

    this.walletsKit = new StellarWalletsKit({
      network: WalletNetwork.PUBLIC,
      modules: allowAllModules(),
    });

    this.server = new StellarSdk.Horizon.Server('https://horizon.stellar.org', { allowHttp: true });
    this.sorobanServer = new CustomSorobanServer('https://rpc.ankr.com/stellar_soroban', {});
  }

  public static getInstance(): StellarXService {
    if (!StellarXService.instance) {
      StellarXService.instance = new StellarXService();
    }
    return StellarXService.instance;
  }

  async getBalance(address: string | undefined, xToken: XToken): Promise<bigint> {
    if (!address) return BigInt(0);

    const stellarAccount = await this.server.loadAccount(address);

    if (xToken.symbol === 'XLM') {
      const xlmBalance = stellarAccount.balances.find(balance => balance.asset_type === 'native');
      if (xlmBalance) {
        const rawBalanceStroops = parseXlmBalanceToStroops(xlmBalance.balance);
        const sellingLiabilitiesStroops = (xlmBalance as { selling_liabilities?: string }).selling_liabilities
          ? parseXlmBalanceToStroops((xlmBalance as { selling_liabilities: string }).selling_liabilities)
          : BigInt(0);
        const reserveFields = stellarAccount as unknown as StellarAccountReserveFields;
        const subentryCount = reserveFields.subentry_count ?? 0;
        const numSponsoring = reserveFields.num_sponsoring ?? 0;
        const numSponsored = reserveFields.num_sponsored ?? 0;
        // Minimum balance = (2 + subentry_count + num_sponsoring - num_sponsored) * base_reserve + selling_liabilities.
        // When account has sponsored reserves (num_sponsored > 0), those reserves are paid by the sponsor, so we don't subtract them.
        const reserveCount = Math.max(0, 2 + subentryCount + numSponsoring - numSponsored);
        const minBalanceStroops =
          BigInt(reserveCount) * BigInt(STELLAR_BASE_RESERVE_STROOPS) + sellingLiabilitiesStroops;
        const availableStroops =
          rawBalanceStroops > minBalanceStroops ? rawBalanceStroops - minBalanceStroops : BigInt(0);
        return availableStroops;
      }
    } else {
      try {
        const txBuilder = new StellarSdk.TransactionBuilder(stellarAccount, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.PUBLIC,
        });

        const balance = await getTokenBalance(address, xToken.address, txBuilder, this.sorobanServer);
        return balance;
      } catch (e) {
        console.error(`Error while fetching token on Stellar: ${xToken.symbol}, Error: ${e}`);
      }
    }

    return BigInt(0);
  }
}
