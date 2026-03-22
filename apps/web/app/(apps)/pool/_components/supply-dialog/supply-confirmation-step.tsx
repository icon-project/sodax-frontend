import CurrencyLogo from '@/components/shared/currency-logo';
import { usePoolState } from '../../_stores/pool-store-provider';
import type { XToken } from '@sodax/types';
import { formatBalance } from '@/lib/utils';
import { ShieldAlertIcon } from 'lucide-react';
import { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { usePoolData } from '@sodax/dapp-kit';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { dexPools } from '@sodax/sdk';

interface SupplyConfirmationStepProps {
  supplyError: { title: string; message: string } | null;
}
export default function SupplyConfirmationStep({ supplyError }: SupplyConfirmationStepProps) {
  const { selectedToken, minPrice, maxPrice, sodaAmount, xSodaAmount } = usePoolState();
  const fixedPoolKey = dexPools.ASODA_XSODA;
  const sodaToken: XToken = selectedToken ?? {
    name: 'SODA',
    symbol: 'SODA',
    address: '0x0',
    decimals: 18,
    xChainId: 'sonic',
  };
  const xSodaToken: XToken = {
    name: 'xSODA',
    symbol: 'xSODA',
    address: '0x1',
    decimals: 18,
    xChainId: selectedToken?.xChainId ?? 'sonic',
  };
  const { data: sodaPrice } = useTokenPrice(sodaToken);
  const { data: poolDataRaw } = usePoolData({ poolKey: fixedPoolKey });
  const sodaPerXSodaRate = useMemo((): number | null => {
    if (!poolDataRaw) {
      return null;
    }
    const parsedRate = Number(poolDataRaw.price.toSignificant(18));
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      return null;
    }
    return parsedRate;
  }, [poolDataRaw]);
  const xSodaPrice = useMemo((): number => {
    if (!sodaPrice || !sodaPerXSodaRate) {
      return 0;
    }
    // Convert xSODA amount to USD via SODA USD price and current SODA/xSODA pool rate.
    return sodaPrice / sodaPerXSodaRate;
  }, [sodaPerXSodaRate, sodaPrice]);
  const totalUsdText = useMemo((): string => {
    const sodaUsdValue = new BigNumber(sodaAmount || '0').multipliedBy(sodaPrice ?? 0);
    const xSodaUsdValue = new BigNumber(xSodaAmount || '0').multipliedBy(xSodaPrice ?? 0);
    const totalUsdValue = sodaUsdValue.plus(xSodaUsdValue);
    const numericTotal = totalUsdValue.toNumber();

    if (!Number.isFinite(numericTotal) || numericTotal <= 0) {
      return '$0.00 total';
    }

    return `$${numericTotal.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} total`;
  }, [sodaAmount, sodaPrice, xSodaAmount, xSodaPrice]);

  return (
    <div className="flex flex-col items-center mt-4">
      {supplyError ? (
        <div className="flex flex-col text-center">
          <div className="flex justify-center gap-1 w-full items-center">
            <ShieldAlertIcon className="w-4 h-4 text-negative" />
            <span className="font-['InterBold'] text-(length:--body-super-comfortable) leading-[1.4] text-negative">
              {supplyError.title}
            </span>
          </div>
          <div className="text-espresso text-(length:--body-small) font-medium font-['InterRegular'] text-center leading-[1.4]">
            {supplyError.message}
          </div>
        </div>
      ) : (
        <div className="flex flex-col text-center">
          <div className="text-espresso text-(length:--body-super-comfortable) font-['InterBold'] leading-[1.4]">
            Create liquidity position
          </div>
          <div className="text-clay text-(length:--body-small) font-medium font-['InterRegular'] leading-[1.4]">
            Takes ~10 secs
          </div>
        </div>
      )}
      <div className="pb-6 flex justify-between items-center mt-4">
        <div className="self-stretch inline-flex flex-col justify-start items-center gap-2">
          <div className="self-stretch inline-flex justify-center items-center gap-4">
            <div className="flex-1 inline-flex flex-col justify-center items-end">
              <div className="text-right justify-start text-espresso text-xs font-normal font-['InterRegular'] leading-5">
                {formatBalance(sodaAmount, 100)}
              </div>
              <div className="text-right justify-start text-clay text-xs font-normal font-['InterRegular'] leading-4">
                SODA
              </div>
            </div>
            <div className="inline-flex flex-col justify-start items-center gap-2">
              <div className="inline-flex justify-start items-center">
                <CurrencyLogo
                  currency={selectedToken as XToken}
                  className="w-6 h-6 rounded-[256px]"
                  hideNetwork={true}
                />
                <CurrencyLogo currency={xSodaToken} className="w-6 h-6 rounded-[256px] -ml-4" />
              </div>
            </div>
            <div className="flex-1 inline-flex flex-col justify-center items-start">
              <div className="justify-start text-espresso text-xs font-normal font-['InterRegular'] leading-5">
                {formatBalance(xSodaAmount, 100)}
              </div>
              <div className="justify-start text-clay text-xs font-normal font-['InterRegular'] leading-4">xSODA</div>
            </div>
          </div>
          <div className="flex flex-col justify-start items-center gap-2">
            <div className="justify-start text-espresso text-xs font-normal font-['InterRegular'] leading-5">
              Range: {minPrice} – {maxPrice}
            </div>
          </div>
          <div className="h-4 px-2 mix-blend-multiply bg-cream-white rounded-[256px] inline-flex justify-center items-center gap-1">
            <div className="text-center justify-center text-espresso text-[9px] font-medium font-['InterRegular'] uppercase leading-3">
              {totalUsdText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
