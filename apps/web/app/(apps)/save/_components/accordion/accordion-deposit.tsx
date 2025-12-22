import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { XToken, ChainId } from '@sodax/types';
import { CustomSlider } from '@/components/ui/customer-slider';
import NetworkIcon from '@/components/shared/network-icon';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { formatBalance } from '@/lib/utils';
import BigNumber from 'bignumber.js';
import { formatUnits } from 'viem';
import { chainIdToChainName } from '@/providers/constants';
import { cn } from '@/lib/utils';

interface AccordionDepositProps {
  selectedToken: XToken | null;
  tokens: XToken[];
}

export default function AccordionDeposit({ selectedToken, tokens }: AccordionDepositProps) {
  const { address: sourceAddress } = useXAccount(selectedToken?.xChainId);
  const [progress, setProgress] = useState([0]);
  const previousTokenAddressRef = useRef<string | undefined>(selectedToken?.address);

  const { data: balances } = useXBalances({
    xChainId: selectedToken?.xChainId as ChainId,
    xTokens: selectedToken ? [selectedToken] : [],
    address: sourceAddress,
  });

  const balance = balances?.[selectedToken?.address as string] ?? 0n;

  const { data: tokenPrice } = useTokenPrice(selectedToken as XToken);
  const usdValue = useMemo(() => {
    return balance
      ? new BigNumber(formatUnits(balance, selectedToken?.decimals ?? 0)).multipliedBy(tokenPrice ?? 0).toFixed(2)
      : '0.00';
  }, [balance, selectedToken, tokenPrice]);

  const maxValue = useMemo(() => {
    return Number(formatBalance(formatUnits(balance, selectedToken?.decimals ?? 0), tokenPrice ?? 0));
  }, [balance, selectedToken, tokenPrice]);

  // Reset progress to 0 when token changes
  useEffect(() => {
    const currentTokenAddress = selectedToken?.address;
    if (previousTokenAddressRef.current !== currentTokenAddress) {
      setProgress([0]);
      previousTokenAddressRef.current = currentTokenAddress;
    }
  }, [selectedToken]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const inputValue = e.target.value;

    // Allow empty input temporarily while typing
    if (inputValue === '') {
      setProgress([0]);
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
  };

  return (
    <>
      <div className="flex gap-2 items-center h-12 pl-1">
        <NetworkIcon id={selectedToken?.xChainId || ''} className="scale-150" />
        {!sourceAddress ? (
          <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-espresso ml-1">
            Choose an amount to simulate yield.
          </div>
        ) : balance > 0n ? (
          <>
            <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-espresso ml-1 font-bold">
              ${usdValue}
            </div>
            <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-clay">
              worth of {selectedToken?.symbol}
            </div>
          </>
        ) : (
          <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-espresso ml-1">
            No {selectedToken?.symbol} detected on {chainIdToChainName(selectedToken?.xChainId as ChainId)}.
          </div>
        )}
      </div>
      <div
        className={cn(
          'flex items-center gap-2 -mt-2',
          balance > 0n ? 'opacity-100' : sourceAddress ? 'blur-sm pl-4 sm:pl-3' : 'pl-4 sm:pl-3',
        )}
      >
        <CustomSlider
          defaultValue={[0]}
          max={maxValue}
          step={0.01}
          value={progress}
          onValueChange={setProgress}
          className="h-10"
          trackClassName="bg-cream-white"
          rangeClassName="bg-[linear-gradient(135deg,#EDE6E6_25%,#E3BEBB_25%,#E3BEBB_50%,#EDE6E6_50%,#EDE6E6_75%,#E3BEBB_75%,#E3BEBB_100%)] 
     [background-size:20px_20px]"
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
              step={0.01}
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
          Sample available:
        </div>
        <div className="font-['InterRegular'] text-(length:--body-comfortable) font-medium text-clay">
          {formatBalance(formatUnits(balance, selectedToken?.decimals ?? 0), tokenPrice ?? 0)} {selectedToken?.symbol}
        </div>
      </div>
    </>
  );
}
