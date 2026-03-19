import * as bitcoin from 'bitcoinjs-lib';
import {
  type IBitcoinWalletProvider,
  type BitcoinSpokeChainConfig,
  type WalletAddressProvider,
  type AddressType,
  type HubChainId,
  getIntentRelayChainId,
  detectBitcoinAddressType,
} from '@sodax/types';
import type { IRawSpokeProvider, ISpokeProvider } from '../Providers.js';
import type { BitcoinSpokeProviderType, TxReturnType } from '../../types.js';
import { isBitcoinRawSpokeProvider } from '../../guards.js';

import * as ecc from '@bitcoinerlab/secp256k1';
import { RadfiProvider, type RadfiConfig } from './RadfiProvider.js';
import { keccak256, type Hex } from 'viem';

bitcoin.initEccLib(ecc);
export type BitcoinUTXO = {
  txid: string;
  vout: number;
  value: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
};


export interface BitcoinTransactionResult {
  txHash: string;
  fee: number;
  size: number;
  virtualSize: number;
}

export type WalletMode = "USER" | "TRADING"

export interface Payload {
  src_address: string
  data: string
  src_chain_id: number
  dst_chain_id: number
  wallet_used: WalletMode
  timestamp: number
  address_type: AddressType
}

export interface OnDemandPayload {
  payload_hex: string,
  signature?: string
}

const BITCOIN_DEFAULT_FEE_RATE = 3;
const DUST_THRESHOLD = 546;

/**
 * Normalize a signed PSBT to base64 format.
 * Unisat/OKX wallets return hex, Xverse returns base64.
 * Radfi API expects base64.
 */
export function normalizePsbtToBase64(signedPsbt: string): string {
  const isHex = /^[0-9a-fA-F]+$/.test(signedPsbt);
  return isHex ? Buffer.from(signedPsbt, 'hex').toString('base64') : signedPsbt;
}

export class BitcoinBaseSpokeProvider {
  public readonly rpcUrl: string;
  public readonly network: bitcoin.networks.Network;
  public readonly chainConfig: BitcoinSpokeChainConfig;
  public readonly radfi: RadfiProvider;
  public readonly walletMode: WalletMode;
  public radfiAccessToken = '';
  public radfiRefreshToken = '';


  constructor(config: BitcoinSpokeChainConfig, radfiConfig: RadfiConfig, walletMode: WalletMode = "USER", rpcURL?: string) {
    this.chainConfig = config;
    this.rpcUrl = rpcURL ?? config.rpcUrl;
    this.network = config.network === 'TESTNET'
      ? bitcoin.networks.testnet
      : bitcoin.networks.bitcoin;
    this.radfi = new RadfiProvider(radfiConfig);
    this.walletMode = walletMode
  }

  public setRadfiAccessToken(token: string, refreshToken?: string) {
    this.radfiAccessToken = token;
    if (refreshToken !== undefined) {
      this.radfiRefreshToken = refreshToken;
    }
  }

  /**
   * Get current fee estimates
   */
  public async getFeeEstimate(targetBlocks = 6): Promise<number> {
    try {
      const response = await fetch(`${this.rpcUrl}/fee-estimates`);
      if (!response.ok) {
        return BITCOIN_DEFAULT_FEE_RATE;
      }
      const feeEstimates = await response.json();
      return feeEstimates[targetBlocks] ?? BITCOIN_DEFAULT_FEE_RATE;
    } catch {
      return BITCOIN_DEFAULT_FEE_RATE;
    }
  }


  public static async getBalance(
    tokenAddress: string,
    provider: BitcoinSpokeProviderType,
  ): Promise<bigint> {
    const walletAddress = await provider.walletProvider.getWalletAddress();

    // For native BTC (empty token address or special marker)
    if (!tokenAddress || tokenAddress === '0x' || tokenAddress === 'BTC') {
      const utxos = await provider.fetchUTXOs(walletAddress);
      const totalBalance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
      return BigInt(totalBalance);
    }
    throw new Error('Token balance queries not yet implemented for non-BTC assets');
  }

