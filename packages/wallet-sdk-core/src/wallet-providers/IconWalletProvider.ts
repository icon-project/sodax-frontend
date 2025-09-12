import type { IconTransactionResult, IcxCallTransaction, IIconWalletProvider } from '@sodax/types';
import type { IconService, Wallet as IconSdkWallet } from 'icon-sdk-js';
import * as IconSdkRaw from 'icon-sdk-js';
const IconSdk = ('default' in IconSdkRaw.default ? IconSdkRaw.default : IconSdkRaw) as typeof IconSdkRaw;
const { Converter, CallTransactionBuilder, Wallet } = IconSdk;

export class IconWalletProvider implements IIconWalletProvider {
  private readonly wallet: IconWallet;
  public readonly iconService: IconService;

  constructor(wallet: IconWalletConfig) {
    if (isPrivateKeyIconWalletConfig(wallet)) {
      this.wallet = {
        type: 'PRIVATE_KEY',
        wallet: Wallet.loadPrivateKey(wallet.privateKey.slice(2)),
      };
      this.iconService = new IconSdk.IconService(new IconSdk.IconService.HttpProvider(wallet.rpcUrl));
    } else if (isBrowserExtensionIconWalletConfig(wallet)) {
      this.wallet = {
        type: 'BROWSER_EXTENSION',
        wallet: wallet.walletAddress,
      };
      this.iconService = new IconSdk.IconService(new IconSdk.IconService.HttpProvider(wallet.rpcUrl));
    } else {
      throw new Error('Invalid Icon wallet config');
    }
  }

  public async sendTransaction(tx: IcxCallTransaction): Promise<Hash> {
    const builtTx = new CallTransactionBuilder()
      .from(tx.from)
      .to(tx.to)
      .stepLimit(Converter.toHex(3000000))
      .nid(tx.nid)
      .version(tx.version ?? '0x3')
      .timestamp(Converter.toHex(tx.timestamp ?? new Date().getTime() * 1000))
      .value(tx.value)
      .method(tx.method)
      .params(tx.params)
      .build();

    if (!isIconPkWallet(this.wallet)) {
      // if wallet starts with 0x, it's a private key
      const result = await requestJsonRpc(builtTx);

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
 * Icon Types
 */

export type IconJsonRpcVersion = '2.0';

export type Hex = `0x${string}`;
export type Hash = `0x${string}`;
export type IconAddress = `hx${string}` | `cx${string}`;
export type IconEoaAddress = `hx${string}`;

export type PrivateKeyIconWalletConfig = {
  privateKey: `0x${string}`;
  rpcUrl: `http${string}`;
};

export type BrowserExtensionIconWalletConfig = {
  walletAddress?: IconEoaAddress;
  rpcUrl: `http${string}`;
};

export type IconWalletConfig = PrivateKeyIconWalletConfig | BrowserExtensionIconWalletConfig;

export type IconPkWallet = {
  type: 'PRIVATE_KEY';
  wallet: IconSdkWallet;
};

export type IconBrowserExtensionWallet = {
  type: 'BROWSER_EXTENSION';
  wallet?: IconEoaAddress;
};

export type IconWallet = IconPkWallet | IconBrowserExtensionWallet;

export type HanaWalletRequestEvent =
  | 'REQUEST_HAS_ACCOUNT'
  | 'REQUEST_HAS_ADDRESS'
  | 'REQUEST_ADDRESS'
  | 'REQUEST_JSON'
  | 'REQUEST_SIGNING'
  | 'REQUEST_JSON-RPC';
export type HanaWalletResponseEvent =
  | 'RESPONSE_HAS_ACCOUNT'
  | 'RESPONSE_HAS_ADDRESS'
  | 'RESPONSE_ADDRESS'
  | 'RESPONSE_JSON-RPC'
  | 'RESPONSE_SIGNING'
  | 'CANCEL_SIGNING'
  | 'CANCEL_JSON-RPC';

export type ResponseAddressType = {
  type: 'RESPONSE_ADDRESS';
  payload: IconAddress;
};

export type ResponseSigningType = {
  type: 'RESPONSE_SIGNING';
  payload: string;
};

export type RelayRequestDetail = {
  type: HanaWalletRequestEvent;
  payload?: {
    jsonrpc: IconJsonRpcVersion;
    method: string;
    params: unknown;
    id: number | undefined;
  };
};

export type RelayRequestSigning = {
  type: 'REQUEST_SIGNING';
  payload: {
    from: IconAddress;
    hash: string;
  };
};

export type JsonRpcPayloadResponse = {
  id: number;
  result: string; // txHash
};

interface RelayResponseEventDetail {
  type: HanaWalletResponseEvent;
  payload: unknown;
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
        detail: {
          type: 'REQUEST_ADDRESS',
        },
      }),
    );
  });
}

export function requestSigning(from: IconAddress, hash: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const signRequest = new CustomEvent<RelayRequestSigning>('ICONEX_RELAY_REQUEST', {
      detail: {
        type: 'REQUEST_SIGNING',
        payload: {
          from,
          hash,
        },
      },
    });

    const eventHandler = (event: Event) => {
      const customEvent = event as CustomEvent<RelayResponseEventDetail>;
      const response = customEvent.detail;
      if (isResponseSigningType(response)) {
        window.removeEventListener('ICONEX_RELAY_RESPONSE', eventHandler as EventListener, false);

        // resolve signature
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
          payload: {
            jsonrpc: '2.0',
            method: 'icx_sendTransaction',
            params: rawTransaction,
            id: id,
          },
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
