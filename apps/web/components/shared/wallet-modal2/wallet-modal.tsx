import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import Image from 'next/image';
import { useModalOpen, useModalStore } from '@/stores/modal-store-provider';
import { MODAL_ID } from '@/stores/modal-store';
import { ChainItem } from './chain-item';
import type { ChainId, ChainType } from '@sodax/types';
import { Separator } from '@/components/ui/separator';
import { XIcon } from 'lucide-react';
import { ArrowLeftIcon } from 'lucide-react';
import { useXConnectors, useXAccounts, useXAccount } from '@sodax/wallet-sdk-react';
import { WalletItem } from './wallet-item';
import { AllSupportItem } from './all-support-item';
import { isRegisteredUser } from '@/apis/users';
import { getChainIcon, getChainName } from '@/constants/chains';
import { useIsHanaInstalled } from '@/hooks/useIsHanaInstalled';
import { useConnectAllWithHana } from '@/hooks/useConnectAllWithHana';
import { useConnectRestWithHana } from '@/hooks/useConnectRestWithHana';
import { useDisconnectAllWithHana } from '@/hooks/useDisconnectAllWithHana';
import { ConnectAllWithHana } from './hana/connect-all-with-hana';
import { InstallHanaBanner } from './hana/install-hana-banner';
import { GetHanaForChain } from './hana/get-hana-for-chain';
import { DisconnectAll } from './hana/disconnect-all';
import { cn } from '@/lib/utils';

type WalletModalProps = {
  modalId?: MODAL_ID;
};

type ChainGroup = {
  name: string;
  chainType: ChainType;
  icon: string;
};

export const chainGroups: ChainGroup[] = [
  {
    name: 'EVM',
    chainType: 'EVM',
    icon: '/coin/s1.png',
  },
  {
    name: 'ICON',
    chainType: 'ICON',
    icon: '/chain/0x1.icon.png',
  },
  // {
  //   name: 'Injective',
  //   chainType: 'INJECTIVE',
  //   icon: '/chain/injective-1.png',
  // },
  {
    name: 'Solana',
    chainType: 'SOLANA',
    icon: '/chain/solana.png',
  },
  {
    name: 'Sui',
    chainType: 'SUI',
    icon: '/chain/sui.png',
  },
  {
    name: 'Stellar',
    chainType: 'STELLAR',
    icon: '/chain/stellar.png',
  },
];

const getChainTypeName = (chainType: ChainType): string => {
  return chainGroups.find(chainGroup => chainGroup.chainType === chainType)?.name || '';
};

export const chainGroupMap: { [key in ChainType]: ChainGroup } = chainGroups.reduce(
  (acc, chainGroup) => {
    acc[chainGroup.chainType] = chainGroup;
    return acc;
  },
  {} as { [key in ChainType]: ChainGroup },
);

