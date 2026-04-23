import * as bitcoin from 'bitcoinjs-lib';
import type {
  BitcoinChainKey,
  BitcoinRawTransactionReceipt,
  GetAddressType,
  Hex,
  HubAddress,
  IBitcoinWalletProvider,
  Result,
  TxReturnType,
} from '@sodax/types';
import { ChainKeys, detectBitcoinAddressType, getIntentRelayChainId, spokeChainConfig } from '@sodax/types';
import * as ecc from '@bitcoinerlab/secp256k1';
import { keccak256 } from 'viem';
import type {
  DepositParams,
  EstimateGasParams,
  GetDepositParams,
  SendMessageParams,
  WaitForTxReceiptParams,
  WaitForTxReceiptReturnType,
} from '../../types/spoke-types.js';
import type { ConfigService } from '../../config/ConfigService.js';
import { sleep } from '../../utils/shared-utils.js';
import { RadfiProvider } from '../../entities/btc/RadfiProvider.js';
import { encodeBtcPayloadToBytes, estimateBitcoinTxSize, normalizePsbtToBase64, type BtcPayload, type WalletMode } from '../../entities/btc/btc-utils.js';
export type { BtcPayload, WalletMode } from '../../entities/btc/btc-utils.js';

bitcoin.initEccLib(ecc);

export type BitcoinSpokeDepositParams = {
  srcChainKey: BitcoinChainKey; // The chain key of the spoke (origin) chain
  srcAddress: GetAddressType<BitcoinChainKey>; // The address of the user on the spoke (origin) chain
  to: HubAddress; // The address of the user on the hub chain (wallet abstraction address)
  token: string; // Token identifier
  amount: bigint; // Amount in satoshis
  data: Hex; // Additional data to send with the deposit
  accessToken?: string; // Access token to use trading wallet
};

export type BitcoinTransferToHubParams = {
  srcChainKey: BitcoinChainKey; // The chain key of the spoke (origin) chain
  srcAddress: GetAddressType<BitcoinChainKey>; // The address of the user on the spoke (origin) chain
  token: string;
  amount: bigint;
  data?: Hex;
  accessToken?: string;
};

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

export interface OnDemandBtcPayload {
  payload_hex: string;
  signature?: string;
}

const BITCOIN_DEFAULT_FEE_RATE = 3;
const DUST_THRESHOLD = 546;

export class BitcoinSpokeService {
  public readonly rpcUrl: string;
  public readonly radfi: RadfiProvider;
  public readonly walletMode: WalletMode;
  private readonly pollingIntervalMs: number;
  private readonly maxTimeoutMs: number;

  constructor(config: ConfigService) {
    // since we only support mainnet for now, we can hardcode the single bitcoin chain config
    const chainConfig = config.sodaxConfig.chains[ChainKeys.BITCOIN_MAINNET];
    this.rpcUrl = chainConfig.rpcUrl;
    this.radfi = new RadfiProvider(chainConfig.radfi);
    this.walletMode = chainConfig.radfi.walletMode ?? 'TRADING';
    this.pollingIntervalMs = chainConfig.pollingConfig.pollingIntervalMs;
    this.maxTimeoutMs = chainConfig.pollingConfig.maxTimeoutMs;
  }

  public static getBtcNetwork(chainId: BitcoinChainKey): bitcoin.networks.Network {
    return spokeChainConfig[chainId].network === 'MAINNET' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
  }

  public async getBalance(tokenAddress: string, walletAddress: string, rpcUrl: string): Promise<bigint> {
    // For native BTC (empty token address or special marker)
    if (!tokenAddress || tokenAddress === '0x' || tokenAddress === 'BTC') {
      const utxos = await this.fetchUTXOs(walletAddress);
      const totalBalance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
      return BigInt(totalBalance);
    }
    throw new Error('Token balance queries not yet implemented for non-BTC assets');
  }

