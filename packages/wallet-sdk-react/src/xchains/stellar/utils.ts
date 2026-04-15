import {
  Address,
  Contract,
  type Memo,
  type MemoType,
  type Operation,
  type SorobanRpc,
  TimeoutInfinite,
  type Transaction,
  type TransactionBuilder,
  scValToBigInt,
  xdr,
} from '@stellar/stellar-sdk';
import type CustomSorobanServer from './CustomSorobanServer';

export const STELLAR_RLP_MSG_TYPE = { type: 'symbol' };

// Can be used whenever you need an Address argument for a contract method
export const accountToScVal = (account: string) => new Address(account).toScVal();

// CustomSorobanServer does a raw fetch and returns unparsed JSON, so the actual
// runtime shape is RawSimulateTransactionResponse (has .results[]), not the parsed
// SimulateTransactionResponse (has .result). The old `Promise<any>` hid this mismatch.
export const simulateTx = async (
  tx: Transaction<Memo<MemoType>, Operation[]>,
  server: CustomSorobanServer,
): Promise<SorobanRpc.Api.RawSimulateTransactionResponse> => {
  // Cast needed: CustomSorobanServer.simulateTransaction() declares SimulateTransactionResponse
  // but actually returns raw JSON (RawSimulateTransactionResponse). The mismatch is in the server
  // class — this cast corrects it at the boundary.
  const response = await server.simulateTransaction(tx) as unknown as SorobanRpc.Api.RawSimulateTransactionResponse;

  if (response !== undefined) {
    return response;
  }

  throw new Error('cannot simulate transaction');
};

export const getTokenBalance = async (
  address: string,
  tokenId: string,
  txBuilder: TransactionBuilder,
  server: CustomSorobanServer,
) => {
  const params = [accountToScVal(address)];
  const contract = new Contract(tokenId);
  const tx = txBuilder
    .addOperation(contract.call('balance', ...params))
    .setTimeout(TimeoutInfinite)
    .build();

  const result = await simulateTx(tx, server);

  return result.results ? scValToBigInt(xdr.ScVal.fromXDR(result.results[0].xdr, 'base64')) : 0n;
};
