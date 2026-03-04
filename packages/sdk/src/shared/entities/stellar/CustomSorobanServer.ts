import {
  type rpc as StellarRpc,
  type FeeBumpTransaction,
  type Memo,
  type MemoType,
  type Operation,
  SorobanRpc,
  type Transaction,
} from '@stellar/stellar-sdk';

export class CustomSorobanServer extends SorobanRpc.Server {
  private customHeaders: Record<string, string>;

  constructor(serverUrl: string, customHeaders: Record<string, string>) {
    super(serverUrl, {
      allowHttp: true,
    });
    this.customHeaders = customHeaders;
  }

  override async getNetwork(): Promise<StellarRpc.Api.GetNetworkResponse> {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.customHeaders,
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'getNetwork',
      }),
    };

    const response = await fetch(`${this.serverURL}`, requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP error getting network! status: ${response.status}`);
    }

    return response.json().then(json => json.result);
  }

  override async simulateTransaction(
    tx: Transaction<Memo<MemoType>, Operation[]>,
  ): Promise<SorobanRpc.Api.SimulateTransactionResponse> {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.customHeaders,
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'simulateTransaction',
        params: {
          transaction: tx.toXDR(),
        },
      }),
    };

    const response = await fetch(`${this.serverURL}`, requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP error simulating TX! status: ${response.status}`);
    }

    return response.json().then(json => json.result);
  }

  override async sendTransaction(
    tx: Transaction | FeeBumpTransaction,
  ): Promise<SorobanRpc.Api.SendTransactionResponse> {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.customHeaders,
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'sendTransaction',
        params: {
          transaction: tx.toXDR(),
        },
      }),
    };

    const response = await fetch(`${this.serverURL}`, requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP error submitting TX! status: ${response.status}`);
    }
    return response.json().then(json => json.result);
  }

  override async getTransaction(hash: string): Promise<SorobanRpc.Api.GetTransactionResponse> {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.customHeaders,
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'getTransaction',
        params: { hash },
      }),
    };

    const response = await fetch(`${this.serverURL}`, requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP error getting TX! status: ${response.status}`);
    }
    return response.json().then(json => json.result);
  }
}
