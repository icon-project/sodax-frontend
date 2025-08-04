import { XIcon, Loader2, PlusIcon } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

import type { ChainType } from '@sodax/types';
import type { XConnector } from '@sodax/wallet-sdk';
import { useXAccount, useXConnect, useXConnection, useXConnectors, useXDisconnect } from '@sodax/wallet-sdk';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';

export type WalletItemProps = {
  name: string;
  xChainType: ChainType;
  icon: string;
};

export function shortenAddress(address: string, chars = 7): string {
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

const WalletItem = ({ icon, name, xChainType }: WalletItemProps) => {
  const xConnection = useXConnection(xChainType);
  const { address } = useXAccount(xChainType);

  const [connectingXConnector, setConnectingXConnector] = useState<XConnector | null>(null);
  const [showConnectorModal, setShowConnectorModal] = useState<boolean>(false);
  const [selectedConnector, setSelectedConnector] = useState<XConnector | null>(null);
  const [showConnectors, setShowConnectors] = useState<boolean>(false);

  const xConnectors = useXConnectors(xChainType);
  const { mutateAsync: xConnect, isPending } = useXConnect();
  const xDisconnect = useXDisconnect();

  const handleConnect = useCallback(
    async (xConnector: XConnector) => {
      setConnectingXConnector(xConnector);
      try {
        await xConnect(xConnector);
        setSelectedConnector(xConnector);
        setShowConnectorModal(false);
      } catch (error) {
        console.error(error);
      } finally {
        setConnectingXConnector(null);
      }
    },
    [xConnect],
  );

  const handleDisconnect = useCallback(() => {
    setConnectingXConnector(null);
    setSelectedConnector(null);
    xDisconnect(xChainType);
  }, [xDisconnect, xChainType]);

  const handleConnectorSelect = useCallback((xConnector: XConnector) => {
    setSelectedConnector(xConnector);
    setShowConnectorModal(false);
  }, []);

  ///////////////////////////////////////////////////////////////////////////////////////////
  const activeXConnector = useMemo(() => {
    return xConnectors.find(connector => connector.id === xConnection?.xConnectorId);
  }, [xConnectors, xConnection]);

  const sortedXConnectors = useMemo(() => {
    const hanaWallet = xConnectors.find(connector => connector.name === 'Hana Wallet');
    if (!hanaWallet) return xConnectors;

    const filteredConnectors = xConnectors.filter(connector => connector.name !== 'Hana Wallet');
    return [hanaWallet, ...filteredConnectors];
  }, [xConnectors]);

  return (
    <div className="flex items-center gap-6 text-[#0d0229]">
      <div className="inline-flex justify-start items-center gap-4">
        <div
          data-property-1="Default"
          className="rounded-md border border-4 border-white inline-flex flex-col justify-center items-center overflow-hidden"
          style={{
            boxShadow: ' rgba(185, 172, 171, 0.2) 0px 4px 8px 0px',
          }}
        >
          <Image src={icon} alt={name} width={24} height={24} className="rounded-md" />
        </div>
        <div className="flex justify-start items-center gap-1">
          <div className="justify-center text-espresso text-xs font-medium font-['InterRegular'] leading-tight">
            {name}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-start gap-2 grow">
        {address ? (
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <div className="cursor-pointer w-10 h-10 p-1 bg-white rounded-[11px] justify-center items-center inline-flex">
                <img src={activeXConnector?.icon} className="w-full h-full rounded-lg" />
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium">{activeXConnector?.name}</span>
                <span className="text-xs text-gray-500">{shortenAddress(address, 4)}</span>
              </div>
            </div>

            <div className="flex gap-1 items-center">
              {/* <Button
                variant="default"
                size="sm"
                className="w-6 h-6 p-0 rounded-full bg-cherry-bright hover:bg-cherry-brighter cursor-pointer"
                onClick={() => setShowConnectorModal(true)}
              >
                <PlusIcon className="w-4 h-4" />
              </Button> */}

              <div className="text-body cursor-pointer" onClick={handleDisconnect}>
                <XIcon />
              </div>
            </div>
          </div>
        ) : (
          <>
            {!showConnectors ? (
              <div className="flex justify-between items-center w-full">
                <div></div>
                <div className="flex gap-1 items-center">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-6 h-6 p-0 rounded-full bg-cherry-bright hover:bg-cherry-brighter cursor-pointer"
                    onClick={() => setShowConnectors(true)}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                {sortedXConnectors.map(xConnector => {
                  return (
                    <Button
                      key={`${xChainType}-${xConnector.name}`}
                      className="cursor-pointer w-10 h-10 p-1 bg-[#d4c5f9] rounded-[11px] justify-center items-center inline-flex"
                      onClick={() => handleConnect(xConnector)}
                      disabled={isPending && connectingXConnector?.id === xConnector.id}
                    >
                      {isPending && connectingXConnector?.id === xConnector.id && <Loader2 className="animate-spin" />}
                      {!(isPending && connectingXConnector?.id === xConnector.id) && (
                        <img src={xConnector.icon} className="w-full h-full rounded-lg" />
                      )}
                    </Button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* XConnector Selection Modal */}
      <Dialog open={showConnectorModal} onOpenChange={setShowConnectorModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Wallet</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            {sortedXConnectors.map(xConnector => (
              <Button
                key={xConnector.id}
                variant="outline"
                className="flex flex-col items-center gap-2 p-4 h-auto"
                onClick={() => handleConnectorSelect(xConnector)}
              >
                <img src={xConnector.icon} className="w-8 h-8 rounded-lg" />
                <span className="text-sm font-medium">{xConnector.name}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletItem;
