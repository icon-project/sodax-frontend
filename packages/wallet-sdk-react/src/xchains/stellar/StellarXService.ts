import { XService } from '@/core/XService';
import { StellarWalletsKit, WalletNetwork, allowAllModules } from '@creit.tech/stellar-wallets-kit';
import * as StellarSdk from '@stellar/stellar-sdk';
import CustomSorobanServer from './CustomSorobanServer';
import { getTokenBalance } from './utils';
import type { XToken } from '@sodax/types';

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
        return BigInt(xlmBalance.balance.replace('.', ''));
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
