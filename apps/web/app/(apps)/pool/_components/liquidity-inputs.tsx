// apps/web/app/(apps)/pool/_components/liquidity-inputs.tsx
import type React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupText } from '@/components/ui/input-group';
import { InputGroupAddon } from '@/components/ui/input-group';
import { InputGroupInput } from '@/components/ui/input-group';

export function LiquidityInputs(): React.JSX.Element {
  return (
    <div className="self-stretch flex flex-col md:flex-row justify-start items-start gap-2 md:gap-4">
      <InputGroup className="h-10 pl-2 pr-4 bg-almost-white rounded-[32px] flex justify-between items-center w-full md:w-50 font-['InterRegular'] text-espresso">
        <InputGroupAddon className="pl-0">
          <InputGroupText>
            <Image
              data-property-1="SODA"
              className="w-6 h-6 rounded-[256px]"
              src="/coin/soda.png"
              alt="SODA"
              width={24}
              height={24}
            />
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="0" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>SODA</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup className="h-10 pl-2 pr-4 bg-almost-white rounded-[32px] flex justify-between items-center w-full md:w-50 font-['InterRegular'] text-espresso">
        <InputGroupAddon className="pl-0">
          <InputGroupText>
            <Image
              data-property-1="xSODA"
              className="w-6 h-6 rounded-[256px]"
              src="/coin/xsoda.png"
              alt="xSODA"
              width={24}
              height={24}
            />
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="0" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>xSODA</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <Button
        data-state="disabled"
        data-type="default"
        variant="cream"
        disabled
        className="h-10 min-w-28 px-6 py-2 mix-blend-multiply bg-cream-white rounded-[240px] flex justify-center items-center gap-1 w-full md:w-auto"
      >
        <div className="text-center justify-start  text-clay-light text-sm font-medium font-['InterRegular'] leading-5">
          Continue
        </div>
      </Button>
    </div>
  );
}
