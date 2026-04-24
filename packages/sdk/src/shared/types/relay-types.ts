import type { HttpUrl, SpokeChainKey } from '@sodax/types';
import type { Hex } from '@sodax/types';

export type RelayExtraData = { address: Hex; payload: Hex };

export type IntentDeliveryInfo = {
  srcChainId: SpokeChainKey;
  srcTxHash: string;
  srcAddress: string;
  dstChainId: SpokeChainKey;
  dstTxHash: string;
  dstAddress: string;
};

export type WaitUntilIntentExecutedPayload = {
  intentRelayChainId: string;
  spokeTxHash: string;
  timeout?: number;
  apiUrl: HttpUrl;
};

export type RelayAction = 'submit' | 'get_transaction_packets' | 'get_packet';

export type IntentRelayRequest<T extends RelayAction> = {
  action: T;
  params: T extends 'submit'
    ? { chain_id: string; tx_hash: string; data?: RelayExtraData }
    : T extends 'get_transaction_packets'
      ? { chain_id: string; tx_hash: string }
      : T extends 'get_packet'
        ? { chain_id: string; tx_hash: string; conn_sn: string }
        : never;
};