  public async fetchScriptPubKey(utxo: BitcoinUTXO): Promise<string> {
    const txHex = await this.fetchRawTransaction(utxo.txid);
    const tx = bitcoin.Transaction.fromHex(txHex);
    const out = tx.outs[utxo.vout];
    if (!out) {
      throw new Error(`UTXO not found: ${utxo.txid}:${utxo.vout}`);
    }
    return out.script.toString('hex');
  }

  /**
   * Get the effective wallet address for hub wallet derivation and relay submission.
   * In TRADING mode, returns the trading wallet address (not the personal wallet).
   * This must be used everywhere a wallet address is needed for hub interaction.
   */
  public async getEffectiveWalletAddress(personalAddress: string): Promise<string> {
    if (this.walletMode === 'TRADING') {
      const tradingWallet = await this.radfi.getTradingWallet(personalAddress);
      return tradingWallet.tradingAddress;
    }
    return personalAddress;
  }

  /**
   * Get the effective wallet address for hub wallet derivation and relay submission.
   * In TRADING mode, returns the trading wallet address (not the personal wallet).
   * This must be used everywhere a wallet address is needed for hub interaction.
   */
  public async getTradingWalletAddress(personalAddress: string): Promise<string> {
    const tradingWallet = await this.radfi.getTradingWallet(personalAddress);
    return tradingWallet.tradingAddress;
  }

  /**
   * Get current fee rate estimate
   */
  public async getFeeRateEstimate(targetBlocks = 6): Promise<number> {
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

  /**
   * Estimate transaction fee for a Bitcoin transaction
   *
   * @param {Hex} rawTx - The raw transaction parameters
   * @param {string} rpcUrl - The RPC URL
   * @returns {Promise<bigint>} Estimated fee in satoshis
   */
  public async estimateGas(params: EstimateGasParams<BitcoinChainKey>): Promise<bigint> {
    if (typeof params.tx === 'string') {
      throw new Error('[BitcoinSpokeService.estimateGas] string tx not supported');
    }
    const txBytes = Buffer.from(params.tx.data, 'hex');
    const vsize = Math.ceil(txBytes.length);
    const feeRate = await this.getFeeRateEstimate();
    const feeRateBigInt = typeof feeRate === 'bigint' ? feeRate : BigInt(Math.ceil(feeRate));
    return BigInt(vsize) * feeRateBigInt;
  }

  /**
   * Get the balance of deposited tokens in the asset manager
   *
   * @param {string} token - Token identifier ('BTC' for native Bitcoin)
   * @param {BitcoinSpokeProviderType} spokeProvider - The Bitcoin spoke provider
   * @returns {Promise<bigint>} Balance in satoshis
   */
  public async getDeposit(params: GetDepositParams<BitcoinChainKey>): Promise<bigint> {
    const assetManagerAddress = spokeChainConfig[params.srcChainKey].addresses.assetManager;
    const utxos = await this.fetchUTXOs(assetManagerAddress);
    const totalBalance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);

    return BigInt(totalBalance);
  }

  /**
   * Fund the Radfi trading wallet by sending BTC from the user's personal wallet
   *
   * @param {bigint} amount - Amount in satoshis to send
   * @param {BitcoinSpokeProvider} spokeProvider - The Bitcoin spoke provider (must have signing capability)
   * @returns {Promise<string>} Transaction ID of the funding transaction
   */
  public async fundTradingWallet(
    amount: bigint,
    walletAddress: string,
    walletProvider: IBitcoinWalletProvider,
  ): Promise<string> {
    const { tradingAddress } = await this.radfi.getTradingWallet(walletAddress);

    return walletProvider.sendBitcoin(tradingAddress, amount);
  }

  /**
   * Send a message to the hub chain
   *
   * @param {BitcoinChainKey} fromChainId - Source spoke chain ID
   * @param {HubChainKey} dstChainId - Destination chain ID
   * @param {HubAddress} dstAddress - Destination address on hub
   * @param {Hex} payload - Message payload
   * @param {BitcoinSpokeProviderType} spokeProvider - The Bitcoin spoke provider
   * @param {boolean} raw - Whether to return raw PSBT or transaction hash
   * @returns {Promise<TxReturnType<BitcoinSpokeProviderType, R>>} Transaction hash or raw PSBT
   */
  public async sendMessage<Raw extends boolean>(
    params: SendMessageParams<BitcoinChainKey, Raw> & { walletMode?: WalletMode },
  ): Promise<TxReturnType<BitcoinChainKey, Raw>> {
    return (await this.encodeWithdrawalData(params)) satisfies TxReturnType<BitcoinChainKey, Raw>;
  }

