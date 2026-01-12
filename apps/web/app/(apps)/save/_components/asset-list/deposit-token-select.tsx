import { Button } from '@/components/ui/button';
import type { XToken } from '@sodax/types';
import type { DisplayItem } from './asset-list-item-content';
import AssetMetrics from './asset-metrics';
import { useXAccount } from '@sodax/wallet-sdk-react';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';
import { parseUnits } from 'viem';
import { DepositTokenSelectList } from './deposit-token-select-list';
import { useSaveState } from '../../_stores/save-store-provider';
import { cn } from '@/lib/utils';

type Props = {
  displayItems: DisplayItem[];
  selectedToken: XToken | null;
  setSelectedToken: (token: XToken | null) => void;
  onContinue?: () => void;
  apy: string;
  deposits: string;
};

export function DepositTokenSelect({
  displayItems,
  selectedToken,
  setSelectedToken,
  onContinue,
  apy,
  deposits,
}: Props) {
  const { address: sourceAddress } = useXAccount(selectedToken?.xChainId);
  const allChainBalances = useAllChainBalances();
  const balance = selectedToken
    ? (allChainBalances[selectedToken.address]?.find(entry => entry.chainId === selectedToken.xChainId)?.balance ?? 0n)
    : 0n;
  const isSimulate = !(sourceAddress && balance > 0n);
  const isTooLow = balance < parseUnits('0.001', selectedToken?.decimals ?? 0);
  const { isNetworkPickerOpened } = useSaveState();
  return (
    <>
      <AssetMetrics apy={apy} deposits={deposits} />
      <DepositTokenSelectList
        displayItems={displayItems}
        onSelectionChange={(token: XToken | null) => {
          setSelectedToken(token);
        }}
      />
      <div
        className={cn(
          'flex gap-4 items-center mb-8 transition-all duration-300',
          isNetworkPickerOpened ? 'blur-sm' : '',
        )}
      >
        <div className="flex gap-4 items-center mb-8 transition-all duration-300">
          <Button
            variant="cherry"
            className="w-27 mix-blend-multiply shadow-none"
            disabled={!selectedToken}
            onMouseDown={() => {
              onContinue?.();
            }}
          >
            {!selectedToken ? 'Continue' : isSimulate ? 'Simulate' : 'Continue'}
          </Button>
          <span className="text-clay text-(length:--body-small) font-['InterRegular']">
            {!selectedToken
              ? 'Select a source'
              : isTooLow && !isSimulate
                ? 'Balance too low to continue'
                : 'See your yield next'}
          </span>
        </div>
      </div>
    </>
  );
}
