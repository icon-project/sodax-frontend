import type { StacksNetwork } from '@stacks/network';
import { Cl, serializeCV } from '@stacks/transactions';
import type { Hex } from 'viem';

export async function waitForStacksTransaction(txid: string, network: StacksNetwork): Promise<Boolean> {
  const url = `${network.client.baseUrl}/extended/v1/tx/${txid}`;

  for (let i = 1; i <= 5; i++) {
    const result = await (await fetch(url)).json();
    console.log('Waiting for transaction to be processed trying again', i);
    if (result.tx_status === 'success') {
      return true;
    }
    if (result.tx_status === 'abort_by_response') {
      console.log('Transaction aborted by response');
      return false;
    }

    if (result.tx_status === 'abort_by_post_condition') {
      console.log('Transaction aborted by post condition');
      return false;
    }

    await sleep(2 * i);
  }
  return false;
}

export function serializeAddressData(address: string): Hex {
  return (`0x${serializeCV(Cl.principal(address))}`) as Hex;
}

async function sleep(s: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 1000 * s);
  });
}
