import type React from 'react';
import type { XToken } from '@sodax/types';
import { useSaveState } from '../../_stores/save-store-provider';
import CurrencyLogo from '@/components/shared/currency-logo';
import { formatBalance } from '@/lib/utils';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import BigNumber from 'bignumber.js';
import { ETHEREUM_MAINNET_CHAIN_ID } from '@sodax/types';
import { TimerIcon } from 'lucide-react';

interface DepositConfirmationStepProps {
  selectedToken: XToken;
  apy: string;
}

export default function DepositConfirmationStep({
  selectedToken,
  apy,
}: DepositConfirmationStepProps): React.JSX.Element {
  const { depositValue } = useSaveState();
  const { data: usdPrice } = useTokenPrice(selectedToken);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col text-center">
        <div className="text-espresso text-(length:--body-super-comfortable) font-bold font-['InterRegular'] leading-[1.4]">
          Earn {apy} APY
        </div>
        <div className="self-stretch text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] leading-[1.4] justify-center">
          {selectedToken.xChainId === ETHEREUM_MAINNET_CHAIN_ID ? (
            <span className="flex items-center gap-1 text-cherry-bright w-full justify-center">
              <TimerIcon className="w-4 h-4 text-cherry-bright" />
              Takes longer (~1m)
            </span>
          ) : (
            'Takes ~20 seconds'
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center">
        <CurrencyLogo currency={selectedToken} />
        <div className="mt-2">
          <div className="text-(length:--body-super-comfortable) font-['InterRegular'] leading-[1.4] gap-1 flex">
            <span className="text-espresso">{depositValue}</span>
            <span className="text-clay-light">{selectedToken.symbol}</span>
          </div>
          <div className="text-clay-light font-['InterRegular'] text-(length:--body-small) leading-[1.4] text-center">
            ${formatBalance(new BigNumber(depositValue).multipliedBy(usdPrice ?? 0).toString(), usdPrice ?? 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
