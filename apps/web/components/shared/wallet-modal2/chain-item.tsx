import type React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlusIcon, MinusIcon, CopyIcon, Loader2, Info, XIcon } from 'lucide-react';
import type { ChainType } from '@sodax/types';
import { EVMChainItem } from './evm-chain-item';
import { useXAccount, useXConnect, useXConnectors, useXDisconnect, type XConnector } from '@sodax/wallet-sdk';
import { useCallback } from 'react';
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

  const handleDisconnect = useCallback(() => {
    xDisconnect(chainType);
  }, [xDisconnect, chainType]);

  if (chainType === 'EVM') {
    return <EVMChainItem handleConnect={handleConnect} handleDisconnect={handleDisconnect} isPending={isPending} />;
  }
  return (
    <div className="flex items-center w-full text-[#0d0229] py-4 pl-1">
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
            </div>
          </div>

          <div className="flex justify-start items-center gap-1">
            <div className="justify-center text-espresso text-xs font-medium font-['InterRegular'] leading-tight">
              {address ? shortenAddress(address, 4) : chainGroupMap[chainType].name}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 grow">
            <div className="flex gap-1">
              {address && (
                <Button
                  variant="default"
                  size="sm"
                  className="w-6 h-6 p-0 rounded-full bg-cream text-espresso hover:bg-cherry-bright hover:text-white cursor-pointer"
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