export const WalletModal = ({ modalId = MODAL_ID.WALLET_MODAL }: WalletModalProps) => {
  const open = useModalOpen(modalId);
  const closeModal = useModalStore(state => state.closeModal);
  const openModal = useModalStore(state => state.openModal);

  const [activeXChainType, setActiveXChainType] = useState<ChainType | undefined>(undefined);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [hoveredChainType, setHoveredChainType] = useState<ChainType | undefined>(undefined);
  const [hoveredWalletId, setHoveredWalletId] = useState<string | undefined>(undefined);
  const isHanaInstalled = useIsHanaInstalled();
  const xConnectors = useXConnectors(activeXChainType);
  const xAccounts = useXAccounts();
  const { connectAll, isPending: isConnectingAll } = useConnectAllWithHana();
  const { connectRest, isPending: isConnectingRest } = useConnectRestWithHana();
  const { disconnectAll, isPending: isDisconnectingAll } = useDisconnectAllWithHana();

  const connectedCount = useMemo(() => {
    return Object.values(xAccounts).filter(a => !!a?.address).length;
  }, [xAccounts]);

  const isAnyTwoChainsConnected = connectedCount >= 2;

  const isPossibleToConnectRest = connectedCount === 1 && connectedCount < 5 && isHanaInstalled;

  const showConnectAllWithHana = isHanaInstalled && connectedCount === 0;

  // Show "Disconnect All with Hana" when Hana is installed and all chains are connected
  const showDisconnectAll = isAnyTwoChainsConnected;

  const handleConnectAllWithHana = async (): Promise<void> => {
    const result = await connectAll();
    if (result.successful.length > 0) {
      handleClose();
    }
  };

  const handleConnectRestWithHana = async (): Promise<void> => {
    const result = await connectRest();
    if (result.successful.length > 0) {
      handleClose();
    }
  };

  const handleDisconnectAll = async (): Promise<void> => {
    await disconnectAll();
  };

  const modalData = useModalStore(state => state.modals[modalId]?.modalData) as
    | { primaryChainType: ChainType; xChainId?: ChainId; isExpanded: boolean }
    | undefined;
  const xAccount = useXAccount(modalData?.primaryChainType);
  const isConnected = Boolean(xAccount?.address);

  const handleToggleExpanded = (expanded: boolean): void => {
    setIsExpanded(expanded);
  };

  const handleClose = () => {
    setIsExpanded(false);
    closeModal(modalId);
    setActiveXChainType(undefined);
  };

  const chainName = modalData?.xChainId ? getChainName(modalData.xChainId) : '';

  const title = isConnected ? `${chainName} connected` : `Connect ${chainName}`;

  const selectedChainIcon = modalData?.xChainId ? getChainIcon(modalData.xChainId) : undefined;

  const primaryChainGroups = useMemo(
    () => chainGroups.filter(chainGroup => chainGroup.chainType === (modalData?.primaryChainType || 'EVM')),
    [modalData?.primaryChainType],
  );

  const sortedXConnectors = useMemo(() => {
    const hanaXConnector = xConnectors.find(xConnector => xConnector.name.toLowerCase().includes('hana'));
    if (hanaXConnector) {
      return [hanaXConnector, ...xConnectors.filter(xConnector => !xConnector.name.toLowerCase().includes('hana'))];
    }
    return xConnectors;
  }, [xConnectors]);

  const isNoWalletFound = useMemo(() => {
    return sortedXConnectors.length === 0 && activeXChainType;
  }, [sortedXConnectors, activeXChainType]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          'max-w-full w-full md:max-w-[480px] p-0 w-[90%] shadow-none bg-vibrant-white overflow-hidden',
          // !modalData?.primaryChainType && !isHanaInstalled && 'min-h-131',
          // !modalData?.primaryChainType && isHanaInstalled && 'min-h-126',
          !isHanaInstalled && 'min-h-131',
          isHanaInstalled && 'min-h-126',
        )}
        hideCloseButton={true}
      >
        <div className="flex flex-col h-full h-full pt-12 px-12 pb-8 space-y-4">
          {activeXChainType ? (
            <>
              <DialogTitle>
                <div className="flex flex-row justify-between items-center gap-3">
                  <div
                    data-property-1="Left default"
                    className="w-6 h-6 rounded-full shrink-0 bg-cream-white hover:bg-cherry-bright hover:text-white inline-flex justify-center items-center cursor-pointer transition-colors duration-200"
                    onClick={() => setActiveXChainType(undefined)}
                  >
                    <ArrowLeftIcon className="w-3 h-3" />
                  </div>

                  {!isNoWalletFound ? (
                    <div className="text-right justify-end text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] leading-none">
                      Connect <span className="inline-block">{getChainTypeName(activeXChainType)}</span> wallet
                    </div>
                  ) : (
                    <div className="flex flex-row justify-between items-center w-full">
                      <div className="text-(length:--body-comfortable) font-medium font-['InterRegular'] text-clay">
                        No <span className="inline-block">{getChainTypeName(activeXChainType)}</span> wallet found
                      </div>
                      <DialogClose asChild>
                        <XIcon className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay" />
                      </DialogClose>
                    </div>
                  )}
                </div>
              </DialogTitle>
              <div className="w-full flex flex-col">
                <Separator className="h-1 bg-clay opacity-30" />
                {isNoWalletFound && <GetHanaForChain chainType={activeXChainType} />}
                {sortedXConnectors.map(xConnector => (
                  <React.Fragment key={xConnector.id}>
                    <WalletItem
                      xConnector={xConnector}
                      hoveredWalletId={hoveredWalletId}
                      setHoveredWalletId={setHoveredWalletId}
                      onSuccess={async (_xConnector, xAccount) => {
                        setActiveXChainType(undefined);
                        if (xAccount.xChainType === 'STELLAR' || xAccount.xChainType === 'ICON') {
                          return;
                        }
                        if (!xAccount.address) {
                          return;
                        }
                        const isRegistered = await isRegisteredUser({
                          address: xAccount.address,
                          chainType: xConnector.xChainType,
                        });
                        if (!isRegistered) {
                          openModal(MODAL_ID.TERMS_CONFIRMATION_MODAL, { chainType: xConnector.xChainType });
                        }
                      }}
                    />
                  </React.Fragment>
                ))}
              </div>
            </>
          ) : !(isExpanded || modalData?.isExpanded) ? (
            <>
              <DialogTitle className="flex w-full justify-between items-center h-6">
                <div className="inline-flex justify-center items-center gap-2">
                  <Image
                    src="/symbol_dark.png"
                    alt="SODAX Symbol"
                    width={16}
                    height={16}
                    className="mix-blend-multiply"
                  />
                  <div className="flex-1 justify-center text-espresso text-base font-['InterBold'] leading-snug text-(length:--body-super-comfortable)">
                    {title}
                  </div>
                </div>
                <DialogClose asChild>
                  <XIcon className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay" />
                </DialogClose>
              </DialogTitle>
              <div className=" justify-start text-clay-light font-medium font-['InterRegular'] leading-tight text-(length:--body-comfortable)">
                {isConnected
                  ? "You're also auto-connected to other EVM networks."
                  : 'You will need to connect your wallet to proceed.'}
              </div>

              <div>
                <Separator className="h-1 bg-clay opacity-30" />
                <div className="w-full flex flex-col">
                  {primaryChainGroups.map(chainGroup => (
                    <React.Fragment key={chainGroup.chainType}>
                      <ChainItem
                        key={chainGroup.chainType}
                        chainType={chainGroup.chainType}
                        setActiveXChainType={setActiveXChainType}
                        setHoveredChainType={setHoveredChainType}
                        hoveredChainType={hoveredChainType}
                        selectedChainIcon={selectedChainIcon}
                        onSuccess={async (_xConnector, xAccount) => {
                          if (xAccount.xChainType === 'STELLAR' || xAccount.xChainType === 'ICON') {
                            return;
                          }
                          if (!xAccount.address) {
                            return;
                          }
                          const isRegistered = await isRegisteredUser({
                            address: xAccount.address,
                            chainType: chainGroup.chainType,
                          });
                          if (!isRegistered) {
                            openModal(MODAL_ID.TERMS_CONFIRMATION_MODAL, { chainType: chainGroup.chainType });
                          }
                        }}
                      />
                    </React.Fragment>
                  ))}
                </div>
                <Separator className="h-1 bg-clay opacity-30" />
                <AllSupportItem onToggleExpanded={handleToggleExpanded} isExpanded={isExpanded} />
                <Separator className="h-1 bg-clay opacity-30" />
              </div>

              <div className=" justify-start flex gap-1 text-(length:--body-comfortable)">
                <span className="text-clay-light font-medium font-['InterRegular'] leading-tight">
                  Need help? Check our guide{' '}
                </span>
                <span className="text-clay-light font-medium font-['InterRegular'] underline leading-tight cursor-pointer hover:font-bold">
                  here
                </span>
              </div>
            </>
          ) : (
            <>
              <DialogTitle className="flex w-full justify-end">
                <DialogClose asChild className="h-6">
                  <XIcon className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay" />
                </DialogClose>
              </DialogTitle>
              {/* Connect All with Hana */}
              {showConnectAllWithHana && (
                <ConnectAllWithHana
                  onClick={handleConnectAllWithHana}
                  isPending={isConnectingAll}
                  isPossibleToConnectRest={false}
                />
              )}

              {isPossibleToConnectRest && (
                <ConnectAllWithHana
                  onClick={handleConnectRestWithHana}
                  isPending={isConnectingRest}
                  isPossibleToConnectRest={true}
                />
              )}

              {/* Disconnect All */}
              {showDisconnectAll && <DisconnectAll onClick={handleDisconnectAll} isPending={isDisconnectingAll} />}
              <div className="w-full flex flex-col -mt-4">
                {chainGroups.map((chainGroup, index) => (
                  <React.Fragment key={chainGroup.chainType}>
                    <ChainItem
                      chainType={chainGroup.chainType}
                      setActiveXChainType={setActiveXChainType}
                      setHoveredChainType={setHoveredChainType}
                      hoveredChainType={hoveredChainType}
                      onSuccess={async (_xConnector, xAccount) => {
                        if (xAccount.xChainType === 'STELLAR' || xAccount.xChainType === 'ICON') {
                          return;
                        }
                        if (!xAccount.address) {
                          return;
                        }
                        const isRegistered = await isRegisteredUser({
                          address: xAccount.address,
                          chainType: chainGroup.chainType,
                        });
                        if (!isRegistered) {
                          openModal(MODAL_ID.TERMS_CONFIRMATION_MODAL, { chainType: chainGroup.chainType });
                        }
                      }}
                    />
                    {index < chainGroups.length - 1 && <Separator className="h-1 bg-clay opacity-30" />}
                  </React.Fragment>
                ))}
              </div>
            </>
          )}

          {/* Hana wallet installation banner */}
          {isHanaInstalled === false && (
            <div className="mt-auto">
              <InstallHanaBanner />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletModal;
