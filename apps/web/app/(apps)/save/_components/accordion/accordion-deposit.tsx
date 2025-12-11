import Image from 'next/image';
import type { XToken } from '@sodax/types';
import { CustomSlider } from '@/components/ui/customer-slider';
import NetworkIcon from '@/components/shared/network-icon';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';

interface AccordionDepositProps {
  selectedToken: XToken | null;
  progress: number[];
  setProgress: (value: number[]) => void;
  tokens: XToken[];
}

export default function AccordionDeposit({ selectedToken, progress, setProgress, tokens }: AccordionDepositProps) {
  return (
    <div className="p-1">
      <div className="flex gap-2 items-center">
        <NetworkIcon id={selectedToken?.xChainId || ''} className="scale-150" />
        <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-espresso ml-1">
          $10,000.00
        </div>
        <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-clay">worth of WBTC</div>
      </div>
      <div className="flex items-center gap-2 mt-8">
        <CustomSlider
          defaultValue={[0]}
          max={30}
          step={1}
          value={progress}
          onValueChange={setProgress}
          className="h-10"
          trackClassName="bg-cream-white"
          rangeClassName="bg-[linear-gradient(135deg,#EDE6E6_25%,#E3BEBB_25%,#E3BEBB_50%,#EDE6E6_50%,#EDE6E6_75%,#E3BEBB_75%,#E3BEBB_100%)] 
     [background-size:20px_20px]"
          thumbClassName="cursor-pointer bg-white !border-white border-gray-400 w-6 h-6 [filter:drop-shadow(0_2px_24px_#EDE6E6)]"
        />
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
            value={progress[0]?.toString() || '0'}
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
      <div className="flex gap-2 items-center mt-6">
        <div className="font-['InterRegular'] text-(length:--body-comfortable) font-medium text-clay-light">
          Sample available:
        </div>
        <div className="font-['InterRegular'] text-(length:--body-comfortable) font-medium text-clay">0 WBTC</div>
      </div>
    </div>
  );
}
