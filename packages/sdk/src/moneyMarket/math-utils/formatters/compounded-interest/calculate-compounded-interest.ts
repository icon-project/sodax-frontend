import type BigNumber from 'bignumber.js';
import { valueToZDBigNumber } from '../../bignumber.js';
import { SECONDS_PER_YEAR } from '../../constants.js';
import { RAY, rayPow } from '../../ray.math.js';
import type { CalculateCompoundedRateRequest } from './types.js';

export function calculateCompoundedRate({ rate, duration }: CalculateCompoundedRateRequest): BigNumber {
  return rayPow(valueToZDBigNumber(rate).dividedBy(SECONDS_PER_YEAR).plus(RAY), duration).minus(RAY);
}
