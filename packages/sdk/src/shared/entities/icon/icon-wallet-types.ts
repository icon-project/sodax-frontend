import type { IconAddress } from '@sodax/types';

export type ResponseAddressType = {
  type: 'RESPONSE_ADDRESS';
  payload: IconAddress;
};

export type ResponseSigningType = {
  type: 'RESPONSE_SIGNING';
  payload: string;
};

export type JsonRpcPayloadResponse = {
  id: number;
  result: string;
};
