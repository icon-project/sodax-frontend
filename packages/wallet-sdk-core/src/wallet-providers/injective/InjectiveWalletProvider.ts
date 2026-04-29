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
import { MsgBroadcasterWithPk } from '@injectivelabs/sdk-ts';
import { BaseWalletProvider } from '../BaseWalletProvider.js';
import type {
  BrowserExtensionInjectiveWalletConfig,
  InjectiveWallet,
  InjectiveWalletConfig,
  InjectiveWalletDefaults,
  SecretInjectiveWalletConfig,
} from './types.js';

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
    // Only forward `memo` when explicitly configured — base did not pass one,
    // and some upstream broadcasters distinguish absent vs empty-string memo.
    const memoOverride = policy.defaultMemo === undefined ? {} : { memo: policy.defaultMemo };

    const msgExec = MsgExecuteContractCompat.fromJSON({
      contractAddress,
      sender: senderAddress,
      msg: msg as object,
      funds: finalFunds,
    });

    let txResult: TxResponse;

    if (this.wallet.msgBroadcaster instanceof MsgBroadcasterWithPk) {
      txResult = await this.wallet.msgBroadcaster.broadcast({ msgs: msgExec, ...memoOverride });
    } else {
      txResult = await this.wallet.msgBroadcaster.broadcastWithFeeDelegation({
        msgs: msgExec,
        injectiveAddress: await this.getWalletAddress(),
        ...memoOverride,
      });
    }

    return txResponseToExecuteResponse(txResult);
  }
}
