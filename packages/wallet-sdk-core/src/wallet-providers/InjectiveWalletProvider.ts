import type { Network } from '@injectivelabs/networks';
import {
  MsgExecuteContract,
  MsgExecuteContractCompat,
  createTransaction,
  PrivateKey,
  getInjectiveSignerAddress,
  type TxResponse,
} from '@injectivelabs/sdk-ts';
import type {
  Hex,
  JsonObject,
  InjectiveCoin,
  IInjectiveWalletProvider,
  InjectiveEoaAddress,
  InjectiveExecuteResponse,
  InjectiveRawTransaction,
} from '@sodax/types';
import type { MsgBroadcaster } from '@injectivelabs/wallet-core';
import { MsgBroadcasterWithPk } from '@injectivelabs/sdk-ts';
import type { ChainId, EvmChainId } from '@injectivelabs/ts-types';
import { BaseWalletProvider } from './BaseWalletProvider.js';

/**
 * Injective Wallet Configuration Types
 */

/**
 * Defaults applied to every call. Per-call options shallow-merge over these.
 * `msgBroadcaster` options apply at construction time only (private-key path) —
 * the upstream MsgBroadcasterWithPk doesn't support post-construction reconfig.
 */
export type InjectiveWalletDefaults = {
  /** Coins attached to `getRawTransaction`/`execute` if caller doesn't supply funds. */
  defaultFunds?: InjectiveCoin[];
  /** Default memo on transactions. */
  defaultMemo?: string;
  /** Sequence override for `createTransaction`. Default 0. */
  sequence?: number;
  /** Account number override for `createTransaction`. Default 0. */
  accountNumber?: number;
};

export type BrowserExtensionInjectiveWalletConfig = {
  msgBroadcaster: MsgBroadcaster;
  defaults?: InjectiveWalletDefaults;
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
  defaults?: InjectiveWalletDefaults;
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

function txResponseToExecuteResponse(txResult: TxResponse): InjectiveExecuteResponse {
  return {
    height: txResult.height === undefined ? undefined : Number(txResult.height),
    transactionHash: txResult.txHash,
  };
}

export class InjectiveWalletProvider
  extends BaseWalletProvider<InjectiveWalletDefaults>
  implements IInjectiveWalletProvider
{
  public readonly chainType = 'INJECTIVE' as const;
  public wallet: InjectiveWallet;

  constructor(config: InjectiveWalletConfig) {
    super(config.defaults);

    if (isBrowserExtensionInjectiveWalletConfig(config)) {
      this.wallet = { msgBroadcaster: config.msgBroadcaster };
      return;
    }

    if (isSecretInjectiveWalletConfig(config)) {
      let privateKey: PrivateKey;
      if ('privateKey' in config.secret) {
        privateKey = PrivateKey.fromPrivateKey(config.secret.privateKey);
      } else if ('mnemonics' in config.secret) {
        privateKey = PrivateKey.fromMnemonic(config.secret.mnemonics);
      } else {
        throw new Error('Invalid Secret Injective wallet config');
      }
      this.wallet = { msgBroadcaster: new MsgBroadcasterWithPk({ privateKey, network: config.network }) };
      return;
    }

    throw new Error('Invalid Injective wallet config');
  }

  async getRawTransaction(
    chainId: string,
    _: string,
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    memo?: string,
    options?: InjectiveWalletDefaults,
  ): Promise<InjectiveRawTransaction> {
    const policy = this.mergeDefaults(options);
    const funds = policy.defaultFunds ?? [];
    const finalMemo = memo ?? policy.defaultMemo ?? '';
    const sequence = policy.sequence ?? 0;
    const accountNumber = policy.accountNumber ?? 0;

    const msgExec = MsgExecuteContract.fromJSON({
      contractAddress,
      sender: senderAddress,
      msg: msg as object,
      funds,
    });
    const { txRaw } = createTransaction({
      message: msgExec,
      memo: finalMemo,
      pubKey: await this.getWalletPubKey(),
      sequence,
      accountNumber,
      chainId,
    });

    return {
      from: senderAddress as Hex,
      to: contractAddress as Hex,
      signedDoc: {
        bodyBytes: txRaw.bodyBytes,
        chainId,
        accountNumber: BigInt(accountNumber),
        authInfoBytes: txRaw.authInfoBytes,
      },
    };
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
    options?: InjectiveWalletDefaults,
  ): Promise<InjectiveExecuteResponse> {
    const policy = this.mergeDefaults(options);
    const finalFunds = funds ?? policy.defaultFunds ?? [];
    const memo = policy.defaultMemo ?? '';

    const msgExec = MsgExecuteContractCompat.fromJSON({
      contractAddress,
      sender: senderAddress,
      msg: msg as object,
      funds: finalFunds,
    });

    let txResult: TxResponse;

    if (this.wallet.msgBroadcaster instanceof MsgBroadcasterWithPk) {
      txResult = await this.wallet.msgBroadcaster.broadcast({ msgs: msgExec, memo });
    } else {
      txResult = await this.wallet.msgBroadcaster.broadcastWithFeeDelegation({
        msgs: msgExec,
        injectiveAddress: await this.getWalletAddress(),
        memo,
      });
    }

    return txResponseToExecuteResponse(txResult);
  }
}
