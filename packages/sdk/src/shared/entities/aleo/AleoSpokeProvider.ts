import { type Hex, toHex } from 'viem';
import type { TxReturnType, AleoSpokeProviderType, AleoGasEstimate } from '../../types.js';
import type { IRawSpokeProvider, ISpokeProvider } from '../Providers.js';
import type {
  IAleoWalletProvider,
  AleoSpokeChainConfig,
  AleoExecuteOptions,
  WalletAddressProvider,
  AleoRawTransaction,
  AleoProgramId,
} from '@sodax/types';

import { isAleoRawSpokeProvider } from '../../guards.js';
import { AleoNetworkClient, BHP256, ProgramManager, Plaintext } from '@provablehq/sdk';
import { decodeBech32m } from '../../utils/bech32m.js';
import { DEFAULT_MAX_RETRY } from '../../constants.js';

export const ALEO_DEFAULT_TIMEOUT = 45000;
const ALEO_DEFAULT_CHECK_INTERVAL = 2000;

const ALEO_ADDRESS_PREFIX = 'aleo1';
const ALEO_ADDRESS_LENGTH = 63;
const ALEO_TX_PREFIX = 'at1';
const ALEO_TX_LENGTH = 61;

/** Base spoke provider for Aleo — handles RPC activities, balance queries, block heights, and transaction verification. */
export class AleoBaseSpokeProvider {
  public readonly chainConfig: AleoSpokeChainConfig;
  public readonly rpcUrl: string;
  public readonly networkClient: AleoNetworkClient;
  public readonly programManager: ProgramManager;

  constructor(config: AleoSpokeChainConfig, rpcUrl?: string) {
    this.chainConfig = config;
    this.rpcUrl = rpcUrl ?? config.rpcUrl;
    this.networkClient = new AleoNetworkClient(this.rpcUrl);
    this.programManager = new ProgramManager(this.rpcUrl);
  }

  static getAddressBCSBytes(aleoAddress: string): Hex {
    if (!AleoBaseSpokeProvider.isValidAleoAddress(aleoAddress)) {
      throw new Error(`Invalid Aleo address format: ${aleoAddress}`);
    }

    const { data } = decodeBech32m(aleoAddress);
    return toHex(new Uint8Array([...data].reverse()));
  }

  static isValidAleoAddress(address: string): boolean {
    return (
      typeof address === 'string' && address.startsWith(ALEO_ADDRESS_PREFIX) && address.length === ALEO_ADDRESS_LENGTH
    );
  }

  static isValidTransactionId(txId: string): boolean {
    return typeof txId === 'string' && txId.startsWith(ALEO_TX_PREFIX) && txId.length === ALEO_TX_LENGTH;
  }

  static formatAmount(amount: bigint, type = 'u128'): string {
    return `${amount}${type}`;
  }

  /**
   * Convert a hex string to a Leo [u8; 32] array literal.
   * Left-pads shorter inputs to 32 bytes.
   * Used for cross-chain address/data encoding in Aleo programs.
   *
   * @param hex - Hex string (with or without 0x prefix)
   * @returns Leo array literal string, e.g., "[0u8, 0u8, ..., 171u8, 205u8]"
   */
  static hexToAleoU8Array(hex: string): string {
    let normalized = hex.trim().toLowerCase();
    if (normalized.startsWith('0x')) normalized = normalized.slice(2);
    if (normalized.length % 2 === 1) normalized = `0${normalized}`;

    const bytes = new Uint8Array(normalized.match(/.{1,2}/g)?.map(byte => Number.parseInt(byte, 16)) ?? []);

    if (bytes.length > 32) throw new Error(`Hex input exceeds 32 bytes: ${bytes.length}`);

    // Pad to 32 bytes (left-padded)
    const padded = new Uint8Array(32);
    padded.set(bytes, 32 - bytes.length);

    const leoBytes = Array.from(padded)
      .map(b => `${b}u8`)
      .join(', ');

    return `[${leoBytes}]`;
  }

  async isConnSnUsed(connSn: bigint): Promise<boolean> {
    try {
      const value = await this.networkClient.getProgramMappingValue(
        this.chainConfig.addresses.connection,
        this.chainConfig.mappings.messages,
        `${connSn}u128`,
      );
      return value != null;
    } catch {
      return false;
    }
  }