  public async fetchScriptPubKey(
    utxo: BitcoinUTXO,
    provider: BitcoinSpokeProviderType
  ): Promise<string> {
    const txHex = await provider.fetchRawTransaction(utxo.txid);
    const tx = bitcoin.Transaction.fromHex(txHex);
    const out = tx.outs[utxo.vout];
    if (!out) {
      throw new Error(`UTXO not found: ${utxo.txid}:${utxo.vout}`);
    }
    return out.script.toString('hex');
  }

  /**
   * Build a priority Bitcoin transaction with proper fee calculation
   */
  public static async buildBitcoinTransaction(
    utxos: BitcoinUTXO[],
    outputs: Array<{ address: string; value: number }>,
    changeAddress: string,
    provider: BitcoinSpokeProviderType,
    feeRate?: number,
  ): Promise<bitcoin.Psbt> {
    const psbt = new bitcoin.Psbt({ network: provider.network });
    const effectiveFeeRate = feeRate ?? await provider.getFeeEstimate();

    let inputSum = 0;
    const outputSum = outputs.reduce((sum, o) => sum + o.value, 0);

    // ---- Add inputs ----
    for (const utxo of utxos) {
      if (!utxo.status.confirmed) continue;


      const scriptPubKey = await provider.fetchScriptPubKey(utxo, provider);
      const isTaproot = scriptPubKey.startsWith('51');
      const isSegwitV0 = scriptPubKey.startsWith('00');

      if (isTaproot) {
        if (!provider.walletProvider.getPublicKey) {
          throw new Error('Missing public key for P2TR input');
        }
        const tapInternalKey = await provider.walletProvider.getPublicKey();
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: Buffer.from(scriptPubKey, 'hex'),
            value: utxo.value,
          },
          tapInternalKey: Buffer.from(tapInternalKey, 'hex'),
        });
      }
      else if (isSegwitV0) {
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: Buffer.from(scriptPubKey, 'hex'),
            value: utxo.value,
          },
        });
      } else {
        // Legacy P2PKH fallback
        const txHex = await provider.fetchRawTransaction(utxo.txid);
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          nonWitnessUtxo: Buffer.from(txHex, 'hex'),
        });
      }

      inputSum += utxo.value;

      // Conservative estimate WITHOUT assuming change yet
      const estimatedSize = provider.estimateTxSize(
        psbt.inputCount,
        outputs.length,
      );
      const estimatedFee = Math.ceil(effectiveFeeRate * estimatedSize);

      if (inputSum >= outputSum + estimatedFee + DUST_THRESHOLD) {
        break;
      }
    }

    // ---- Add recipient outputs ----
    for (const output of outputs) {
      psbt.addOutput({
        address: output.address,
        value: output.value,
      });
    }

    // ---- Final fee & change calculation ----
    const sizeWithChange = provider.estimateTxSize(
      psbt.inputCount,
      outputs.length + 1,
    );
    const sizeWithoutChange = provider.estimateTxSize(
      psbt.inputCount,
      outputs.length,
    );

    const feeWithChange = Math.ceil(effectiveFeeRate * sizeWithChange);
    const feeWithoutChange = Math.ceil(effectiveFeeRate * sizeWithoutChange);

    let change = inputSum - outputSum - feeWithChange;

    if (change < 0) {
      const confirmedCount = utxos.filter(u => u.status.confirmed).length;
      const unconfirmedCount = utxos.length - confirmedCount;
      const hint = unconfirmedCount > 0
        ? ` (${unconfirmedCount} unconfirmed UTXO(s) skipped — wait for confirmation)`
        : '';
      throw new Error(
        `Insufficient funds. Need ${outputSum + feeWithChange} satoshis, have ${inputSum}${hint}`,
      );
    }

    // ---- Add change only if it makes sense ----
    if (change > DUST_THRESHOLD) {
      psbt.addOutput({
        address: changeAddress,
        value: change,
      });
    } else {
      // Drop change, recompute fee without it
      const finalFee = feeWithoutChange;
      change = inputSum - outputSum - finalFee;

      if (change < 0) {
        throw new Error(
          `Insufficient funds after dust handling. Need ${outputSum + finalFee}`,
        );
      }
    }

    return psbt;
  }



  /**
   * Deposit operation - transfer BTC to the asset manager
   */
  public static async deposit<
    S extends BitcoinSpokeProviderType,
    R extends boolean = false
  >(
    token: string,
    amount: bigint,
    data: string,
    provider: S,
    raw?: R,
    accessToken = '',
  ): Promise<TxReturnType<S, R>> {
    try {
      const walletAddress = await provider.walletProvider.getWalletAddress();

      const returnRawTx = (
        psbtBase64: string
      ): TxReturnType<S, R> =>
        ({
          from: walletAddress,
          to: provider.chainConfig.addresses.assetManager,
          value: amount,
          data: psbtBase64,
        }) satisfies TxReturnType<BitcoinSpokeProviderType, true> as TxReturnType<S, R>;

      // ───────────────── Trading wallet flow ─────────────────
      if (provider.walletMode === "TRADING") {
        const tokenId = Object.values(provider.chainConfig.supportedTokens).find(
          t => t.address === token,
        )?.address;

        if (!tokenId) {
          throw new Error(`Unsupported token: ${token}`);
        }

        data = data.startsWith('0x') ? data.slice(2) : data
        data = data.length === 64 ? data : keccak256(`0x${data}`).slice(2);

        accessToken = accessToken || provider.radfiAccessToken;
        const withdrawTx =
          await provider.radfi.createWithdrawTransaction({
            token: tokenId,
            amount,
            recipient: provider.chainConfig.addresses.assetManager,
            userAddress: walletAddress,
            data: data,
          }, accessToken);

        if (raw || isBitcoinRawSpokeProvider(provider)) {
          return returnRawTx(withdrawTx.base64Psbt);
        }

        const signedTx =
          await provider.walletProvider.signTransaction(
            withdrawTx.base64Psbt,
            false
          );

        const signedBase64Tx = normalizePsbtToBase64(signedTx);

        return (await provider.radfi.requestRadfiSignature({
          userAddress: walletAddress,
          signedBase64Tx,
        }, accessToken)) satisfies TxReturnType<BitcoinSpokeProviderType, false> as TxReturnType<S, R>;

      }

      // ───────────────── Normal deposit flow ─────────────────
      const utxos = await provider.fetchUTXOs(walletAddress);

      if (!utxos?.length) {
        throw new Error('No UTXOs available for deposit');
      }

      const depositPsbt =
        await BitcoinBaseSpokeProvider.buildDepositPsbt(
          walletAddress,
          token,
          amount,
          data,
          utxos,
          provider
        );

      if (raw || isBitcoinRawSpokeProvider(provider)) {
        return returnRawTx(depositPsbt.toBase64());
      }

      return (await provider.signAndBroadcastTransaction(
        depositPsbt
      )) satisfies TxReturnType<BitcoinSpokeProviderType, false> as TxReturnType<S, R>;
    } catch (error) {
      console.error('Error during deposit:', error);
      throw error;
    }
  }

  /**
   * Build deposit PSBT with embedded cross-chain data
   */
  public static async buildDepositPsbt(
    walletAddress: string,
    token: string,
    amount: bigint,
    data: string,
    utxos: BitcoinUTXO[],
    provider: BitcoinSpokeProviderType,
  ): Promise<bitcoin.Psbt> {
    const assetManagerAddress = provider.chainConfig.addresses.assetManager;

    if (token.toLocaleLowerCase() === 'btc') {
      const outputs = [
        {
          address: assetManagerAddress,
          value: Number(amount),
        },
      ];

      const psbt = await BitcoinBaseSpokeProvider.buildBitcoinTransaction(
        utxos,
        outputs,
        walletAddress,
        provider,
      );

      const OP_RADFI_SODAX_DATA = 0x31
      const payload = Buffer.concat([
        Buffer.from([OP_RADFI_SODAX_DATA]),
        Buffer.from(data.slice(2), 'hex'),
      ]);

      const OP_RETURN = bitcoin.opcodes.OP_RETURN;
      const OP_12 = bitcoin.opcodes.OP_12;
      if (OP_RETURN === undefined || OP_12 === undefined) {
        throw new Error('bitcoinjs-lib opcodes OP_RETURN or OP_12 are undefined');
      }

      const script = bitcoin.script.compile([
        OP_RETURN,
        OP_12,
        payload
      ]);

      psbt.addOutput({
        script: script,
        value: 0,
      })

      return psbt;
    }
    throw new Error(`Non-BTC token deposits not yet implemented (token: ${token})`);
  }

  /**
   * Fetch UTXOs for an address
   */
  public async fetchUTXOs(address: string): Promise<BitcoinUTXO[]> {
    const response = await fetch(`${this.rpcUrl}/address/${address}/utxo`);
    if (!response.ok) {
      throw new Error(`Failed to fetch UTXOs: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Fetch raw transaction hex
   */
  public async fetchRawTransaction(txid: string): Promise<string> {
    const response = await fetch(`${this.rpcUrl}/tx/${txid}/hex`);
    if (!response.ok) {
      throw new Error(`Failed to fetch transaction: ${response.statusText}`);
    }
    return await response.text();
  }

  /**
   * Estimate transaction size in vbytes
   */
  public estimateTxSize(inputCount: number, outputCount: number): number {
    // SegWit (P2WPKH) tx size estimate:
    // 10.5 vB fixed overhead
    // +44 vB for one OP_RETURN (~33-byte payload), not included in outputCount
    // 68 vB per input, 31 vB per non-OP_RETURN output
    return Math.ceil(10.5 + 44 + (inputCount * 68) + (outputCount * 31));
  }

  public getAddressType(address: string): AddressType {
    return detectBitcoinAddressType(address);
  }

  public encodePayloadToBytes(payload: Payload): string {
    const ordered = {
      src_address: payload.src_address.toLowerCase(),
      data: payload.data.toLowerCase(),
      src_chain_id: payload.src_chain_id,
      dst_chain_id: payload.dst_chain_id,
      wallet_used: payload.wallet_used,
      timestamp: payload.timestamp,
      address_type: payload.address_type
    }

    const json = JSON.stringify(ordered)
    return json
  }

  public static async encodeWithdrawalData<S extends BitcoinSpokeProviderType, R extends boolean = false>(
    dstChainId: HubChainId,
    data: Hex,
    provider: S,
    raw?: R,
  ): Promise<string> {
    let srcAddress = await provider.walletProvider.getWalletAddress();
    const addressType = provider.getAddressType(srcAddress);
    if (provider.walletMode === "TRADING") {
      srcAddress = await provider.radfi
        .getTradingWallet(srcAddress)
        .then(res => res.tradingAddress)
        .catch(() => srcAddress);
    }
    const payload: Payload = {
      src_address: srcAddress,
      data,
      src_chain_id: Number(getIntentRelayChainId(provider.chainConfig.chain.id)),
      dst_chain_id: Number(getIntentRelayChainId(dstChainId)),
      wallet_used: provider.walletMode,
      timestamp: Date.now(),
      address_type: addressType
    }
    const orderedPayload = provider.encodePayloadToBytes(payload)

    const onDemandWithdraw: OnDemandPayload = {
      payload_hex: Buffer.from(orderedPayload).toString('hex'),
      signature: undefined
    }

    if (raw || isBitcoinRawSpokeProvider(provider)) {
      return JSON.stringify(onDemandWithdraw);
    }

    const signature = await provider.walletProvider.signEcdsaMessage(orderedPayload);

    onDemandWithdraw.signature = signature;
    return JSON.stringify(onDemandWithdraw);
  }

}


/**
 * Raw Bitcoin Spoke Provider - for building unsigned transactions
 */
export class BitcoinRawSpokeProvider extends BitcoinBaseSpokeProvider implements IRawSpokeProvider {
  public readonly walletProvider: WalletAddressProvider;
  public readonly raw = true;

  constructor(
    walletAddress: string,
    publicKey: string,
    chainConfig: BitcoinSpokeChainConfig,
    radfiConfig: RadfiConfig,
    walletMode: WalletMode = "USER",
    rpcUrl?: string,
  ) {
    super(chainConfig, radfiConfig, walletMode, rpcUrl);
    this.walletProvider = {
      getWalletAddress: async () => walletAddress,
      getPublicKey: async () => publicKey,
    };
  }
}


/**
 * Bitcoin Spoke Provider - with signing capabilities
 */
export class BitcoinSpokeProvider extends BitcoinBaseSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: IBitcoinWalletProvider;

  constructor(
    walletProvider: IBitcoinWalletProvider,
    chainConfig: BitcoinSpokeChainConfig,
    radfiConfig: RadfiConfig,
    walletMode: WalletMode = "USER",
    rpcUrl?: string,
  ) {
    super(chainConfig, radfiConfig, walletMode, rpcUrl);
    this.walletProvider = walletProvider;
  }

  /**
   * Get the effective wallet address for hub wallet derivation and relay submission.
   * In TRADING mode, returns the trading wallet address (not the personal wallet).
   * This must be used everywhere a wallet address is needed for hub interaction.
   */
  public async getEffectiveWalletAddress(): Promise<string> {
    const personalAddress = await this.walletProvider.getWalletAddress();
    if (this.walletMode === 'TRADING') {
      const tradingWallet = await this.radfi.getTradingWallet(personalAddress);
      return tradingWallet.tradingAddress;
    }
    return personalAddress;
  }

  /**
   * Authenticate with Radfi: BIP322-sign a login message, then call the Radfi API.
   * Returns accessToken, refreshToken, and tradingAddress.
   */
  public async authenticateWithWallet(cachedPublicKey?: string): Promise<{ accessToken: string; refreshToken: string; tradingAddress: string; publicKey: string }> {
    const address = await this.walletProvider.getWalletAddress();

    let publicKey = cachedPublicKey;
    if (!publicKey) {
      if (!this.walletProvider.getPublicKey) {
        throw new Error('Wallet provider does not support getPublicKey');
      }
      publicKey = await this.walletProvider.getPublicKey();
    }
    if (!publicKey) {
      throw new Error('Failed to retrieve public key from wallet. Please unlock your wallet and try again.');
    }

    const message = `Login to Radfi via Sodax: ${Date.now()}`;
    const signature = await this.walletProvider.signBip322Message(message);

    const result = await this.radfi.authenticate({ message, signature, address, publicKey });
    this.setRadfiAccessToken(result.accessToken, result.refreshToken);
    return { ...result, publicKey };
  }

  /**
   * Ensure a valid Radfi access token is set on this provider.
   * If a token exists, validates it via the Radfi API.
   * If invalid, tries refreshing with the refresh token first.
   * If refresh also fails, falls back to full re-authentication (BIP322 sign).
   */
  public async ensureRadfiAccessToken(): Promise<void> {
    // Try refreshing with refresh token to get a fresh access token
    if (this.radfiRefreshToken) {
      try {
        const { accessToken, refreshToken } = await this.radfi.refreshAccessToken(this.radfiRefreshToken);
        this.setRadfiAccessToken(accessToken, refreshToken);
        console.log('[ensureRadfiAccessToken] token refreshed successfully');
        return;
      } catch (error) {
        console.warn('[ensureRadfiAccessToken] refresh failed, falling back to full re-auth', error);
      }
    }

    // Full re-authentication (requires user wallet signature)
    console.log('[ensureRadfiAccessToken] performing full re-authentication (BIP322 sign)');
    this.radfiAccessToken = '';
    this.radfiRefreshToken = '';
    await this.authenticateWithWallet();
  }

  /**
   * Sign and broadcast a Bitcoin transaction
   */
  public async signAndBroadcastTransaction(
    psbt: bitcoin.Psbt | string
  ): Promise<string> {
    const psbtBase64 = typeof psbt === 'string' ? psbt : psbt.toBase64();
    const signedPsbtHex = await this.walletProvider.signTransaction(psbtBase64);
    const txHash = await this.broadcastTransaction(signedPsbtHex);
    return txHash;
  }

  /**
   * Broadcast a signed transaction
   */
  private async broadcastTransaction(txHex: string): Promise<string> {
    const response = await fetch(`${this.rpcUrl}/tx`, {
      method: 'POST',
      body: txHex,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to broadcast transaction: ${errorText}`);
    }

    return await response.text();
  }
}