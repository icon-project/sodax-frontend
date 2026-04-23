import {
  Cl,
  noneCV,
  PostConditionMode,
  someCV,
  uintCV,
  type ContractIdString,
  type ClarityValue,
  fetchCallReadOnlyFunction,
  parseContractId,
  type ContractPrincipalCV,
  type UIntCV,
  makeUnsignedContractCall,
  fetchFeeEstimateTransaction,
  validateStacksAddress,
  serializePayloadBytes,
} from '@stacks/transactions';
import { getIntentRelayChainId, isNativeToken, spokeChainConfig, ChainKeys } from '@sodax/types';
import type {
  FeeEstimateTransaction,
  Result,
  StacksChainKey,
  StacksRawTransactionReceipt,
  StacksReturnType,
  StacksTransactionParams,
  TxReturnType,
} from '@sodax/types';
import { sleep } from '../../utils/shared-utils.js';
import type {
  DepositParams,
  EstimateGasParams,
  GetDepositParams,
  SendMessageParams,
  WaitForTxReceiptParams,
  WaitForTxReceiptReturnType,
} from '../../types/spoke-types.js';
import type { ConfigService } from '../../config/ConfigService.js';
import { type StacksNetwork, createNetwork } from '@stacks/network';
import { bytesToHex } from 'viem';

export class StacksSpokeService {
  protected network: StacksNetwork;
  private readonly pollingIntervalMs: number;
  private readonly maxTimeoutMs: number;

  constructor(config: ConfigService) {
    // since we only support mainnet for now, we can hardcode the single stacks chain config
    const chainConfig = config.sodaxConfig.chains[ChainKeys.STACKS_MAINNET];
    this.network = createNetwork({ network: 'mainnet', client: { baseUrl: chainConfig.rpcUrl } });
    this.pollingIntervalMs = chainConfig.pollingConfig.pollingIntervalMs;
    this.maxTimeoutMs = chainConfig.pollingConfig.maxTimeoutMs;
  }

  public async estimateGas(params: EstimateGasParams<StacksChainKey>): Promise<FeeEstimateTransaction> {
    const [low, medium, high] = await fetchFeeEstimateTransaction({
      payload: params.tx.payload,
      estimatedLength: params.tx.estimatedLength,
      network: this.network,
    });

    return { low, medium, high };
  }

  async readContract(sender: string, txParams: StacksTransactionParams): Promise<ClarityValue> {
    return fetchCallReadOnlyFunction({
      contractAddress: txParams.contractAddress,
      contractName: txParams.contractName,
      functionName: txParams.functionName,
      functionArgs: txParams.functionArgs,
      network: this.network,
      senderAddress: sender,
    });
  }

