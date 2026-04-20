import type { RadfiDepositTxResponse } from '@sodax/types';

export type RadfiConfig = {
  url: string;
  apiKey: string;
  umsUrl?: string;
};

export type RadfiTradingWallet = {
  tradingAddress: string;
  userAddress: string;
  userPublicKey: string;
};

export type RadfiAuthResult = {
  accessToken: string;
  refreshToken: string;
  tradingAddress: string;
};

export type RadfiWalletBalance = {
  btcSatoshi: bigint;
  pendingSatoshi: bigint;
  externalPendingSatoshi: bigint;
  totalUtxos: number;
};

export type RadfiUtxo = {
  _id: string;
  txid: string;
  vout: number;
  txidVout: string;
  satoshi: number;
  amount: string;
  address: string;
  isSpent: boolean;
  status: string;
  source: string;
  runes?: Array<{
    runeid: string;
    amount: string;
    divisibility?: number;
    rune?: string;
    spacedRune?: string;
    symbol?: string;
  }>;
  height?: number;
  confirmations?: number;
  createdAt?: number;
  updatedAt?: number;
};

export type RadfiUtxoListResponse = {
  code: string;
  message: string;
  data: RadfiUtxo[];
};

export type RadfiBuildTxResponse = {
  base64Psbt: string;
  fee: { feeRate: number; totalFee: number };
  txId: string;
};

export type RadfiMaxSpentResponse = {
  maxSatsAmt: number;
  feeRate: number;
  fee: number;
};

export class RadfiProvider {
  constructor(private readonly config: RadfiConfig) {}

  public async authenticate(params: {
    message: string;
    signature: string;
    address: string;
    publicKey: string;
  }): Promise<RadfiAuthResult> {
    const res = await this.request('/auth/authenticate', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Radfi authentication failed');
    }

    return res.json().then(r => ({
      accessToken: r.data?.accessToken ?? '',
      refreshToken: r.data?.refreshToken ?? '',
      tradingAddress: r.data?.tradingAddress ?? r.data?.wallet?.tradingAddress ?? '',
    }));
  }

