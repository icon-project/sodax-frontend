import type { ExecuteResponse, ICWWalletProvider } from './CWSpokeProvider.js';

export interface TokenInfo {
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

export class CW20Token {
  private client: ICWWalletProvider;
  private contractAddress: string;

  constructor(client: ICWWalletProvider, contractAddress: string) {
    this.client = client;
    this.contractAddress = contractAddress;
  }

  // Query Methods
  async getTokenInfo(): Promise<TokenInfo> {
    return await this.client.queryContractSmart(this.contractAddress, {
      token_info: {},
    });
  }

  async getBalance(address: string): Promise<Balance> {
    return await this.client.queryContractSmart(this.contractAddress, {
      balance: { address },
    });
  }

  async getAllowance(owner: string, spender: string): Promise<AllowanceResponse> {
    return await this.client.queryContractSmart(this.contractAddress, {
      allowance: { owner, spender },
    });
  }

  // Execute Methods (requires SigningCosmWasmClient)
  async transfer(
    senderAddress: string,
    recipientAddress: string,
    amount: string,
  ): Promise<ExecuteResponse> {
    const msg = {
      transfer: {
        recipient: recipientAddress,
        amount: amount,
      },
    };

    return await this.client.execute(senderAddress, this.contractAddress, msg, 'auto');
  }

  async increaseAllowance(
    senderAddress: string,
    spenderAddress: string,
    amount: string,
    expires?: { at_height?: number; at_time?: string; never?: {} },
  ): Promise<ExecuteResponse> {
    const msg = {
      increase_allowance: {
        spender: spenderAddress,
        amount: amount,
        expires,
      },
    };

    return await this.client.execute(senderAddress, this.contractAddress, msg, 'auto');
  }

  async decreaseAllowance(
    senderAddress: string,
    spenderAddress: string,
    amount: string,
    expires?: { at_height?: number; at_time?: string; never?: {} },
  ): Promise<ExecuteResponse> {
    const msg = {
      decrease_allowance: {
        spender: spenderAddress,
        amount: amount,
        expires,
      },
    };

    return await this.client.execute(senderAddress, this.contractAddress, msg, 'auto');
  }

  async transferFrom(
    senderAddress: string,
    ownerAddress: string,
    recipientAddress: string,
    amount: string,
  ): Promise<ExecuteResponse> {
    const msg = {
      transfer_from: {
        owner: ownerAddress,
        recipient: recipientAddress,
        amount: amount,
      },
    };

    return await this.client.execute(senderAddress, this.contractAddress, msg, 'auto');
  }
}
