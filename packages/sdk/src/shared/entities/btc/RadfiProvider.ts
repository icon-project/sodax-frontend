import type { RadfiDepositTxResponse } from '@sodax/types';

export type RadfiConfig = {
  url: string;
  apiKey: string;
};

export type RadfiTradingWallet = {
  tradingAddress: string;
  userAddress: string;
  userPublicKey: string;
};

export class RadfiProvider {
  constructor(private readonly config: RadfiConfig) {}

  public async authenticate(params: {
    message: string;
    signature: string;
    address: string;
    publicKey: string;
  }): Promise<string> {
    const res = await this.request('/auth/authenticate', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Radfi authentication failed');
    }

    return res.json().then(r => r.data);
  }

  public async createTradingWallet(params: {
    walletAddress: string;
    publicKey: string;
  }): Promise<RadfiTradingWallet> {
    const res = await this.request('/wallets', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create trading wallet');
    }

    return res.json().then(r => r.data);
  }

  public async getTradingWallet(
    userAddress: string,
  ): Promise<RadfiTradingWallet> {
    const res = await this.request(`/wallets/details/${userAddress}`, {
      method: 'GET',
    });

    if (!res.ok) {
      throw new Error('Trading wallet not found');
    }

    return res.json().then(r => r.data);
  }

  public async checkIfTradingWalletExists(userAddress: string): Promise<boolean> {
    try {
      await this.getTradingWallet(userAddress);
      return true;
    } catch (error) {
      return false;
    }
  }

  public async createWithdrawTransaction(params: {
    token: string;
    amount: bigint;
    recipient: string;
    userAddress: string;
    data: string;
  }, accessToken: string): Promise<RadfiDepositTxResponse> {
    const res = await this.request('/sodax/transaction', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        type: 'sodax-withdraw',
        params: {
          amount: params.amount.toString(),
          tokenId: params.token,
          sodaxData: params.data
        },
      }),
    });

    console.log(res);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Radfi transaction request failed');
    }

    return res.json().then(r => r.data);
  }

  public async requestRadfiSignature(params: {
    userAddress: string;
    signedBase64Tx: string;
  }, accessToken: string): Promise<string> {
    const res = await this.request('/sodax/transaction/sign', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        type: 'sodax-withdraw',
        params,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Radfi signature request failed');
    }


    return res.json().then(r => r.data.txId);
  }

  private async request(
    endpoint: string,
    options?: RequestInit,
  ): Promise<Response> {
    return fetch(`${this.config.url}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
  }
}
