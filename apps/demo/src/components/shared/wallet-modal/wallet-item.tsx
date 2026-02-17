import { XIcon, Loader2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import type { ChainType } from '@sodax/types';
import type { XConnector } from '@sodax/wallet-sdk-react';
import { useXAccount, useXConnect, useXConnection, useXConnectors, useXDisconnect } from '@sodax/wallet-sdk-react';
import { Button } from '@/components/ui/button';

export type WalletItemProps = {
  name: string;
  xChainType: ChainType;
  /**
   * Optional callback to close the wallet modal after successful connection.
   * Used to auto-close the modal when a wallet is connected.
   */
  onConnectionSuccess?: () => void;
};

export function shortenAddress(address: string, chars = 7): string {
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

const WalletItem = ({ name, xChainType, onConnectionSuccess }: WalletItemProps) => {
  const xConnection = useXConnection(xChainType);
  const { address } = useXAccount(xChainType);

  const [connectingXConnector, setConnectingXConnector] = useState<XConnector | null>(null);
  const [wasConnecting, setWasConnecting] = useState(false);

  const xConnectors = useXConnectors(xChainType);
  const { mutateAsync: xConnect, isPending } = useXConnect();
  const xDisconnect = useXDisconnect();

  const handleConnect = useCallback(
    async (xConnector: XConnector) => {
      setConnectingXConnector(xConnector);
      setWasConnecting(true);
      try {
        await xConnect(xConnector);
        // Address will be updated via useXAccount hook, useEffect will handle closing
      } catch (error) {
        console.error(error);
        setWasConnecting(false);
      } finally {
        setConnectingXConnector(null);
      }
    },
    [xConnect],
  );

  // Auto-close modal when address becomes available after a connection attempt
  // This provides smooth UX: user connects wallet → modal closes automatically → user returns to borrow modal
  useEffect(() => {
    if (wasConnecting && address && onConnectionSuccess) {
      setWasConnecting(false);
      // Small delay to allow UI to update and show connected state
      const timeoutId = setTimeout(() => {
        onConnectionSuccess();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [address, wasConnecting, onConnectionSuccess]);

  const handleDisconnect = useCallback(() => {
    setConnectingXConnector(null);
    xDisconnect(xChainType);
  }, [xDisconnect, xChainType]);

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
      <div className="w-[76px] text-right text-black text-xs font-bold leading-none">{name}</div>

      <div className="flex flex-wrap justify-start gap-2 grow">
        {address ? (
          <div className="flex justify-between items-center w-full">
            <div className="cursor-pointer w-10 h-10 p-1 bg-white rounded-[11px] justify-center items-center inline-flex">
              <img src={activeXConnector?.icon} className="w-full h-full rounded-lg" />
            </div>
            <div className="flex gap-1 lowercase">
              {/* <CopyableAddress account={address} /> */}
              <span>{shortenAddress(address, 4)}</span>
              <div className="text-body cursor-pointer" onClick={handleDisconnect}>
                <XIcon />
              </div>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default WalletItem;
