// apps/web/components/shared/wallet-modal/chain-item.tsx
import type React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlusIcon, MinusIcon, CopyIcon, Loader2, Info, XIcon } from 'lucide-react';
import type { ChainType } from '@sodax/types';
import type { XConnector } from '@sodax/wallet-sdk';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PopoverClose } from '@radix-ui/react-popover';
import { EvmMultiConnectIcon } from '@/components/icons';
import { usePathname } from 'next/navigation';
import { shortenAddress } from '@/lib/utils';

// EVM chain icons to display when name is "EVM"
const EVM_CHAIN_ICONS = [
  '/chain/0x2105.base.png',
  '/chain/0x38.bsc.png',
  '/chain/0xa86a.avax.png',
  '/chain/0x89.polygon.png',
  '/chain/0xa.optimism.png',
  '/chain/0xa4b1.arbitrum.png',
  '/chain/sonic.png',
];

export type ChainItemProps = {
  icon: string;
  name: string;
  xChainType: ChainType;
  address?: string;
  activeConnector?: XConnector;
  isConnecting?: boolean;
  showCopied?: boolean;
  copiedFadingOut?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onCopyAddress?: () => void;
  onShowWallets?: () => void;
};

export const ChainItem: React.FC<ChainItemProps> = ({
  icon,
  name,
  xChainType,
  address,
  activeConnector,
  isConnecting = false,
  showCopied = false,
  copiedFadingOut = false,
  onConnect,
  onDisconnect,
  onCopyAddress,
  onShowWallets,
}) => {
  // Check if this is an EVM chain that should display multiple icons
  const isEVMWithMultipleIcons = name === 'EVM' && xChainType === 'EVM';
  const pathname = usePathname();
  // const isMigrateRoute = pathname.includes('migrate');

  return (
    <div className="flex items-center w-full text-[#0d0229] py-4 pl-1">
      <div className="flex flex-col gap-2 w-full">
        {/* {isEVMWithMultipleIcons && !isMigrateRoute && (
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
        )} */}
        {isEVMWithMultipleIcons && (
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
        )}
        <div className="inline-flex justify-start items-center gap-4">
          {isEVMWithMultipleIcons ? (
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
              {/* {!isMigrateRoute &&
                EVM_CHAIN_ICONS.map((evmIcon, index) => (
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
              {/* {isMigrateRoute && (
                <div className="rounded-[6px] shadow-[-4px_0px_4px_rgba(175,145,145)] outline outline-4 outline-white inline-flex flex-col justify-center items-center overflow-hidden">
                  <Image
                    src={'/chain/sonic.png'}
                    alt={'Sonic'}
                    width={24}
                    height={24}
                    className="rounded-sm shadow-[0px_6px_12px_0px_rgba(185,172,171,0.10)]"
                  />
                </div>
              )} */}
              {address && (
                <div className="absolute -bottom-1 -right-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <title>Connected</title>
                    <circle cx="7" cy="7" r="5.5" fill="#00A778" stroke="white" strokeWidth="3" />
                  </svg>
                </div>
              )}
            </div>
          ) : (
            <div className="self-stretch inline-flex justify-start items-center flex-wrap content-center relative">
              <div className="rounded-[6px] shadow-[-4px_0px_4px_rgba(175,145,145)] outline outline-4 outline-white inline-flex flex-col justify-center items-center overflow-hidden">
                <Image
                  src={icon}
                  alt={name}
                  width={24}
                  height={24}
                  className="rounded-[6px] shadow-[0px_6px_12px_0px_rgba(185,172,171,1)]"
                />
              </div>
              {address && (
                <div className="absolute bottom-0 -right-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <title>Connected</title>
                    <circle cx="7" cy="7" r="5.5" fill="#00A778" stroke="white" strokeWidth="3" />
                  </svg>
                </div>
              )}
            </div>
          )}
          {!address && (
            <div className="flex justify-start items-center gap-1">
              <div className="justify-center text-espresso text-xs font-medium font-['InterRegular'] leading-tight">
                {/* {isConnecting
                  ? 'Waiting for wallet'
                  : address
                    ? ''
                    : isMigrateRoute && xChainType === 'EVM'
                      ? 'Sonic'
                      : name} */}
                {isConnecting ? 'Waiting for wallet' : address ? '' : name}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 grow">
            {address ? (
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-1">
                  <div className="flex flex-col">
                    <span className="text-espresso text-(size:--body-comfortable) leading-[1.4] font-medium">
                      {shortenAddress(address, 4)}
                    </span>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-6 h-6 p-0 rounded-full bg-transparent text-cherry-grey hover:bg-transparent hover:text-clay cursor-pointer"
                    onClick={onCopyAddress}
                  >
                    <CopyIcon className="w-4 h-4" />
                  </Button>
                  {showCopied && (
                    <div
                      className={`flex flex-col font-['InterRegular'] text-espresso leading-[1.4] text-(size:--body-comfortable) text-nowrap transition-opacity ${
                        copiedFadingOut ? 'duration-[2000ms] opacity-0' : 'duration-100 opacity-100'
                      }`}
                    >
                      <p className="block leading-[1.4] whitespace-pre">Copied</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 items-center">
                  {/* <span className="text-(size:--body-small) text-clay-light leading-[1.4] font-['InterRegular']">
                    {activeConnector && activeConnector.name.replace('Hana Wallet', 'Hana')}
                  </span> */}
                  <Button
                    variant="default"
                    size="sm"
                    className="w-6 h-6 p-0 rounded-full bg-cream text-espresso bg-cherry-brighter hover:bg-cherry-bright hover:text-white cursor-pointer"
                    onClick={onDisconnect}
                  >
                    <MinusIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end items-center w-full">
                <div className="flex gap-1">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-6 h-6 p-0 rounded-full bg-cream text-espresso hover:bg-cherry-bright hover:text-white cursor-pointer"
                    onClick={onShowWallets}
                    disabled={isConnecting}
                  >
                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
