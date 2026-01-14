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
import { useXConnectors } from '@sodax/wallet-sdk-react';
import { WalletItem } from './wallet-item';
import { AllSupportItem } from './all-support-item';
import { isRegisteredUser } from '@/apis/users';
import { getChainIcon, getChainName } from '@/constants/chains';

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
  const xConnectors = useXConnectors(activeXChainType);

  const handleToggleExpanded = (expanded: boolean): void => {
    setIsExpanded(expanded);
  };

  const handleClose = () => {
    setIsExpanded(false);
    closeModal(modalId);
    setActiveXChainType(undefined);
  };

  const modalData = useModalStore(state => state.modals[modalId]?.modalData) as
    | { primaryChainType: ChainType; xChainId?: ChainId; isExpanded: boolean }
    | undefined;

  const selectedChainIcon = modalData?.xChainId ? getChainIcon(modalData.xChainId) : undefined;

  const title = modalData?.xChainId && `Connect ${getChainName(modalData.xChainId)}`;

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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-full w-full md:max-w-[480px] pt-12 px-12 pb-8 w-[90%] shadow-none bg-vibrant-white gap-4"
        hideCloseButton
      >
        {activeXChainType ? (
          <>
            <DialogTitle>
              <div className="flex flex-row justify-between items-center">
                <div
                  data-property-1="Left default"
                  className="w-6 h-6 bg-cream-white hover:bg-cherry-bright hover:text-white rounded-[80px] inline-flex justify-center items-center cursor-pointer transition-colors duration-200"
                  onClick={() => setActiveXChainType(undefined)}
                >
                  <ArrowLeftIcon className="w-3 h-3" />
                </div>
                <div className="flex flex-row justify-between items-center gap-4">
                  <div className="text-right justify-end text-clay-light text-(length:--body-small) font-medium font-['InterRegular'] leading-none">
                    Connect your {activeXChainType} wallet
                  </div>
                  <DialogClose asChild>
                    <XIcon className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay" />
                  </DialogClose>
                </div>
              </div>
            </DialogTitle>
            <div className="w-full flex flex-col">
              <Separator className="h-1 bg-clay opacity-30" />
              {sortedXConnectors.map(xConnector => (
                <React.Fragment key={xConnector.id}>
                  <WalletItem
                    xConnector={xConnector}
                    hoveredWalletId={hoveredWalletId}
                    setHoveredWalletId={setHoveredWalletId}
                    onSuccess={async (_xConnector, xAccount) => {
                      setActiveXChainType(undefined);
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
            <DialogTitle className="flex w-full justify-between items-center">
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
              You will need to connect your wallet to proceed.
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
              <DialogClose asChild>
                <XIcon className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay" />
              </DialogClose>
            </DialogTitle>
            <div className="w-full flex flex-col -mt-4">
              {chainGroups.map((chainGroup, index) => (
                <React.Fragment key={chainGroup.chainType}>
                  <ChainItem
                    chainType={chainGroup.chainType}
                    setActiveXChainType={setActiveXChainType}
                    setHoveredChainType={setHoveredChainType}
                    hoveredChainType={hoveredChainType}
                    onSuccess={async (_xConnector, xAccount) => {
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
      </DialogContent>
    </Dialog>
  );
};

export default WalletModal;