  async generateUniqueConnSn(inputConnSn?: bigint, maxRetries = DEFAULT_MAX_RETRY): Promise<bigint> {
    if (inputConnSn != null) {
      const used = await this.isConnSnUsed(inputConnSn);
      if (!used) return inputConnSn;
    }

    for (let i = 0; i < maxRetries; i++) {
      // Allocate a 8-byte (64-bit) buffer and fill it with cryptographically
      // secure random values — much stronger than Math.random()
      const bytes = new Uint8Array(8);
      crypto.getRandomValues(bytes);

      // Interpret the 16 bytes as a single 128-bit unsigned integer.
      // Each iteration shifts the accumulator left by 8 bits and ORs in the next byte,
      // effectively concatenating bytes into one BigInt: [b0, b1, ..., b15] → b0<<120 | b1<<112 | ... | b15
      // Result is always within u128 range (0 to 2^128-1) since we read exactly 16 bytes.
      const connSn = Array.from(bytes).reduce((acc, b) => (acc << 8n) | BigInt(b), 0n);

      // Verify this connSn hasn't already been used in the on-chain messages mapping
      const used = await this.isConnSnUsed(connSn);
      if (!used) return connSn;
    }
    throw new Error('Failed to generate unique connSn after maximum retries');
  }

  async getBalance(walletAddress: string, token: string): Promise<bigint> {
    if (!AleoBaseSpokeProvider.isValidAleoAddress(walletAddress)) {
      throw new Error(`Invalid Aleo address: ${walletAddress}`);
    }

    try {
      // Native credits: query credits.aleo/account directly
      if (token === this.chainConfig.nativeToken) {
        const balanceStr = await this.networkClient.getProgramMappingValue(
          this.chainConfig.addresses.creditsProgram,
          this.chainConfig.mappings.account,
          walletAddress,
        );
        return balanceStr ? BigInt(balanceStr.replace(/[^\d]/g, '')) : 0n;
      }
      const bhp = new BHP256();
      const structLiteral = `{ account: ${walletAddress}, token_id: ${token}field }`;
      const plaintext = Plaintext.fromString(structLiteral);
      const key = bhp.hash(plaintext.toBitsLe()).toString();
      const result = await this.networkClient.getProgramMappingValue(
        this.chainConfig.addresses.tokenRegistry,
        this.chainConfig.mappings.authorizedBalances,
        key,
      );
      if (result == null) return 0n;
      const match = result.match(/balance:\s*(\d+)u128/);
      return match?.[1] != null ? BigInt(match[1]) : 0n;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('Error fetching value') || error.message.includes('not found'))
      ) {
        return 0n;
      }
      throw error;
    }
  }

  async estimateFee(executeOptions: AleoExecuteOptions): Promise<AleoGasEstimate> {
    const gasEstimate = await this.programManager.estimateExecutionFee(executeOptions);
    return gasEstimate;
  }

  /**
   * Shared execution logic for transfer and transfer_native.
   * Both have identical params — only the function name differs.
   */
  private async executeTransfer<S extends AleoSpokeProviderType, R extends boolean = false>(
    functionName: 'transfer_token_public' | 'transfer_native_public',
    token: bigint,
    dstAddress: Hex,
    amount: bigint,
    connSn: bigint,
    data: Hex,
    feeAmount: bigint,
    hubChainId: bigint,
    hubAddress: Hex,
    spokeProvider: S,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

    const executeParams: AleoExecuteOptions = {
      programName: this.chainConfig.addresses.assetManager,
      functionName,
      inputs: [
        AleoBaseSpokeProvider.formatAmount(token, 'field'), // token: field
        AleoBaseSpokeProvider.hexToAleoU8Array(dstAddress), // dst_address: [u8; 32]
        AleoBaseSpokeProvider.formatAmount(amount, 'u64'), // amount: u64
        AleoBaseSpokeProvider.formatAmount(connSn, 'u128'), // conn_sn: u128
        AleoBaseSpokeProvider.hexToAleoU8Array(data), // data: [u8; 32]
        AleoBaseSpokeProvider.formatAmount(feeAmount, 'u64'), // fee_amount: u64
        AleoBaseSpokeProvider.formatAmount(hubChainId, 'u128'), // hub_chain_id: u128
        AleoBaseSpokeProvider.hexToAleoU8Array(hubAddress), // hub_address: [u8; 32]
      ],
    };

    if (raw || isAleoRawSpokeProvider(spokeProvider)) {
      return {
        from: walletAddress,
        to: this.chainConfig.addresses.assetManager as AleoProgramId,
        value: amount,
        data: executeParams,
      } satisfies AleoRawTransaction as TxReturnType<S, R>;
    }

    const result = await (spokeProvider as AleoSpokeProvider).walletProvider.execute(executeParams);
    return result.transactionId as TxReturnType<S, R>;
  }

  /**
   * Transfer token_registry tokens cross-chain via asset_manager.aleo/transfer.
   * Uses: token_registry.aleo/transfer_public for the token transfer.
   */
  async transfer<S extends AleoSpokeProviderType, R extends boolean = false>(
    token: bigint,
    dstAddress: Hex,
    amount: bigint,
    connSn: bigint,
    data: Hex,
    feeAmount: bigint,
    hubChainId: bigint,
    hubAddress: Hex,
    spokeProvider: S,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    return this.executeTransfer(
      'transfer_token_public',
      token,
      dstAddress,
      amount,
      connSn,
      data,
      feeAmount,
      hubChainId,
      hubAddress,
      spokeProvider,
      raw,
    );
  }

  /**
   * Transfer native credits cross-chain via asset_manager.aleo/transfer_native.
   * Uses: credits.aleo/transfer_public for the token transfer.
   */
  async transferNative<S extends AleoSpokeProviderType, R extends boolean = false>(
    token: bigint,
    dstAddress: Hex,
    amount: bigint,
    connSn: bigint,
    data: Hex,
    feeAmount: bigint,
    hubChainId: bigint,
    hubAddress: Hex,
    spokeProvider: S,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    return this.executeTransfer(
      'transfer_native_public',
      token,
      dstAddress,
      amount,
      connSn,
      data,
      feeAmount,
      hubChainId,
      hubAddress,
      spokeProvider,
      raw,
    );
  }

  /**
   * Send cross-chain message via connection.aleo program.
   *
   * Leo signature (connection_core.leo):
   * ```leo
   * async transition send_message(
   *   public dst_chain_id: u128,
   *   public dst_address: [u8; 32],
   *   public conn_sn: u128,
   *   public payload: [u8; 32]
   * ) -> Future
   * ```
   */
  async sendMessage<S extends AleoSpokeProviderType, R extends boolean = false>(
    dstChainId: bigint,
    dstAddress: Hex,
    connSn: bigint,
    payload: Hex,
    spokeProvider: S,
    raw?: R,
  ): Promise<TxReturnType<S, R>> {
    const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

    const executeParams: AleoExecuteOptions = {
      programName: this.chainConfig.addresses.connection,
      functionName: 'send_message',
      inputs: [
        AleoBaseSpokeProvider.formatAmount(dstChainId, 'u128'), // dst_chain_id: u128
        AleoBaseSpokeProvider.hexToAleoU8Array(dstAddress), // dst_address: [u8; 32]
        AleoBaseSpokeProvider.formatAmount(connSn, 'u128'), // conn_sn: u128
        AleoBaseSpokeProvider.hexToAleoU8Array(payload), // payload: [u8; 32]
      ],
    };

    if (raw || isAleoRawSpokeProvider(spokeProvider)) {
      return {
        from: walletAddress,
        to: this.chainConfig.addresses.connection as AleoProgramId,
        value: 0n,
        data: executeParams,
      } satisfies AleoRawTransaction as TxReturnType<S, R>;
    }

    const result = await (spokeProvider as AleoSpokeProvider).walletProvider.execute(executeParams);
    return result.transactionId as TxReturnType<S, R>;
  }
}