  async getSTXBalance(address: string): Promise<bigint> {
    const url = `${this.network.client.baseUrl}/extended/v1/address/${address}/balances`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching STX balance: ${response.statusText}`);
    }
    const data = await response.json();
    return BigInt(data.stx.balance);
  }

  async readTokenBalance(token: string, address: string): Promise<bigint> {
    const [contractAddress, contractName] = parseContractId(token as ContractIdString);
    const result = (await fetchCallReadOnlyFunction({
      contractAddress: contractAddress as string,
      contractName: contractName as string,
      functionName: 'get-balance',
      functionArgs: [Cl.principal(address)],
      network: this.network,
      senderAddress: address,
    })) as { value: UIntCV };
    return result.value.value as bigint;
  }

  async getImplContractAddress(from: string, stateContract: string): Promise<string> {
    const [contractAddress, contractName] = parseContractId(stateContract as ContractIdString);
    const txParams = {
      contractAddress: contractAddress as string,
      contractName: contractName as string,
      functionName: 'get-asset-manager-impl',
      functionArgs: [],
    };

    return ((await this.readContract(from, txParams)) as ContractPrincipalCV).value;
  }

  /**
   * Deposit tokens to the spoke chain.
   * @param {StacksSpokeDepositParams} params - The parameters for the deposit, including the user's address, token address, amount, and additional data.
   * @param {StacksSpokeProviderType} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public async deposit<R extends boolean = false>(
    params: DepositParams<StacksChainKey, R>,
  ): Promise<TxReturnType<StacksChainKey, R>> {
    const assetManagerImpl = await this.getImplContractAddress(
      params.srcChainKey,
      spokeChainConfig[params.srcChainKey].addresses.assetManager,
    );
    const [implAddress, implName] = parseContractId(assetManagerImpl as ContractIdString);
    const [connectionAddress, connectionName] = parseContractId(
      spokeChainConfig[params.srcChainKey].addresses.connection as ContractIdString,
    );
    const reqData = {
      contractAddress: implAddress as string,
      contractName: implName as string,
      functionName: 'transfer',
      functionArgs: [
        isNativeToken(params.srcChainKey, params.token) ? noneCV() : someCV(Cl.principal(params.token)),
        Cl.bufferFromHex(params.to),
        uintCV(params.amount),
        Cl.bufferFromHex(params.data),
        Cl.contractPrincipal(connectionAddress as string, connectionName as string),
      ],
      postConditionMode: PostConditionMode.Allow,
    };
    if (params.raw === true) {
      if (validateStacksAddress(params.srcAddress)) {
        throw new Error('When using raw transactions, the public key must be provided as "from" parameter');
      }

      const tx = await makeUnsignedContractCall({
        ...reqData,
        publicKey: params.srcAddress,
        network: this.network,
        fee: 0, // placeholder — we'll estimate
        nonce: 0n,
      });

      return {
        payload: `0x${bytesToHex(serializePayloadBytes(tx.payload))}`,
      } satisfies StacksReturnType<true> as StacksReturnType<R>;
    }
    const txId = await params.walletProvider.sendTransaction(reqData);
    return txId as StacksReturnType<R>;
  }

  /**
   * Get the balance of the token deposited in the spoke chain asset manager.
   * @param {GetDepositParams<StacksChainKey>} params - The parameters for the deposit, including the user's address, token address, and chain id.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public async getDeposit(params: GetDepositParams<StacksChainKey>): Promise<bigint> {
    const assetManager = spokeChainConfig[params.srcChainKey].addresses.assetManager;
    if (isNativeToken(params.srcChainKey, params.token)) {
      return this.getSTXBalance(params.srcAddress);
    }
    return this.readTokenBalance(params.token, assetManager);
  }

  /**
   * Sends a message to the hub chain.
   */
  public async sendMessage<Raw extends boolean>(
    params: SendMessageParams<StacksChainKey, Raw>,
  ): Promise<TxReturnType<StacksChainKey, Raw>> {
    const dstChainId = getIntentRelayChainId(params.dstChainKey);
    const [connectionAddress, connectionName] = parseContractId(
      spokeChainConfig[params.srcChainKey].addresses.connection as ContractIdString,
    );
    const reqData: StacksTransactionParams = {
      contractAddress: connectionAddress as string,
      contractName: connectionName as string,
      functionName: 'send-message',
      functionArgs: [uintCV(dstChainId), Cl.bufferFromHex(params.dstAddress), Cl.bufferFromHex(params.payload)],
      postConditionMode: PostConditionMode.Allow,
    };

    if (params.raw === true) {
      const tx = await makeUnsignedContractCall({
        ...reqData,
        publicKey: params.srcAddress,
        network: this.network,
        fee: 0, // placeholder — we'll estimate
        nonce: 0n,
      });

      return {
        payload: `0x${bytesToHex(serializePayloadBytes(tx.payload))}`,
      } satisfies StacksReturnType<true> as StacksReturnType<Raw>;
    }

    const txId = await params.walletProvider.sendTransaction(reqData);

    return txId satisfies StacksReturnType<false> as StacksReturnType<Raw>;
  }

  public async waitForTransactionReceipt(
    params: WaitForTxReceiptParams<StacksChainKey>,
  ): Promise<Result<WaitForTxReceiptReturnType<StacksChainKey>>> {
    const { txHash, pollingIntervalMs = this.pollingIntervalMs, maxTimeoutMs = this.maxTimeoutMs } = params;
    const deadline = Date.now() + maxTimeoutMs;
    const url = `${this.network.client.baseUrl}/extended/v1/tx/${txHash}`;

    while (Date.now() < deadline) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const result = await response.json();
          if (result.tx_status === 'success') {
            return { ok: true, value: { status: 'success', receipt: result satisfies StacksRawTransactionReceipt } };
          }
          if (result.tx_status === 'abort_by_response' || result.tx_status === 'abort_by_post_condition') {
            return {
              ok: true,
              value: { status: 'failure', error: new Error(`Transaction aborted: ${result.tx_status}`) },
            };
          }
        }
      } catch {
        // transient error — retry
      }
      await sleep(pollingIntervalMs);
    }

    return {
      ok: true,
      value: {
        status: 'timeout',
        error: new Error(`Timed out after ${maxTimeoutMs}ms waiting for Stacks transaction ${txHash}`),
      },
    };
  }
}