  public async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await this.request('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Token refresh failed');
    }

    return res.json().then(r => ({
      accessToken: r.data?.accessToken ?? '',
      refreshToken: r.data?.refreshToken ?? refreshToken,
    }));
  }

  public async createTradingWallet(params: {
    walletAddress: string;
    publicKey: string;
  }, accessToken: string): Promise<RadfiTradingWallet> {
    const res = await this.request('/wallets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken || this.config.apiKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create trading wallet');
    }

    return this.parseResponseData<RadfiTradingWallet>(res, 'createTradingWallet');
  }

  public async getTradingWallet(
    userAddress: string,
    accessToken?: string,
  ): Promise<RadfiTradingWallet> {
    const res = await this.request(`/wallets/details/${userAddress}`, {
      method: 'GET',
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    });

    if (!res.ok) {
      throw new Error('Trading wallet not found');
    }

    return this.parseResponseData<RadfiTradingWallet>(res, 'getTradingWallet');
  }

  public async getBalance(address: string): Promise<RadfiWalletBalance> {
    if (!this.config.umsUrl) {
      throw new Error('RadfiConfig.umsUrl is required for getBalance');
    }
    const umsUrl = this.config.umsUrl;
    const res = await fetch(`${umsUrl}/wallets/balance?address=${address}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch wallet balance');
    }

    const json = await res.json();
    const data = json?.data;
    if (!data) {
      throw new Error('Radfi API returned empty data for getBalance');
    }
    return {
      btcSatoshi: BigInt(data.btcSatoshi ?? '0'),
      pendingSatoshi: BigInt(data.pendingSatoshi ?? '0'),
      externalPendingSatoshi: BigInt(data.externalPendingSatoshi ?? '0'),
      totalUtxos: Number(data.totalUtxos ?? 0),
    };
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
        Authorization: `Bearer ${accessToken || this.config.apiKey}`,
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

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Radfi transaction request failed');
    }

    return this.parseResponseData<RadfiDepositTxResponse>(res, 'createWithdrawTransaction');
  }

  public async requestRadfiSignature(params: {
    userAddress: string;
    signedBase64Tx: string;
  }, accessToken: string): Promise<string> {
    const res = await this.request('/sodax/transaction/sign', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken || this.config.apiKey}`,
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


    const data = await this.parseResponseData<{ txId: string }>(res, 'requestRadfiSignature');
    return data.txId;
  }

  /**
   * Fetch expired (or near-expiry) UTXOs for a trading wallet address from UMS API.
   */
  public async getExpiredUtxos(
    tradingAddress: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<RadfiUtxoListResponse> {
    if (!this.config.umsUrl) {
      throw new Error('RadfiConfig.umsUrl is required for getExpiredUtxos');
    }
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 100;
    const url = `${this.config.umsUrl}/utxos?address_eq=${tradingAddress}&isSpent_eq=false&isExpired_eq=true&page=${page}&pageSize=${pageSize}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch expired UTXOs');
    }

    return res.json();
  }

  /**
   * Build a renew-utxo transaction via the Radfi API.
   * Returns a PSBT that needs to be signed by the user.
   */
  public async buildRenewUtxoTransaction(
    params: { userAddress: string; txIdVouts: string[] },
    accessToken: string,
  ): Promise<RadfiBuildTxResponse> {
    const res = await this.request('/transactions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        type: 'renew-utxo',
        params: {
          userAddress: params.userAddress,
          txIdVouts: params.txIdVouts,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to build renew-utxo transaction');
    }

    return this.parseResponseData<RadfiBuildTxResponse>(res, 'buildRenewUtxoTransaction');
  }

  /**
   * Sign and broadcast a renew-utxo transaction via the Radfi API.
   * The user signs the PSBT first, then Radfi co-signs and broadcasts.
   */
  public async signAndBroadcastRenewUtxo(
    params: { userAddress: string; signedBase64Tx: string },
    accessToken: string,
  ): Promise<string> {
    const res = await this.request('/transactions/sign', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        type: 'renew-utxo',
        params,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to sign and broadcast renew-utxo transaction');
    }

    const data = await this.parseResponseData<{ txId: string }>(res, 'signAndBroadcastRenewUtxo');
    return data.txId;
  }

  /**
   * Withdraw BTC from trading wallet to user's personal wallet.
   * Returns an unsigned PSBT for the user to sign.
   */
  public async withdrawToUser(params: {
    userAddress: string;
    amount: string;
    tokenId: string;
    withdrawTo: string;
  }, accessToken: string): Promise<RadfiBuildTxResponse> {
    const res = await this.request('/transactions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        type: 'withdraw',
        params,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to build withdraw transaction');
    }

    return this.parseResponseData<RadfiBuildTxResponse>(res, 'withdrawToUser');
  }

  /**
   * Sign and broadcast a withdraw transaction via Radfi.
   */
  public async signAndBroadcastWithdraw(
    params: { userAddress: string; signedBase64Tx: string },
    accessToken: string,
  ): Promise<string> {
    const res = await this.request('/transactions/sign', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        type: 'withdraw',
        params,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to sign and broadcast withdraw transaction');
    }

    const json = await res.json();
    const txId = json?.data?.txId;
    // API may return nested response: { txId: { data: "actualTxId" } }
    return typeof txId === 'object' && txId?.data ? txId.data : txId;
  }

  /**
   * Get max spendable amount for a withdraw transaction (amount after fee).
   */
  public async getMaxWithdrawable(params: {
    userAddress: string;
    amount: string;
    tokenId: string;
    withdrawTo: string;
  }, accessToken: string): Promise<RadfiMaxSpentResponse> {
    const res = await this.request('/transactions/max-spent', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        type: 'withdraw',
        params,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to get max withdrawable amount');
    }

    return this.parseResponseData<RadfiMaxSpentResponse>(res, 'getMaxWithdrawable');
  }

  private async parseResponseData<T>(res: Response, context: string): Promise<NonNullable<T>> {
    const json = await res.json();
    const data = json?.data;
    if (data == null) {
      throw new Error(`Radfi API returned empty data for ${context}`);
    }
    return data as NonNullable<T>;
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