export type AleoRawSpokeProviderConfig = {
  chainConfig: AleoSpokeChainConfig;
  walletAddress: string;
  rpcUrl?: string;
};

/** Spoke provider that only knows the wallet address — returns raw transactions (AleoExecuteOptions) without broadcasting. */
export class AleoRawSpokeProvider extends AleoBaseSpokeProvider implements IRawSpokeProvider {
  public readonly walletProvider: WalletAddressProvider;
  public readonly raw = true;

  constructor(chainConfig: AleoSpokeChainConfig, walletAddress: string, rpcUrl?: string) {
    super(chainConfig, rpcUrl);

    if (!AleoBaseSpokeProvider.isValidAleoAddress(walletAddress)) {
      throw new Error(`Invalid Aleo wallet address: ${walletAddress}`);
    }

    this.walletProvider = {
      getWalletAddress: async () => walletAddress,
    };
  }
}

/** Full wallet integration — executes transactions via walletProvider and returns the confirmed transaction ID. */
export class AleoSpokeProvider extends AleoBaseSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: IAleoWalletProvider;

  constructor(config: AleoSpokeChainConfig, walletProvider: IAleoWalletProvider, rpcUrl?: string) {
    super(config, rpcUrl);
    this.walletProvider = walletProvider;
  }

  async getWalletAddress(): Promise<string> {
    return this.walletProvider.getWalletAddress();
  }

  // TODO: Send the transaction as soon as the transaction happens.
  // NOTE: Data should be handled in frontend itself. The data should not get lost even after refresh and all. [Document this]
  async waitForTransactionConfirmation(txId: string, timeout: number = ALEO_DEFAULT_TIMEOUT): Promise<boolean> {
    if (!AleoBaseSpokeProvider.isValidTransactionId(txId)) {
      throw new Error(`Invalid Aleo transaction ID: ${txId}`);
    }

    try {
      await this.walletProvider.waitForTransactionReceipt(txId, {
        timeout,
        checkInterval: ALEO_DEFAULT_CHECK_INTERVAL,
      });
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('rejected')) {
        return false;
      }
      throw error;
    }
  }
}
