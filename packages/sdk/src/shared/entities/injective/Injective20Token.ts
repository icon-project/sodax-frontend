import type { IInjectiveWalletProvider, InjectiveExecuteResponse } from '@sodax/types';
import { ChainGrpcWasmApi, toBase64 } from '@injectivelabs/sdk-ts';
import { getNetworkEndpoints, Network } from '@injectivelabs/networks';

export interface InjTokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  total_supply: string;
}

export interface Balance {
  balance: string;
}

export interface AllowanceResponse {
  allowance: string;
  expires: {
    never?: {};
    at_height?: number;
    at_time?: string;
  };
}

export class Injective20Token {
  private walletProvider: IInjectiveWalletProvider;
  private chainGrpcWasmApi: ChainGrpcWasmApi;
  private contractAddress: string;

  constructor(walletProvider: IInjectiveWalletProvider, contractAddress: string) {
    this.walletProvider = walletProvider;
    this.contractAddress = contractAddress;
    const endpoints = getNetworkEndpoints(Network.Mainnet);
    this.chainGrpcWasmApi = new ChainGrpcWasmApi(endpoints.grpc);
  }

  async getTokenInfo(): Promise<InjTokenInfo> {
    return this.chainGrpcWasmApi.fetchSmartContractState(
      this.contractAddress,
      toBase64({
        token_info: {},
      }),
    ) as unknown as Promise<InjTokenInfo>;
  }

  async getBalance(address: string): Promise<Balance> {
    return this.chainGrpcWasmApi.fetchSmartContractState(
      this.contractAddress,
      toBase64({
        balance: { address },
      }),
    ) as unknown as Promise<Balance>;
  }

  async getAllowance(owner: string, spender: string): Promise<AllowanceResponse> {
    return this.chainGrpcWasmApi.fetchSmartContractState(
      this.contractAddress,
      toBase64({
        allowance: { owner, spender },
      }),
    ) as unknown as Promise<AllowanceResponse>;
  }

  // Execute Methods (requires SigningCosmWasmClient)
  async transfer(senderAddress: string, recipientAddress: string, amount: string): Promise<InjectiveExecuteResponse> {
    const msg = {
      transfer: {
        recipient: recipientAddress,
        amount: amount,
      },
    };

    return await this.walletProvider.execute(senderAddress, this.contractAddress, msg);
  }

  async increaseAllowance(
    senderAddress: string,
    spenderAddress: string,
    amount: string,
    expires?: { at_height?: number; at_time?: string; never?: {} },
  ): Promise<InjectiveExecuteResponse> {
    const msg = {
      increase_allowance: {
        spender: spenderAddress,
        amount: amount,
        expires,
      },
    };

    return await this.walletProvider.execute(senderAddress, this.contractAddress, msg);
  }

  async decreaseAllowance(
    senderAddress: string,
    spenderAddress: string,
    amount: string,
    expires?: { at_height?: number; at_time?: string; never?: {} },
  ): Promise<InjectiveExecuteResponse> {
    const msg = {
      decrease_allowance: {
        spender: spenderAddress,
        amount: amount,
        expires,
      },
    };

    return await this.walletProvider.execute(senderAddress, this.contractAddress, msg);
  }

  async transferFrom(
    senderAddress: string,
    ownerAddress: string,
    recipientAddress: string,
    amount: string,
  ): Promise<InjectiveExecuteResponse> {
    const msg = {
      transfer_from: {
        owner: ownerAddress,
        recipient: recipientAddress,
        amount: amount,
      },
    };

    return await this.walletProvider.execute(senderAddress, this.contractAddress, msg);
  }
}
