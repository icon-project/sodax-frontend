import type { IconTransactionResult, IcxCallTransaction, IIconWalletProvider } from '@sodax/types';
import type { IconService } from 'icon-sdk-js';
import * as IconSdkRaw from 'icon-sdk-js';
import { BaseWalletProvider } from '../BaseWalletProvider.js';
import type {
  BrowserExtensionIconWalletConfig,
  HanaWalletResponseEvent,
  Hash,
  IconAddress,
  IconBrowserExtensionWallet,
  IconEoaAddress,
  IconPkWallet,
  IconWallet,
  IconWalletConfig,
  IconWalletDefaults,
  JsonRpcPayloadResponse,
  PrivateKeyIconWalletConfig,
  RelayRequestDetail,
  RelayRequestSigning,
  ResponseAddressType,
  ResponseSigningType,
} from './types.js';

const IconSdk = ('default' in IconSdkRaw.default ? IconSdkRaw.default : IconSdkRaw) as typeof IconSdkRaw;
const { Converter, CallTransactionBuilder, Wallet } = IconSdk;

const DEFAULT_STEP_LIMIT = 3_000_000;
const DEFAULT_VERSION = '0x3';
const DEFAULT_JSON_RPC_ID = 99999;

interface RelayResponseEventDetail {
  type: HanaWalletResponseEvent;
  payload: unknown;
}

export class IconWalletProvider extends BaseWalletProvider<IconWalletDefaults> implements IIconWalletProvider {
  public readonly chainType = 'ICON' as const;
  public readonly iconService: IconService;
  private readonly wallet: IconWallet;

  constructor(wallet: IconWalletConfig) {
    super(wallet.defaults);

    if (isPrivateKeyIconWalletConfig(wallet)) {
      this.wallet = { type: 'PRIVATE_KEY', wallet: Wallet.loadPrivateKey(wallet.privateKey.slice(2)) };
      this.iconService = new IconSdk.IconService(new IconSdk.IconService.HttpProvider(wallet.rpcUrl));
      return;
    }

    if (isBrowserExtensionIconWalletConfig(wallet)) {
      this.wallet = { type: 'BROWSER_EXTENSION', wallet: wallet.walletAddress };
      this.iconService = new IconSdk.IconService(new IconSdk.IconService.HttpProvider(wallet.rpcUrl));
      return;
    }

    throw new Error('Invalid Icon wallet config');
  }

  public async sendTransaction(tx: IcxCallTransaction, options?: IconWalletDefaults): Promise<Hash> {
    const policy = this.mergeDefaults(options);
    const stepLimit = policy.stepLimit ?? DEFAULT_STEP_LIMIT;
    const version = tx.version ?? policy.version ?? DEFAULT_VERSION;
    const timestamp = tx.timestamp ?? policy.timestampProvider?.() ?? Date.now() * 1000;
    const jsonRpcId = policy.jsonRpcId ?? DEFAULT_JSON_RPC_ID;

    const builtTx = new CallTransactionBuilder()
      .from(tx.from)
      .to(tx.to)
      .stepLimit(Converter.toHex(stepLimit))
      .nid(tx.nid)
      .version(version)
      .timestamp(Converter.toHex(timestamp))
      .value(tx.value)
      .method(tx.method)
      .params(tx.params)
      .build();

    if (!isIconPkWallet(this.wallet)) {
      const result = await requestJsonRpc(builtTx, jsonRpcId);
      return result.result satisfies string as Hash;
    }
    const signedTx = new IconSdk.IconService.SignedTransaction(builtTx, this.wallet.wallet);
    const result = await this.iconService.sendTransaction(signedTx).execute();
    return result satisfies string as Hash;
  }

  public async waitForTransactionReceipt(txHash: Hash): Promise<IconTransactionResult> {
    const result = await this.iconService.waitTransactionResult(txHash).execute();
    return {
      ...result,
      status: +result.status,
      cumulativeStepUsed: BigNumberToBigInt(result.cumulativeStepUsed),
      stepUsed: BigNumberToBigInt(result.stepUsed),
      stepPrice: BigNumberToBigInt(result.stepPrice),
    } satisfies IconTransactionResult;
  }

  async getWalletAddress(): Promise<IconEoaAddress> {
    if (!this.wallet.wallet) {
      throw new Error('Wallet not initialized');
    }
    return isIconPkWallet(this.wallet) ? (this.wallet.wallet.getAddress() as IconEoaAddress) : this.wallet.wallet;
  }
}

/**
 * Icon Type Guards
 */

