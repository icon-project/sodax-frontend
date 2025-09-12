import type React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlusIcon, MinusIcon, CopyIcon, Loader2, Info, XIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PopoverClose } from '@radix-ui/react-popover';
import { EvmMultiConnectIcon } from '@/components/icons';
import { useXAccount } from '@sodax/wallet-sdk';
import { shortenAddress } from '@/lib/utils';

export const EVM_CHAIN_ICONS = [
  '/chain/0x2105.base.png',
  '/chain/0x38.bsc.png',
  '/chain/0xa86a.avax.png',
  '/chain/0x89.polygon.png',
  '/chain/0xa.optimism.png',
  '/chain/0xa4b1.arbitrum.png',
  '/chain/sonic.png',
];

export type EVMChainItemProps = {
  handleConnect: () => void;
  handleDisconnect: () => void;
  isPending: boolean;
};

export const EVMChainItem: React.FC<EVMChainItemProps> = ({ handleConnect, handleDisconnect, isPending }) => {
  const { address } = useXAccount('EVM');
  return (
    <div className="flex items-center w-full py-4 pl-1 cursor-pointer">
      <div className="flex flex-col gap-2 w-full">
        <div className="inline-flex justify-start items-center gap-1">
          <div className="justify-center text-espresso text-xs font-medium font-['InterRegular'] leading-tight">
            EVM multi-connect
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Info className="w-4 h-4 cursor-pointer" />
            </PopoverTrigger>
            <PopoverContent className="w-auto -mt-22 rounded-full border-none relative">
              <div className="inline-flex justify-center items-center gap-2">
                <p className="text-(length:--body-comfortable) font-medium text-espresso">
                  One address, many networks.
                </p>
                <PopoverClose asChild>
                  <XIcon className="w-3 h-3 cursor-pointer text-espresso" />
                </PopoverClose>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <EvmMultiConnectIcon />
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="inline-flex justify-start items-center gap-4">
          <div className="self-stretch inline-flex justify-start items-center flex-wrap content-center relative">
            {EVM_CHAIN_ICONS.map((evmIcon, index) => (
              <div
                key={index}
                className="rounded-[6px] shadow-[-4px_0px_4px_rgba(175,145,145)] outline outline-4 outline-white inline-flex flex-col justify-center items-center overflow-hidden"
              >
                <Image
                  key={index}
                  src={evmIcon}
                  alt={`EVM Chain ${index + 1}`}
                  width={24}
                  height={24}
                  className="rounded-sm shadow-[0px_6px_12px_0px_rgba(185,172,171,0.10)]"
                />
              </div>
            ))}
          </div>

          <div className="justify-center text-espresso text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight">
            {address ? shortenAddress(address, 4) : 'EVM'}
          </div>

          <div className="flex flex-wrap justify-end gap-2 grow">
            <div className="flex gap-1">
              {address && (
                <Button
                  variant="default"
                  size="sm"
                  className="w-6 h-6 p-0 rounded-full bg-cream text-espresso bg-cherry-brighter hover:bg-cherry-bright hover:text-white cursor-pointer"
                  onClick={handleDisconnect}
                >
                  <MinusIcon className="w-4 h-4" />
                </Button>
              )}
              {!address && (
                <Button
                  variant="default"
                  size="sm"
                  className="w-6 h-6 p-0 rounded-full bg-cream text-espresso hover:bg-cherry-bright hover:text-white cursor-pointer"
                  onClick={handleConnect}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
