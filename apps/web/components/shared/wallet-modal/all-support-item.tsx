import type React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon } from 'lucide-react';

interface AllSupportItemProps {
  onToggleExpanded?: (expanded: boolean) => void;
  isExpanded?: boolean;
}

export const AllSupportItem: React.FC<AllSupportItemProps> = ({ onToggleExpanded, isExpanded = false }) => {
  const handleToggle = (): void => {
    onToggleExpanded?.(!isExpanded);
  };

  return (
    <div className="flex items-center w-full py-4 cursor-pointer">
      <div className="flex flex-col gap-2 w-full">
        <div className="inline-flex justify-start items-center gap-4">
          <div className="w-6 h-6 rounded-sm shadow-[-4px_0px_10px_0px_rgba(175,145,145,0.2)] flex justify-center items-center gap-1 flex-wrap content-center overflow-hidden">
            <Image src="/chain/0x2105.base.png" alt="Base" width={8} height={8} className="rounded-[2px]" />
            <Image src="/chain/solana.png" alt="Solana" width={8} height={8} className="rounded-[2px]" />
            <Image src="/chain/0xa4b1.arbitrum.png" alt="Arbitrum" width={8} height={8} className="rounded-[2px]" />
            <Image src="/chain/sui.png" alt="Sui" width={8} height={8} className="rounded-[2px]" />
          </div>
          <div className="flex justify-start items-center gap-1">
            <div className="justify-center text-espresso text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight">
              See all supported networks
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 grow">
            <div className="flex justify-end items-center w-full">
              <div className="flex gap-1 items-center">
                <Button
                  variant="default"
                  size="sm"
                  className="w-6 h-6 p-0 rounded-full bg-cream text-espresso hover:bg-cherry-bright hover:text-white cursor-pointer"
                  onClick={handleToggle}
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
