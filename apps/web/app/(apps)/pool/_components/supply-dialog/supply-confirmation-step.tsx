import CurrencyLogo from '@/components/shared/currency-logo';
import { usePoolState } from '../../_stores/pool-store-provider';
import type { XToken } from '@sodax/types';
import { formatBalance } from '@/lib/utils';

export default function SupplyConfirmationStep() {
  const { selectedToken, minPrice, maxPrice, sodaAmount, xSodaAmount } = usePoolState();
  const xSodaToken: XToken = {
    name: 'xSODA',
    symbol: 'xSODA',
    address: '0x1',
    decimals: 18,
    xChainId: selectedToken?.xChainId ?? 'sonic',
  };

  return (
    <div className="flex flex-col items-center mt-4">
      <div className="flex flex-col text-center">
        <div className="text-espresso text-(length:--body-super-comfortable) font-['InterBold'] leading-[1.4]">
          Create liquidity position
        </div>
        <div className="text-clay text-(length:--body-small) font-medium font-['InterRegular'] leading-[1.4]">
          Takes ~10 secs
        </div>
      </div>
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
              $1,021.68 total{' '}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
