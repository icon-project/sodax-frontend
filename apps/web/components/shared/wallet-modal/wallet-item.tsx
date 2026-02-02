import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlusIcon, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useXConnect, type XConnector, type XAccount, useXAccount } from '@sodax/wallet-sdk-react';
import { chainGroupMap } from './wallet-modal';
import { EVM_CHAIN_ICONS } from '@/constants/chains';
import { delay } from '@/lib/utils';

export type WalletItemProps = {
  xConnector: XConnector;
  hoveredWalletId?: string | undefined;
  setHoveredWalletId?: (walletId: string | undefined) => void;
  onSuccess?: (xConnector: XConnector, xAccount: XAccount) => Promise<void>;
};

export const WalletItem: React.FC<WalletItemProps> = ({
  xConnector,
  hoveredWalletId,
  setHoveredWalletId,
  onSuccess,
}) => {
  const { mutateAsync: xConnect, isPending } = useXConnect();

  const [connected, setConnected] = useState(false);

  const xAccount = useXAccount(xConnector.xChainType);

  const handleConnect = useCallback(async () => {
    await xConnect(xConnector);
    setConnected(true);
    await delay(500);
  }, [xConnect, xConnector]);

  useEffect(() => {
    if (connected && xAccount.address) {
      onSuccess?.(xConnector, xAccount);
      setConnected(false);
    }
  }, [onSuccess, xConnector, xAccount, connected]);

  const { icon, name, chainType } = chainGroupMap[xConnector.xChainType];
  const isEVM = chainType === 'EVM';
  return (
    <React.Fragment>
      <div
        className={`
          inline-flex justify-between items-center
          transition-opacity duration-200
          group
          cursor-pointer py-4
          ${isPending === true ? 'opacity-100' : ''}
          ${hoveredWalletId === undefined || hoveredWalletId === xConnector.id ? 'opacity-100' : 'opacity-60'}
        `}
        onMouseEnter={() => {
          setHoveredWalletId?.(xConnector.id);
        }}
        onMouseLeave={() => {
          if (!isPending) setHoveredWalletId?.(undefined);
        }}
        onClick={handleConnect}
      >
        <div className="flex flex-col gap-4 w-full">
          {isEVM && (
            <div className="flex justify-between items-center gap-4 w-full">
              <div className="flex justify-start items-center gap-4">
                <div className="rounded-[6px] inline-flex flex-col justify-center items-center overflow-hidden z-51">
                  <Image
                    src={xConnector.icon?.trim() || ''}
                    alt={xConnector.name}
                    width={24}
                    height={24}
                    className=""
                  />
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
          )}

          <div className="flex justify-start items-center flex-wrap ">
            <div className="flex justify-start items-center flex-wrap w-full">
              {!isEVM && (
                <div className="flex align-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="w-6 relative rounded-[6px] shadow-[4px_0px_4px_rgba(175,145,145)] outline-4 outline-white inline-flex flex-col justify-start items-start overflow-hidden ml-1">
                      <Image src={icon} alt={name} width={24} height={24} className="rounded-[6px]" />
                    </div>
                    <div className="rounded-[6px] inline-flex flex-col justify-center items-center overflow-hidden z-51 shadow-[4px_0px_4px_rgba(175,145,145)] outline-4 outline-white">
                      <Image
                        src={xConnector.icon?.trim() || ''}
                        alt={xConnector.name}
                        width={24}
                        height={24}
                        className=""
                      />
                    </div>
                    <div className="text-espresso text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight group-hover:font-bold ml-4">
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
              )}
              {isEVM && (
                <div className="flex justify-start items-center flex-wrap">
                  {EVM_CHAIN_ICONS.map((icon, index) => (
                    <div
                      key={index}
                      className="rounded-[6px] shadow-[4px_0px_4px_rgba(175,145,145)] outline-4 outline-white inline-flex flex-col justify-center items-center overflow-hidden relative"
                    >
                      <Image key={index} src={icon} alt={name} width={24} height={24} className="rounded-[6px]" />
                      <div className="w-6 h-6 left-0 top-0 absolute bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,_rgba(237,_230,_230,_0.40)_0%,_rgba(237.22,_230.40,_230.40,_0.60)_100%)]" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Separator className="h-1 bg-clay opacity-30" />
    </React.Fragment>
  );
};
