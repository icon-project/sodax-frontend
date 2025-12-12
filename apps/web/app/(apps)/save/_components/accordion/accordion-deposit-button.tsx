import { Button } from '@/components/ui/button';
import { AlertCircleIcon, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChainId, XToken } from '@sodax/types';
import { getXChainType, useXBalances } from '@sodax/wallet-sdk-react';
import { chainIdToChainName } from '@/providers/constants';
import { useModalStore } from '@/stores/modal-store-provider';
import { MODAL_ID } from '@/stores/modal-store';
import type { DisplayItem } from './accordion-expanded-content';

interface AccordionDepositButtonProps {
  selectedToken: XToken | null;
  selectedAsset: number | null;
  displayItems: DisplayItem[];
  isShowDeposits: boolean;
  setIsShowDeposits: (value: boolean) => void;
  sourceAddress: string | undefined;
}

export default function AccordionDepositButton({
  selectedToken,
  selectedAsset,
  displayItems,
  isShowDeposits,
  setIsShowDeposits,
  sourceAddress,
}: AccordionDepositButtonProps) {
  const { data: balances } = useXBalances({
    xChainId: selectedToken?.xChainId as ChainId,
    xTokens: selectedToken ? [selectedToken] : [],
    address: sourceAddress,
  });

  const balance = balances?.[selectedToken?.address as string] ?? 0n;
  const openModal = useModalStore(state => state.openModal);

  const assetItem = selectedAsset !== null ? displayItems[selectedAsset] : null;
  const isGroup = assetItem?.isGroup;
  const canInteract = selectedAsset !== null && !isGroup;

  const handleConnect = () => {
    const chainType = getXChainType(selectedToken?.xChainId || 'sonic') || 'EVM';
    openModal(MODAL_ID.WALLET_MODAL, {
      isExpanded: false,
      primaryChainType: chainType,
    });
  };

  const renderSimulationButtons = () => (
    <div className="flex gap-(--layout-space-small)">
      {isShowDeposits && (
        <Button variant="cream" className="w-10 h-10" onMouseDown={() => setIsShowDeposits(false)}>
          <ArrowLeft />
        </Button>
      )}

      {!isShowDeposits && (
        <Button
          variant="cherry"
          className="w-27 mix-blend-multiply shadow-none"
          onMouseDown={() => setIsShowDeposits(true)}
        >
          Simulate
        </Button>
      )}

      {isShowDeposits && !sourceAddress && (
        <Button variant="cherry" className="w-39 mix-blend-multiply shadow-none" onMouseDown={handleConnect}>
          Connect {chainIdToChainName(selectedToken?.xChainId || 'sonic')}
        </Button>
      )}
    </div>
  );

  const renderContinueButton = () => (
    <Button
      variant="cherry"
      className="w-27 mix-blend-multiply shadow-none"
      disabled={!selectedToken || BigInt(balance) === 0n}
      onMouseDown={() => {
        console.log('deposit!');
      }}
    >
      Continue
    </Button>
  );

  const getHelperText = () => {
    if (!isShowDeposits) {
      return !selectedToken ? 'Select a source' : 'You’ll simulate yield next';
    }
    return sourceAddress ? (
      <div className="flex gap-2">
        <span className="text-clay-light">Yield/mo:</span>
        <span className="font-['InterRegular']">~$148.12</span>
        <AlertCircleIcon width={16} height={16} className="text-clay" />
      </div>
    ) : (
      'To show your funds'
    );
  };

  return (
    <div className={cn('flex gap-4 items-center mb-8', !selectedToken && isGroup && 'blur filter opacity-30')}>
      {(canInteract || selectedToken) && renderSimulationButtons()}

      {(!selectedToken || (isShowDeposits && sourceAddress)) && renderContinueButton()}

      <span className="text-clay text-(length:--body-small) font-['InterRegular']">{getHelperText()}</span>
    </div>
  );
}