export function isIconPkWallet(wallet: IconWallet): wallet is IconPkWallet {
  return wallet.type === 'PRIVATE_KEY';
}

export function isIconBrowserExtensionWallet(wallet: IconWallet): wallet is IconBrowserExtensionWallet {
  return wallet.type === 'BROWSER_EXTENSION';
}

export function isPrivateKeyIconWalletConfig(config: IconWalletConfig): config is PrivateKeyIconWalletConfig {
  return 'privateKey' in config && config.privateKey.startsWith('0x');
}

export function isBrowserExtensionIconWalletConfig(
  config: IconWalletConfig,
): config is BrowserExtensionIconWalletConfig {
  return 'walletAddress' in config && (isIconEoaAddress(config.walletAddress) || !config.walletAddress);
}

export function isIconAddress(value: unknown): value is IconAddress {
  return typeof value === 'string' && /^hx[a-f0-9]{40}$|^cx[a-f0-9]{40}$/.test(value);
}

export function isIconEoaAddress(value: unknown): value is IconEoaAddress {
  return typeof value === 'string' && /^hx[a-f0-9]{40}$/.test(value);
}

export function isResponseAddressType(value: unknown): value is ResponseAddressType {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'payload' in value &&
    value.type === 'RESPONSE_ADDRESS' &&
    isIconAddress(value.payload)
  );
}

export function isResponseSigningType(value: unknown): value is ResponseSigningType {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'payload' in value &&
    value.type === 'RESPONSE_SIGNING' &&
    typeof value.payload === 'string'
  );
}

export function isJsonRpcPayloadResponse(value: unknown): value is JsonRpcPayloadResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'result' in value &&
    typeof value.result === 'string'
  );
}

/**
 * Methods to interact with Icon Browser Extension Wallet (e.g. Hana Wallet)
 */

export function requestAddress(): Promise<IconAddress> {
  return new Promise(resolve => {
    const eventHandler = (event: Event) => {
      const customEvent = event as CustomEvent<RelayResponseEventDetail>;
      const response = customEvent.detail;
      if (isResponseAddressType(response)) {
        window.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);
        resolve(response.payload);
      }
    };

    window.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler, false);
    window.addEventListener('ICONEX_RELAY_RESPONSE', eventHandler, false);
    window.dispatchEvent(
      new CustomEvent<RelayRequestDetail>('ICONEX_RELAY_REQUEST', {
        detail: { type: 'REQUEST_ADDRESS' },
      }),
    );
  });
}

export function requestSigning(from: IconAddress, hash: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const signRequest = new CustomEvent<RelayRequestSigning>('ICONEX_RELAY_REQUEST', {
      detail: { type: 'REQUEST_SIGNING', payload: { from, hash } },
    });

    const eventHandler = (event: Event) => {
      const customEvent = event as CustomEvent<RelayResponseEventDetail>;
      const response = customEvent.detail;
      if (isResponseSigningType(response)) {
        window.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);
        resolve(response.payload);
      } else if (response.type === 'CANCEL_SIGNING') {
        reject(new Error('CANCEL_SIGNING'));
      }
    };

    window.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);
    window.addEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);
    window.dispatchEvent(signRequest);
  });
}

export function requestJsonRpc(rawTransaction: unknown, id = 99999): Promise<JsonRpcPayloadResponse> {
  return new Promise((resolve, reject) => {
    const eventHandler = (event: Event) => {
      const customEvent = event as CustomEvent<RelayResponseEventDetail>;
      const { type, payload } = customEvent.detail;
      if (type === 'RESPONSE_JSON-RPC') {
        window.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);
        if (isJsonRpcPayloadResponse(payload)) {
          resolve(payload);
        } else {
          reject(new Error('Invalid payload response type (expected JsonRpcPayloadResponse)'));
        }
      } else if (type === 'CANCEL_JSON-RPC') {
        window.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);
        reject(new Error('CANCEL_JSON-RPC'));
      }
    };

    window.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);
    window.addEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);
    window.dispatchEvent(
      new CustomEvent<RelayRequestDetail>('ICONEX_RELAY_REQUEST', {
        detail: {
          type: 'REQUEST_JSON-RPC',
          payload: { jsonrpc: '2.0', method: 'icx_sendTransaction', params: rawTransaction, id },
        },
      }),
    );
  });
}

/**
 * Icon Utils
 */

export function BigNumberToBigInt(bigNumber: BigNumber): bigint {
  if (!bigNumber.isInteger()) {
    throw new Error('Cannot convert decimal number to BigInt');
  }
  return BigInt(bigNumber.toFixed(0));
}
