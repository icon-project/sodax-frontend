import type BigNumber from 'bignumber.js';
import type { BigNumberValue } from '../../bignumber.js';

export function normalizedToUsd(
  value: BigNumber,
  marketReferencePriceInUsd: BigNumberValue,
  marketReferenceCurrencyDecimals: number,
): BigNumber {
  return value.multipliedBy(marketReferencePriceInUsd).shiftedBy(marketReferenceCurrencyDecimals * -1);
}
