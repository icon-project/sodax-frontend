import type { WalletAddressProvider, Address, Hex } from "../common/index.js";

export type SuiTransaction = {
  toJSON: () => Promise<string>;
};

export type SuiArgument =
  | 'GasCoin'
  | {
    Input: number;
  }
  | {
    Result: number;
  };

export interface SuiExecutionResult {
  mutableReferenceOutputs?: [SuiArgument, number[], string][];
  returnValues?: [number[], string][];
}

export interface SuiCoinStruct {
  balance: string;
  coinObjectId: string;
  coinType: string;
  digest: string;
  previousTransaction: string;
  version: string;
}
export interface SuiPaginatedCoins {
  data: SuiCoinStruct[];
  hasNextPage: boolean;
  nextCursor?: string | null;
}



export interface ISuiWalletProvider extends WalletAddressProvider {
  getWalletAddress: () => Promise<Address>;
  getWalletAddressBytes: () => Promise<Hex>;
  signAndExecuteTxn: (txn: SuiTransaction) => Promise<Hex>;
  viewContract(
    tx: SuiTransaction,
    packageId: string,
    module: string,
    functionName: string,
    args: unknown[],
    typeArgs: string[],
  ): Promise<SuiExecutionResult>;
  getCoins: (address: string, token: string) => Promise<SuiPaginatedCoins>;
}