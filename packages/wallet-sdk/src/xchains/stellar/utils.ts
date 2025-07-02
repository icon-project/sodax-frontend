import {
  Address,
  Contract,
  type Memo,
  type MemoType,
  type Operation,
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

export const simulateTx = async (
  tx: Transaction<Memo<MemoType>, Operation[]>,
  server: CustomSorobanServer,
): Promise<any> => {
  const response = await server.simulateTransaction(tx);

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