  /**
   * Build a priority Bitcoin transaction with proper fee calculation
   */
  public async buildBitcoinTransaction(
    utxos: BitcoinUTXO[],
    outputs: Array<{ address: string; value: number }>,
    changeAddress: string,
    chainId: BitcoinChainKey,
    walletProvider: IBitcoinWalletProvider,
    feeRate?: number,
  ): Promise<bitcoin.Psbt> {
    const psbt = new bitcoin.Psbt({ network: BitcoinSpokeService.getBtcNetwork(chainId) });
    const effectiveFeeRate = feeRate ?? (await this.getFeeRateEstimate());
    const walletAddress = await walletProvider.getWalletAddress();
    const addressType = detectBitcoinAddressType(walletAddress);

    let inputSum = 0;
    const outputSum = outputs.reduce((sum, o) => sum + o.value, 0);

    // ---- Add inputs ----
    for (const utxo of utxos) {
      if (!utxo.status.confirmed) continue;

      const scriptPubKey = await this.fetchScriptPubKey(utxo);
      const isTaproot = scriptPubKey.startsWith('51');
      const isSegwitV0 = scriptPubKey.startsWith('00');
      const isP2SH = scriptPubKey.startsWith('a9');

      if (isTaproot) {
        if (!walletProvider.getPublicKey) {
          throw new Error('Missing public key for P2TR input');
        }
        const tapInternalKey = await walletProvider.getPublicKey();
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: Buffer.from(scriptPubKey, 'hex'),
            value: utxo.value,
          },
          tapInternalKey: Buffer.from(tapInternalKey, 'hex'),
        });
      } else if (isP2SH) {
        // P2SH-P2WPKH (Nested SegWit): needs witnessUtxo + redeemScript
        if (!walletProvider.getPublicKey) {
          throw new Error('Missing public key for P2SH-P2WPKH input');
        }
        const pubKeyHex = await walletProvider.getPublicKey();
        const redeemScript = bitcoin.payments.p2wpkh({
          pubkey: Buffer.from(pubKeyHex, 'hex'),
          network: BitcoinSpokeService.getBtcNetwork(chainId),
        }).output;
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: Buffer.from(scriptPubKey, 'hex'),
            value: utxo.value,
          },
          redeemScript,
        });
      } else if (isSegwitV0) {
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
        const txHex = await this.fetchRawTransaction(utxo.txid);
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          nonWitnessUtxo: Buffer.from(txHex, 'hex'),
        });
      }

      inputSum += utxo.value;

      // Conservative estimate WITHOUT assuming change yet
      const estimatedSize = estimateBitcoinTxSize(psbt.inputCount, outputs.length, addressType);
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
    const sizeWithChange = estimateBitcoinTxSize(psbt.inputCount, outputs.length + 1, addressType);
    const sizeWithoutChange = estimateBitcoinTxSize(psbt.inputCount, outputs.length, addressType);

    const feeWithChange = Math.ceil(effectiveFeeRate * sizeWithChange);
    const feeWithoutChange = Math.ceil(effectiveFeeRate * sizeWithoutChange);

    let change = inputSum - outputSum - feeWithChange;

    if (change < 0) {
      const confirmedCount = utxos.filter(u => u.status.confirmed).length;
      const unconfirmedCount = utxos.length - confirmedCount;
      const hint =
        unconfirmedCount > 0 ? ` (${unconfirmedCount} unconfirmed UTXO(s) skipped — wait for confirmation)` : '';
      throw new Error(`Insufficient funds. Need ${outputSum + feeWithChange} satoshis, have ${inputSum}${hint}`);
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
        throw new Error(`Insufficient funds after dust handling. Need ${outputSum + finalFee}`);
      }
    }

    return psbt;
  }

  /**
   * Deposit operation - transfer BTC to the asset manager
   */
  public async deposit<Raw extends boolean = false>(
    params: DepositParams<BitcoinChainKey, Raw> & { accessToken?: string },
  ): Promise<TxReturnType<BitcoinChainKey, Raw>> {
    try {
      const {
        srcChainKey: fromChainId,
        srcAddress: from,
        token,
        amount,
        data = '0x',
        accessToken = this.radfi.accessToken,
      } = params;
      const chainConfig = spokeChainConfig[fromChainId];

      const returnRawTx = (psbtBase64: string): TxReturnType<BitcoinChainKey, Raw> =>
        ({
          from: from,
          to: chainConfig.addresses.assetManager,
          value: amount,
          data: psbtBase64,
        }) satisfies TxReturnType<BitcoinChainKey, true> as TxReturnType<BitcoinChainKey, Raw>;

      // ───────────────── Trading wallet flow ─────────────────
      if (this.walletMode === 'TRADING') {
        const tokenId = Object.values(chainConfig.supportedTokens).find(t => t.address === token)?.address;

        if (!tokenId) {
          throw new Error(`Unsupported token: ${token}`);
        }

        let hashedData = data.startsWith('0x') ? data.slice(2) : data;
        hashedData = hashedData.length === 64 ? hashedData : keccak256(`0x${hashedData}`).slice(2);

        const withdrawTx = await this.radfi.createWithdrawTransaction(
          {
            token: tokenId,
            amount,
            recipient: spokeChainConfig[fromChainId].addresses.assetManager,
            userAddress: from,
            data: hashedData,
          },
          accessToken,
        );

        if (params.raw === true) {
          return returnRawTx(withdrawTx.base64Psbt);
        }

        const signedTx = await params.walletProvider.signTransaction(withdrawTx.base64Psbt, false);
        const signedBase64Tx = normalizePsbtToBase64(signedTx);

        return (await this.radfi.requestRadfiSignature(
          {
            userAddress: from,
            signedBase64Tx,
          },
          accessToken,
        )) satisfies TxReturnType<BitcoinChainKey, false> as TxReturnType<BitcoinChainKey, Raw>;
      }

      // ───────────────── Normal deposit flow ─────────────────
      // Bitcoin PSBT construction requires walletProvider even for raw mode (address derivation)
      if (params.raw === true) {
        throw new Error(
          'Raw mode is not supported for normal Bitcoin deposits. Use TRADING wallet mode for raw transactions.',
        );
      }

      const utxos = await this.fetchUTXOs(from);

      if (!utxos?.length) {
        throw new Error('No UTXOs available for deposit');
      }

      const depositPsbt = await this.buildDepositPsbt(
        from,
        params.walletProvider,
        fromChainId,
        token,
        amount,
        data,
        utxos,
      );

      return (await this.signAndBroadcastTransaction(depositPsbt, params.walletProvider)) satisfies TxReturnType<
        BitcoinChainKey,
        false
      > as TxReturnType<BitcoinChainKey, Raw>;
    } catch (error) {
      console.error('Error during deposit:', error);
      throw error;
    }
  }

  /**
   * Build deposit PSBT with embedded cross-chain data
   */
  public async buildDepositPsbt(
    walletAddress: string,
    walletProvider: IBitcoinWalletProvider,
    fromChainId: BitcoinChainKey,
    token: string,
    amount: bigint,
    data: string,
    utxos: BitcoinUTXO[],
  ): Promise<bitcoin.Psbt> {
    const assetManagerAddress = spokeChainConfig[fromChainId].addresses.assetManager;

    if (token.toLocaleLowerCase() === 'btc') {
      const outputs = [
        {
          address: assetManagerAddress,
          value: Number(amount),
        },
      ];

      const psbt = await this.buildBitcoinTransaction(utxos, outputs, walletAddress, fromChainId, walletProvider);

      const OP_RADFI_SODAX_DATA = 0x31;
      const payload = Buffer.concat([Buffer.from([OP_RADFI_SODAX_DATA]), Buffer.from(data.slice(2), 'hex')]);

      const OP_RETURN = bitcoin.opcodes.OP_RETURN;
      const OP_12 = bitcoin.opcodes.OP_12;
      if (OP_RETURN === undefined || OP_12 === undefined) {
        throw new Error('bitcoinjs-lib opcodes OP_RETURN or OP_12 are undefined');
      }

      const script = bitcoin.script.compile([OP_RETURN, OP_12, payload]);

      psbt.addOutput({
        script: script,
        value: 0,
      });

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

  public async encodeWithdrawalData<Raw extends boolean>(
    params: SendMessageParams<BitcoinChainKey, Raw> & { walletMode?: WalletMode },
  ): Promise<TxReturnType<BitcoinChainKey, Raw>> {
    const {
      srcAddress: from,
      srcChainKey: fromChainId,
      dstChainKey: dstChainId,
      payload: data,
      walletMode = 'TRADING',
    } = params;
    let srcAddress = from;
    const addressType = detectBitcoinAddressType(from);

    if (walletMode === 'TRADING') {
      srcAddress = await this.radfi
        .getTradingWallet(srcAddress)
        .then(res => res.tradingAddress)
        .catch(() => srcAddress);
    }
    const payload: BtcPayload = {
      src_address: srcAddress,
      data: data,
      src_chain_id: Number(getIntentRelayChainId(fromChainId)),
      dst_chain_id: Number(getIntentRelayChainId(dstChainId)),
      wallet_used: this.walletMode,
      timestamp: Date.now(),
      address_type: addressType,
    };
    const orderedPayload = encodeBtcPayloadToBytes(payload);

    const onDemandWithdraw: OnDemandBtcPayload = {
      payload_hex: Buffer.from(orderedPayload).toString('hex'),
      signature: undefined,
    };

    if (params.raw === true) {
      return JSON.stringify(onDemandWithdraw) satisfies TxReturnType<BitcoinChainKey, true> as TxReturnType<
        BitcoinChainKey,
        Raw
      >;
    }

    const signature = await params.walletProvider.signEcdsaMessage(orderedPayload);

    onDemandWithdraw.signature = signature;

    return JSON.stringify(onDemandWithdraw) satisfies TxReturnType<BitcoinChainKey, false> as TxReturnType<
      BitcoinChainKey,
      Raw
    >;
  }

  /**
   * Sign and broadcast a Bitcoin transaction
   */
  public async signAndBroadcastTransaction(
    psbt: bitcoin.Psbt | string,
    walletProvider: IBitcoinWalletProvider,
  ): Promise<string> {
    const psbtBase64 = typeof psbt === 'string' ? psbt : psbt.toBase64();
    const signedPsbtHex = await walletProvider.signTransaction(psbtBase64);
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

  public async waitForTransactionReceipt(
    params: WaitForTxReceiptParams<BitcoinChainKey>,
  ): Promise<Result<WaitForTxReceiptReturnType<BitcoinChainKey>>> {
    const { txHash, pollingIntervalMs = this.pollingIntervalMs, maxTimeoutMs = this.maxTimeoutMs } = params;
    const deadline = Date.now() + maxTimeoutMs;

    while (Date.now() < deadline) {
      try {
        const response = await fetch(`${this.rpcUrl}/tx/${txHash}`);
        if (response.ok) {
          const result = await response.json();
          if (result.status?.confirmed) {
            return { ok: true, value: { status: 'success', receipt: result satisfies BitcoinRawTransactionReceipt } };
          }
          // Transaction exists but not yet confirmed — keep polling
        }
        // 404 or other status — not yet seen, keep polling
      } catch {
        // transient error — retry
      }
      await sleep(pollingIntervalMs);
    }

    return {
      ok: true,
      value: {
        status: 'timeout',
        error: new Error(`Timed out after ${maxTimeoutMs}ms waiting for Bitcoin transaction ${txHash}`),
      },
    };
  }
}
