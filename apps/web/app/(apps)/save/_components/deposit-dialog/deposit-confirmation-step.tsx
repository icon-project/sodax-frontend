import type React from 'react';
import type { XToken } from '@sodax/types';
import { TokenAsset } from '@/components/shared/token-asset';
import { useSaveState } from '../../_stores/save-store-provider';

interface DepositConfirmationStepProps {
  selectedToken: XToken;
  apy: string;
}

export default function DepositConfirmationStep({
  selectedToken,
  apy,
}: DepositConfirmationStepProps): React.JSX.Element {
  const { depositValue } = useSaveState();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col text-center">
        <div className="text-espresso text-(length:--body-super-comfortable) font-bold font-['InterRegular'] leading-[1.4]">
          Earn {apy} APY
        </div>
        <div className="self-stretch text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] leading-[1.4]">
          Takes ~10 seconds
        </div>
      </div>

      <div className="flex justify-center">
        <TokenAsset
          name={selectedToken.symbol || ''}
          token={selectedToken}
          isHoldToken
          formattedBalance={depositValue.toString()}
          isGroup={false}
          isClickBlurred={false}
          isHoverDimmed={false}
          isHovered={false}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
          onClick={() => {}}
        />
      </div>
    </div>
  );
}
