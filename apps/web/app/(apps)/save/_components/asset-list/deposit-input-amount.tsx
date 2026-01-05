// apps/web/app/(apps)/save/_components/asset-list/deposit-input-amount.tsx
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { XToken, ChainId } from '@sodax/types';
import { CustomSlider } from '@/components/ui/customer-slider';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { useXAccount, getXChainType } from '@sodax/wallet-sdk-react';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { formatBalance } from '@/lib/utils';
import { formatUnits } from 'viem';
import { chainIdToChainName } from '@/providers/constants';
import { cn } from '@/lib/utils';
import { useSaveActions, useSaveState } from '../../_stores/save-store-provider';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, ArrowLeft } from 'lucide-react';
import { useModalStore } from '@/stores/modal-store-provider';
import { MODAL_ID } from '@/stores/modal-store';
import DepositDialog from '../deposit-dialog/deposit-dialog';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';

interface DepositInputAmountProps {
  selectedToken: XToken | null;
  tokens: XToken[];
  onBack?: () => void;
}

export default function DepositInputAmount({ selectedToken, tokens, onBack }: DepositInputAmountProps) {
  const { address: sourceAddress } = useXAccount(selectedToken?.xChainId);
  const { setDepositValue } = useSaveActions();
  const { depositValue } = useSaveState();
  const [progress, setProgress] = useState([0]);
  const previousTokenAddressRef = useRef<string | undefined>(selectedToken?.address);
  const openModal = useModalStore(state => state.openModal);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState<boolean>(false);

  const allChainBalances = useAllChainBalances();
  const balance = selectedToken
    ? (allChainBalances[selectedToken.address]?.find(entry => entry.chainId === selectedToken.xChainId)?.balance ?? 0n)
    : 0n;

  const { data: tokenPrice } = useTokenPrice(selectedToken as XToken);

  const maxValue = useMemo(() => {
    return Number(formatBalance(formatUnits(balance, selectedToken?.decimals ?? 0), tokenPrice ?? 0));
  }, [balance, selectedToken, tokenPrice]);

  // Reset progress to 0 when token changes
  useEffect(() => {
    const currentTokenAddress = selectedToken?.address;
    if (previousTokenAddressRef.current !== currentTokenAddress) {
      setProgress([0]);
      setDepositValue(0);
      previousTokenAddressRef.current = currentTokenAddress;
    }
  }, [selectedToken, setDepositValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const inputValue = e.target.value;

    // Allow empty input temporarily while typing
    if (inputValue === '') {
      setProgress([0]);
      setDepositValue(0);
      return;
    }

    // Parse the input value
    const numericValue = Number.parseFloat(inputValue);

    // Check if it's a valid number
    if (Number.isNaN(numericValue)) {
      return;
    }

    // Clamp the value between 0 and max
    const clampedValue = Math.max(0, Math.min(numericValue, maxValue));
    setProgress([clampedValue]);
    setDepositValue(clampedValue);
  };

  const handleConnect = () => {
    const chainType = getXChainType(selectedToken?.xChainId || 'sonic') || 'EVM';
    openModal(MODAL_ID.WALLET_MODAL, {
      isExpanded: false,
      primaryChainType: chainType,
    });
  };

  const getHelperText = () => {
    return sourceAddress ? (
      <div className="flex gap-2">
        <span className="text-clay-light">Yield/mo:</span>
        <span className="font-['InterRegular'] text-espresso font-medium">~$148.12</span>
        <AlertCircleIcon width={16} height={16} className="text-clay" />
      </div>
    ) : (
      'To show your funds'
    );
  };

  return (
    <>
      <div className="flex gap-2 items-center h-12">
        {!sourceAddress ? (
          <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-espresso">
            Choose an amount to simulate yield.
          </div>
        ) : balance > 0n ? (
          <>
            <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-espresso font-bold">
              ${formatBalance(depositValue.toString(), tokenPrice ?? 0)}
            </div>
            <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-clay">
              worth of {selectedToken?.symbol}
            </div>
          </>
        ) : (
          <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-espresso">
            No {selectedToken?.symbol} detected on {chainIdToChainName(selectedToken?.xChainId as ChainId)}.
          </div>
        )}
      </div>
      <div
        className={cn(
          'flex items-center gap-2 -mt-2',
          balance > 0n ? 'opacity-100' : sourceAddress ? 'blur-[2px] pl-4 sm:pl-3 pointer-events-none' : 'pl-4 sm:pl-3',
        )}
      >
        <CustomSlider
          defaultValue={[0]}
          max={maxValue}
          step={0.001}
          value={progress}
          onValueChange={value => {
            setProgress(value);
            setDepositValue(value[0] ?? 0);
          }}
          className="h-10"
          trackClassName="bg-cream-white"
          rangeClassName={cn(
            '[background-size:20px_20px]',
            !sourceAddress
              ? 'bg-[linear-gradient(135deg,#EDE6E6_25%,#E3BEBB_25%,#E3BEBB_50%,#EDE6E6_50%,#EDE6E6_75%,#E3BEBB_75%,#E3BEBB_100%)]'
              : 'bg-cherry-bright',
          )}
          thumbClassName="cursor-pointer bg-white !border-white border-gray-400 w-6 h-6 [filter:drop-shadow(0_2px_24px_#EDE6E6)]"
        />
        <div className="max-w-40">
          <InputGroup className="[--radius:9999px] border-4 border-cream-white w-40 h-10 pr-1">
            <InputGroupAddon className="text-muted-foreground pl-1.5">
              <Image
                className="w-6 h-6 rounded-[256px]"
                src={`/coin/${tokens[0]?.symbol.toLowerCase()}.png`}
                alt={tokens[0]?.symbol || ''}
                width={24}
                height={24}
                priority
              />
            </InputGroupAddon>
            <InputGroupInput
              id="input-secure-19"
              type="number"
              min={0}
              max={maxValue}
              step={0.001}
              value={progress[0]?.toString() || '0'}
              onChange={handleInputChange}
              className="!text-espresso text-(length:--body-comfortable) font-medium font-['InterRegular']"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                className="text-clay text-[9px] font-['InterRegular'] font-normal !border-none !outline-none leading-0"
              >
                MAX
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
      <div className="flex gap-2 items-center -mt-2 mb-7">
        <div className="font-['InterRegular'] text-(length:--body-comfortable) font-medium text-clay-light">
          {!sourceAddress ? 'Sample available:' : 'Available'}
        </div>
        <div className="font-['InterRegular'] text-(length:--body-comfortable) font-medium text-clay">
          {formatBalance(formatUnits(balance, selectedToken?.decimals ?? 0), tokenPrice ?? 0)} {selectedToken?.symbol}
        </div>
      </div>

      <div className="flex gap-4 items-center mb-8 transition-all duration-300">
        <div className="flex gap-(--layout-space-small)">
          {onBack && (
            <Button
              variant="cream"
              className="w-10 h-10"
              onMouseDown={() => {
                onBack();
                setDepositValue(0);
              }}
            >
              <ArrowLeft />
            </Button>
          )}

          {!sourceAddress && (
            <Button variant="cherry" className="w-39 mix-blend-multiply shadow-none" onMouseDown={handleConnect}>
              Connect {chainIdToChainName(selectedToken?.xChainId || 'sonic')}
            </Button>
          )}

          {sourceAddress && (
            <>
              <Button
                variant="cherry"
                className="w-27 mix-blend-multiply shadow-none"
                disabled={!selectedToken || BigInt(balance) === 0n}
                onMouseDown={() => {
                  setIsDepositDialogOpen(true);
                }}
              >
                Continue
              </Button>
              <DepositDialog
                open={isDepositDialogOpen}
                onOpenChange={setIsDepositDialogOpen}
                selectedToken={selectedToken}
                tokens={tokens}
              />
            </>
          )}
        </div>

        <span className="text-clay text-(length:--body-small) font-['InterRegular']">{getHelperText()}</span>
      </div>
    </>
  );
}
