import type { Network } from '@injectivelabs/networks';
import {
  MsgExecuteContract,
  MsgExecuteContractCompat,
  createTransaction,
  PrivateKey,
  getInjectiveSignerAddress,
  type TxResponse,
} from '@injectivelabs/sdk-ts';
import type { Hex, JsonObject, InjectiveCoin, IInjectiveWalletProvider, InjectiveEoaAddress } from '@sodax/types';
import { InjectiveExecuteResponse, type InjectiveRawTransaction } from '@sodax/types';
import type { MsgBroadcaster } from '@injectivelabs/wallet-core';
import { MsgBroadcasterWithPk } from '@injectivelabs/sdk-ts';
import type { ChainId, EvmChainId } from '@injectivelabs/ts-types';

/**
 * Injective Wallet Configuration Types
 */

export type BrowserExtensionInjectiveWalletConfig = {
  msgBroadcaster: MsgBroadcaster;
};

export type SecretInjectiveWalletConfig = {
  secret:
    | {
        privateKey: string;
      }
    | {
        mnemonics: string;
      };
  chainId: ChainId;
  network: Network;
  evmOptions?: {
    evmChainId: EvmChainId;
    rpcUrl: `http${string}`;
  };
};

export type InjectiveWalletConfig = BrowserExtensionInjectiveWalletConfig | SecretInjectiveWalletConfig;

/**
 * Injective Type Guards
 */

export function isBrowserExtensionInjectiveWalletConfig(
  config: InjectiveWalletConfig,
): config is BrowserExtensionInjectiveWalletConfig {
  return 'msgBroadcaster' in config;
}

export function isSecretInjectiveWalletConfig(config: InjectiveWalletConfig): config is SecretInjectiveWalletConfig {
  return (
    'secret' in config &&
    typeof config.secret === 'object' &&
    (('privateKey' in config.secret && typeof config.secret.privateKey === 'string') ||
      ('mnemonics' in config.secret && typeof config.secret.mnemonics === 'string')) &&
    'network' in config &&
    'chainId' in config
  );
}

export type InjectiveWallet = {
  msgBroadcaster: MsgBroadcaster | MsgBroadcasterWithPk;
};

export class InjectiveWalletProvider implements IInjectiveWalletProvider {
  public wallet: InjectiveWallet;

  constructor(config: InjectiveWalletConfig) {
    if (isBrowserExtensionInjectiveWalletConfig(config)) {
      this.wallet = {
        msgBroadcaster: config.msgBroadcaster,
      };
    } else if (isSecretInjectiveWalletConfig(config)) {
      let privateKey: PrivateKey;
      if ('privateKey' in config.secret) {
        privateKey = PrivateKey.fromPrivateKey(config.secret.privateKey);
      } else if ('mnemonics' in config.secret) {
        privateKey = PrivateKey.fromMnemonic(config.secret.mnemonics);
      } else {
        throw new Error('Invalid Secret Injective wallet config');
      }
      this.wallet = {
        msgBroadcaster: new MsgBroadcasterWithPk({ privateKey, network: config.network }),
      };
    } else {
      throw new Error('Invalid Injective wallet config');
    }
  }

  async getRawTransaction(
    chainId: string,
    _: string,
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    memo?: string,
  ): Promise<InjectiveRawTransaction> {
    const msgExec = MsgExecuteContract.fromJSON({
      contractAddress: contractAddress,
      sender: senderAddress,
      msg: msg as object,
      funds: [],
    });
    const { txRaw } = createTransaction({
      message: msgExec,
      memo: memo || '',
      pubKey: await this.getWalletPubKey(),
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
    return rawTx;
  }

  // return wallet address as bech32
  async getWalletAddress(): Promise<InjectiveEoaAddress> {
    if (this.wallet.msgBroadcaster instanceof MsgBroadcasterWithPk) {
      return getInjectiveSignerAddress(this.wallet.msgBroadcaster.privateKey.toAddress().toBech32());
    }
    const addresses = await this.wallet.msgBroadcaster.walletStrategy.getAddresses();
    const injectiveAddresses = addresses.map(getInjectiveSignerAddress);
    if (injectiveAddresses.length <= 0 || injectiveAddresses[0] === undefined) {
      return Promise.reject(new Error('Wallet address not found'));
    }

    return injectiveAddresses[0];
  }

  async getWalletPubKey(): Promise<string> {
    if (this.wallet.msgBroadcaster instanceof MsgBroadcasterWithPk) {
      return this.wallet.msgBroadcaster.privateKey.toPublicKey().toString();
    }
    const pubKey = await this.wallet.msgBroadcaster.walletStrategy.getPubKey();
    if (pubKey === undefined) {
      return Promise.reject(new Error('Wallet public key not found'));
    }
    return pubKey;
  }

  async execute(
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    funds?: InjectiveCoin[],
  ): Promise<InjectiveExecuteResponse> {
    const msgExec = MsgExecuteContractCompat.fromJSON({
      contractAddress: contractAddress,
      sender: senderAddress,
      msg: msg as object,
      funds: funds || [],
    });

    let txResult: TxResponse;

    if (this.wallet.msgBroadcaster instanceof MsgBroadcasterWithPk) {
      txResult = await this.wallet.msgBroadcaster.broadcast({
        msgs: msgExec,
      });
    } else {
      txResult = await this.wallet.msgBroadcaster.broadcastWithFeeDelegation({
        msgs: msgExec,
        injectiveAddress: await this.getWalletAddress(),
      });
    }

    return InjectiveExecuteResponse.fromTxResponse(txResult);
  }
}
