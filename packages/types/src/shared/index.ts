/**
 * Shared types
 */

export type ByteArray = Uint8Array;
export type Hex = `0x${string}`;
export type Hash = `0x${string}`;
export type EvmAddress = `0x${string}`;
export type HubAddress = EvmAddress;
export type HttpUrl = `http://${string}` | `https://${string}`;

export type Result<T, E = unknown> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Fee type for transaction fees.
 * @property address - The address to which the fee is sent.
 * @property amount - Optional fixed fee amount in wei.
 */
export type PartnerFeeAmount = {
  address: EvmAddress;
  amount: bigint;
};

/**
 * Fee type for transaction fees.
 * @property address - The address to which the fee is sent.
 * @property percentage - Optional fee percentage in basis points (e.g., 100 = 1%). Maximum allowed is 100 (1%).
 */
export type PartnerFeePercentage = {
  address: EvmAddress;
  percentage: number;
};

/**
 * Fee type for transaction fees.
 * @property address - The address to which the fee is sent.
 * @property percentage - Optional fee percentage in basis points (e.g., 100 = 1%). Maximum allowed is 100 (1%).
 * @property amount - Optional fixed fee amount in wei. If both percentage and amount are provided, amount will be used.
 */
export type PartnerFee = PartnerFeeAmount | PartnerFeePercentage;

export type PartnerFeeConfig = {
  partnerFee: PartnerFee | undefined;
};

export type FeeAmount = {
  feeAmount: bigint;
};

export type RelayerApiConfig = {
  relayerApiEndpoint: HttpUrl;
};
