import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import type { XToken } from '@sodax/types';
import type { DisplayItem } from './asset-list-item-content';
import AssetMetrics from './asset-metrics';
import { useXAccount } from '@sodax/wallet-sdk-react';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';
import { parseUnits } from 'viem';
import { DepositTokenSelector } from './deposit-token-selector';
import { useSaveState } from '../../_stores/save-store-provider';
import { cn } from '@/lib/utils';

type Props = {
  displayItems: DisplayItem[];
  setSelectedToken: (token: XToken | null) => void;
  onContinue?: () => void;
  apy: string;
  deposits: number;
  isReadyToEarn: boolean;
};

export function DepositTokenSelect({
  displayItems,
  setSelectedToken,
  onContinue,
  apy,
  deposits,
  isReadyToEarn,
}: Props) {
  const { selectedToken } = useSaveState();
  const { address: sourceAddress } = useXAccount(selectedToken?.xChainId);
  const allChainBalances = useAllChainBalances();
  const balance = selectedToken
    ? (allChainBalances[selectedToken.address]?.find(entry => entry.chainId === selectedToken.xChainId)?.balance ?? 0n)
    : 0n;
  const isSimulate = !(sourceAddress && balance > 0n);
  const isTooLow = sourceAddress && balance > 0n && balance < parseUnits('0.001', selectedToken?.decimals ?? 0);
  const { isNetworkPickerOpened } = useSaveState();
  const continueButtonRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <AssetMetrics apy={apy} deposits={deposits} />
      <div className="text-(length:--body-super-comfortable) text-espresso font-['InterRegular']">
        {isReadyToEarn ? 'In your wallet' : 'Simulate yield using $10k of test funds'}
      </div>
      <DepositTokenSelector
        displayItems={displayItems}
        selectedToken={selectedToken}
        onChange={(token: XToken | null) => {
          setSelectedToken(token);
        }}
        excludeRefs={[continueButtonRef as React.RefObject<HTMLElement>]}
      />
      <div
        ref={continueButtonRef}
        className={cn(
          'flex gap-4 items-center mb-8 transition-all duration-300',
          isNetworkPickerOpened ? 'blur-sm' : '',
        )}
      >
        <Button
          variant="cherry"
          className="w-27 mix-blend-multiply shadow-none"
          disabled={!selectedToken || (isTooLow as boolean)}
          onMouseDown={() => {
            onContinue?.();
          }}
        >
          {!selectedToken ? 'Continue' : isSimulate ? 'Simulate' : 'Continue'}
        </Button>
        <span className="text-clay text-(length:--body-small) font-['InterRegular']">
          {!selectedToken
            ? 'Select a source'
            : isSimulate
              ? 'You’ll simulate yield next'
              : isTooLow
                ? 'Balance too low to continue'
                : 'See your yield next'}
        </span>
      </div>
    </>
  );
}
