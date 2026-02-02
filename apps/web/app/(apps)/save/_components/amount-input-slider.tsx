'use client';

import type React from 'react';
import Image from 'next/image';
import { CustomSlider } from '@/components/ui/customer-slider';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

interface AmountInputSliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  maxValue: number;
  isSimulate?: boolean;
  tokenSymbol: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  inputId?: string;
}

export default function AmountInputSlider({
  value,
  onValueChange,
  maxValue,
  isSimulate,
  tokenSymbol,
  onInputChange,
  className,
}: AmountInputSliderProps): React.JSX.Element {
  // Handle input change with max value constraint
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const inputValue = e.target.value.trim();

    // Convert empty input to 0
    if (inputValue === '' || inputValue === '-') {
      const zeroEvent = {
        ...e,
        target: {
          ...e.target,
          value: '0',
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onInputChange(zeroEvent);
      return;
    }

    // Parse the input value
    const numericValue = Number.parseFloat(inputValue);

    // Check if it's a valid number
    if (Number.isNaN(numericValue)) {
      return;
    }

    // Clamp the value between 0 and maxValue
    const clampedValue = Math.max(0, Math.min(numericValue, maxValue));

    // Create a new event with the clamped value
    const clampedEvent = {
      ...e,
      target: {
        ...e.target,
        value: clampedValue.toString(),
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onInputChange(clampedEvent);
  };

  return (
    <div className={cn('flex items-center gap-2 -mt-2', className)}>
      <CustomSlider
        defaultValue={[0]}
        max={maxValue}
        step={0.0001}
        value={value}
        onValueChange={onValueChange}
        className="h-10 data-[orientation=horizontal]:h-1"
        trackClassName="bg-cream-white data-[orientation=horizontal]:h-1"
        rangeClassName={cn(
          '[background-size:20px_20px] ',
          isSimulate
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
              src={`/coin/${tokenSymbol.toLowerCase()}.png`}
              alt={tokenSymbol}
              width={24}
              height={24}
              priority
            />
          </InputGroupAddon>
          <InputGroupInput
            type="number"
            min={0}
            max={maxValue}
            value={Number.isNaN(value[0]) || value[0] === undefined || value[0] === null ? '0' : value[0].toString()}
            onChange={handleInputChange}
            className="!text-espresso text-(length:--body-comfortable) font-medium font-['InterRegular']"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              className="text-clay text-[9px] font-['InterRegular'] font-normal !border-none !outline-none leading-0"
              onClick={() => {
                onValueChange([maxValue]);
              }}
            >
              MAX
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
}
