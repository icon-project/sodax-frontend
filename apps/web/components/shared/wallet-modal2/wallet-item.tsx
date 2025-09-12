import React, { useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlusIcon, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useXConnect, type XConnector } from '@sodax/wallet-sdk';
import { chainGroupMap } from './wallet-modal';
import { EVM_CHAIN_ICONS } from './evm-chain-item';

export type WalletItemProps = {
  xConnector: XConnector;
  onSuccess?: (xConnector: XConnector) => void;
};

export const WalletItem: React.FC<WalletItemProps> = ({ xConnector, onSuccess }) => {
  const { mutateAsync: xConnect, isPending } = useXConnect();

  const handleConnect = useCallback(async () => {
    await xConnect(xConnector);
    onSuccess?.(xConnector);
  }, [xConnect, xConnector, onSuccess]);

  const { icon, name, chainType } = chainGroupMap[xConnector.xChainType];
  const isEVM = chainType === 'EVM';
  return (
    <React.Fragment>
      <div
        className={`
          inline-flex justify-between items-center
          transition-opacity duration-200
          hover:opacity-100
          group
          opacity-60
          cursor-pointer py-4
          ${isPending === true ? 'opacity-100' : ''}
        `}
      >
        <div className="flex justify-start items-center gap-4">
          <div className="flex justify-start items-center flex-wrap content-center">
            <div className="flex justify-start items-center flex-wrap content-center">
              {!isEVM && (
                <div className="w-6 relative rounded-[6px] shadow-[4px_0px_4px_rgba(175,145,145)] outline outline-4 outline-white inline-flex flex-col justify-start items-start overflow-hidden ml-1">
                  <Image src={icon} alt={name} width={24} height={24} className="rounded-[6px]" />
                  <div className="w-6 h-6 left-0 top-0 absolute bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,_rgba(237,_230,_230,_0.40)_0%,_rgba(237.22,_230.40,_230.40,_0.60)_100%)]" />
                </div>
              )}
              {isEVM && (
                <div className="flex justify-start items-center flex-wrap content-center">
                  {EVM_CHAIN_ICONS.map((icon, index) => (
                    <div
                      key={index}
                      className="rounded-[6px] shadow-[4px_0px_4px_rgba(175,145,145)] outline outline-4 outline-white inline-flex flex-col justify-center items-center overflow-hidden relative"
                    >
                      <Image key={index} src={icon} alt={name} width={24} height={24} className="rounded-[6px]" />
                      <div className="w-6 h-6 left-0 top-0 absolute bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,_rgba(237,_230,_230,_0.40)_0%,_rgba(237.22,_230.40,_230.40,_0.60)_100%)]" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div
              data-property-1="Active"
              className="rounded-[6px] shadow-[4px_0px_4px_rgba(175,145,145)] outline outline-4 outline-white inline-flex flex-col justify-center items-center overflow-hidden z-51"
            >
              <Image
                src={xConnector.icon?.trim() || ''}
                alt={xConnector.name}
                width={24}
                height={24}
                className="rounded-lg"
              />
            </div>
          </div>
          <div className="justify-center text-espresso text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight group-hover:font-bold">
            {isPending ? 'Waiting for wallet' : xConnector.name}
          </div>
        </div>
        <Button
          className={`w-6 h-6 p-0 rounded-full  text-espresso hover:bg-cherry-bright hover:text-white cursor-pointer ${isPending === true ? 'bg-cherry-brighter' : 'bg-cream'}  disabled:opacity-100 disabled:pointer-events-auto`}
          onClick={handleConnect}
          disabled={isPending}
        >
          {isPending && <Loader2 className="animate-spin" />}
          {!isPending && <PlusIcon className="w-4 h-4" />}
        </Button>
      </div>
      <Separator className="h-1 bg-clay opacity-30" />
    </React.Fragment>
  );
};
