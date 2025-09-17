import type React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlusIcon, MinusIcon, CopyIcon, Loader2, Info, XIcon } from 'lucide-react';
import type { ChainType } from '@sodax/types';
import { EVMChainItem } from './evm-chain-item';
import { useXAccount, useXConnect, useXConnectors, useXDisconnect, type XConnector } from '@sodax/wallet-sdk-react';
import { useCallback, useState } from 'react';
import { shortenAddress } from '@/lib/utils';
import { chainGroupMap } from './wallet-modal';

export type ChainItemProps = {
  chainType: ChainType;
  setActiveXChainType: (chainType: ChainType) => void;
  onSuccess?: () => void;
};

export const ChainItem: React.FC<ChainItemProps> = ({ chainType, setActiveXChainType, onSuccess }) => {
  const { address } = useXAccount(chainType);
  const xConnectors = useXConnectors(chainType);
  const { mutateAsync: xConnect, isPending } = useXConnect();
  const [showCopied, setShowCopied] = useState(false);
  const [copiedFadingOut, setCopiedFadingOut] = useState(false);
  const xDisconnect = useXDisconnect();

  const handleConnect = useCallback(async () => {
    if (xConnectors.length === 0) {
      return;
    }

    if (xConnectors.length === 1) {
      try {
        await xConnect(xConnectors[0] as XConnector);
        onSuccess?.();
      } catch (e) {}
    } else {
      setActiveXChainType(chainType);
    }
  }, [xConnect, xConnectors, setActiveXChainType, chainType, onSuccess]);

  const onCopyAddress = () => {
    if (!address) return;
    setShowCopied(true);
    navigator.clipboard.writeText(address);
    setTimeout(() => {
      setCopiedFadingOut(true);
    }, 1000);

    setTimeout(() => {
      setShowCopied(false);
      setCopiedFadingOut(false);
    }, 3000);
  };

  const handleDisconnect = useCallback(() => {
    xDisconnect(chainType);
  }, [xDisconnect, chainType]);

  if (chainType === 'EVM') {
    return <EVMChainItem handleConnect={handleConnect} handleDisconnect={handleDisconnect} isPending={isPending} />;
  }
  return (
    <div
      className={`
          inline-flex justify-between items-center
          transition-opacity duration-200
          hover:opacity-100
          group
          opacity-60
          cursor-pointer py-4 pl-1
          ${isPending === true || address ? 'opacity-100' : ''}
        `}
    >
      <div className="flex flex-col gap-2 w-full">
        <div className="inline-flex justify-start items-center gap-4">
          <div className="self-stretch inline-flex justify-start items-center flex-wrap content-center relative">
            <div className="rounded-[6px] shadow-[-4px_0px_4px_rgba(175,145,145)] outline outline-4 outline-white inline-flex flex-col justify-center items-center overflow-hidden">
              <Image
                src={chainGroupMap[chainType].icon}
                alt={chainGroupMap[chainType].name}
                width={24}
                height={24}
                className="rounded-[6px] shadow-[0px_6px_12px_0px_rgba(185,172,171,1)]"
              />
              {address && (
                <div className="absolute -bottom-1 -right-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <title>Connected</title>
                    <circle cx="7" cy="7" r="5.5" fill="#00A778" stroke="white" strokeWidth="3" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-start items-center gap-1">
            <div className="justify-center text-espresso text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight group-hover:font-bold flex gap-1 items-center">
              {address ? shortenAddress(address, 4) : isPending ? 'Waiting for wallet' : chainGroupMap[chainType].name}
              {address && (
                <CopyIcon className="w-4 h-4 cursor-pointer text-cherry-grey hover:text-clay" onClick={onCopyAddress} />
              )}
              {showCopied && (
                <div
                  className={`flex font-['InterRegular'] font-medium justify-center leading-[0] not-italic relative shrink-0 text-espresso text-(length:--body-comfortable) text-left text-nowrap transition-opacity ${
                    copiedFadingOut ? 'duration-[2000ms] opacity-0' : 'duration-100 opacity-100'
                  }`}
                >
                  <p className="block leading-[1.4] whitespace-pre">Copied</p>
                </div>
              )}
            </div>
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
                  className={`w-6 h-6 p-0 rounded-full  text-espresso hover:bg-cherry-bright hover:text-white cursor-pointer  ${isPending === true ? 'bg-cherry-brighter' : 'bg-cream'} disabled:opacity-100 disabled:pointer-events-auto`}
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
