import type { MsgBroadcaster } from '@injectivelabs/wallet-core';
import { MsgExecuteContract, MsgExecuteContractCompat } from '@injectivelabs/sdk-ts';
import { createTransaction } from '@injectivelabs/sdk-ts';
import type { Hex, JsonObject, InjectiveCoin, IInjectiveWalletProvider, InjectiveEoaAddress } from '@sodax/types';
import { InjectiveExecuteResponse, type InjectiveRawTransaction } from '@sodax/types';

/**
 * Injective Wallet Configuration Types
 */

export type BrowserExtensionInjectiveWalletConfig = {
  msgBroadcaster: MsgBroadcaster;
  walletAddress: InjectiveEoaAddress | undefined;
};

export type InjectiveWalletConfig = BrowserExtensionInjectiveWalletConfig;

/**
 * Injective Type Guards
 */

export function isBrowserExtensionInjectiveWalletConfig(
  config: InjectiveWalletConfig,
): config is BrowserExtensionInjectiveWalletConfig {
  return 'msgBroadcaster' in config && 'walletAddress' in config;
}

export class InjectiveWalletProvider implements IInjectiveWalletProvider {
  private msgBroadcaster: MsgBroadcaster;
  public walletAddress: InjectiveEoaAddress | undefined;

  constructor(config: InjectiveWalletConfig) {
    if (isBrowserExtensionInjectiveWalletConfig(config)) {
      this.msgBroadcaster = config.msgBroadcaster;
      this.walletAddress = config.walletAddress;
    } else {
      throw new Error('Invalid Injective wallet config');
    }
  }

  getRawTransaction(
    chainId: string,
    _: string,
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    memo?: string,
  ): Promise<InjectiveRawTransaction> {
    if (!this.walletAddress) {
      throw new Error('Wallet address not found');
    }

    const msgExec = MsgExecuteContract.fromJSON({
      contractAddress: contractAddress,
      sender: senderAddress,
      msg: msg as object,
      funds: [],
    });
    const { txRaw } = createTransaction({
      message: msgExec,
      memo: '',
      pubKey: Buffer.from(this.walletAddress).toString(),
      sequence: 0,
      accountNumber: 0,
      chainId: chainId,
    });

    const rawTx = {
      from: senderAddress as Hex,
      to: contractAddress as Hex,
      signedDoc: {
        bodyBytes: txRaw.bodyBytes,
        chainId: chainId,
        accountNumber: BigInt(0),
        authInfoBytes: txRaw.authInfoBytes,
      },
    };
    return Promise.resolve(rawTx);
  }

  async getWalletAddress(): Promise<InjectiveEoaAddress> {
    if (!this.walletAddress) {
      throw new Error('Wallet address not found');
    }

    return Promise.resolve(this.walletAddress);
  }

  async execute(
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    funds?: InjectiveCoin[],
  ): Promise<InjectiveExecuteResponse> {
    if (!this.walletAddress) {
      throw new Error('Wallet address not found');
    }

    const msgExec = MsgExecuteContractCompat.fromJSON({
      contractAddress: contractAddress,
      sender: senderAddress,
      msg: msg as object,
      funds: funds || [],
    });

    const txResult = await this.msgBroadcaster.broadcastWithFeeDelegation({
      msgs: msgExec,
      injectiveAddress: this.walletAddress,
    });

    return InjectiveExecuteResponse.fromTxResponse(txResult);
  }
}
