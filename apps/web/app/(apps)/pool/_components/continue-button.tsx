'use client';

import type React from 'react';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useModalStore } from '@/stores/modal-store-provider';
import { MODAL_ID } from '@/stores/modal-store';
import { usePoolState, usePoolActions } from '../_stores/pool-store-provider';
import { usePoolContext } from '../_hooks/usePoolContext';
import { getXChainType } from '@sodax/wallet-sdk-react';
import { formatTokenAmount } from '@/lib/utils';
import { chainIdToChainName } from '@/providers/constants';
import type { SpokeChainId } from '@sodax/types';

export function ContinueButton(): React.JSX.Element {
  const router = useRouter();
  const openModal = useModalStore(state => state.openModal);
  const { selectedChainId, token0Amount, token1Amount, minPrice, maxPrice } = usePoolState();
  const { setIsDialogOpen } = usePoolActions();
  const { poolData, walletToken0Balance, walletToken1Balance, spokeAddress } = usePoolContext();

  const walletConnected = !!spokeAddress;

  const token0 = poolData?.token0;
  const token1 = poolData?.token1;

  const formattedToken0Balance = token0 ? formatTokenAmount(walletToken0Balance, token0.decimals) : '0';
  const formattedToken1Balance = token1 ? formatTokenAmount(walletToken1Balance, token1.decimals) : '0';

  const buttonState = useMemo(() => {
    // No network selected
    if (!selectedChainId) {
      return { label: 'Choose a network', disabled: true, action: 'none' as const };
    }

    // Not connected
    if (!walletConnected) {
      const chainName = chainIdToChainName(selectedChainId as SpokeChainId);
      return { label: `Connect ${chainName}`, disabled: false, action: 'connect' as const };
    }

    // No pool data yet
    if (!poolData) {
      return { label: 'Loading pool...', disabled: true, action: 'none' as const };
    }

    // No wallet balance — prompt to buy SODA
    if (walletToken0Balance === 0n && walletToken1Balance === 0n) {
      return { label: 'Buy SODA', disabled: false, action: 'buy' as const };
    }

    // No range set
    if (!minPrice || !maxPrice) {
      return { label: 'Set price range', disabled: true, action: 'none' as const };
    }

    // Invalid range
    if (Number(minPrice) >= Number(maxPrice)) {
      return { label: 'Invalid range', disabled: true, action: 'none' as const };
    }

    // No amounts
    if (!token0Amount && !token1Amount) {
      return { label: 'Enter amounts', disabled: true, action: 'none' as const };
    }

    // Amount exceeds balance
    const t0Exceeds = token0Amount !== '' && Number(token0Amount) > Number(formattedToken0Balance);
    const t1Exceeds = token1Amount !== '' && Number(token1Amount) > Number(formattedToken1Balance);
    if (t0Exceeds || t1Exceeds) {
      return { label: 'Insufficient balance', disabled: true, action: 'none' as const };
    }

    // Valid — ready to continue
    return { label: 'Continue', disabled: false, action: 'continue' as const };
  }, [
    selectedChainId,
    walletConnected,
    poolData,
    walletToken0Balance,
    walletToken1Balance,
    minPrice,
    maxPrice,
    token0Amount,
    token1Amount,
    formattedToken0Balance,
    formattedToken1Balance,
  ]);

  const handleClick = () => {
    switch (buttonState.action) {
      case 'connect': {
        if (!selectedChainId) return;
        const chainType = getXChainType(selectedChainId);
        openModal(MODAL_ID.WALLET_MODAL, {
          isExpanded: false,
          primaryChainType: chainType || 'EVM',
        });
        break;
      }
      case 'buy':
        router.push('/swap');
        break;
      case 'continue':
        setIsDialogOpen(true);
        break;
    }
  };

  return (
    <Button
      variant="cherry"
      className="w-full md:w-auto h-10 px-5 rounded-full text-sm font-semibold font-['InterRegular'] whitespace-nowrap shrink-0 gap-1.5"
      disabled={buttonState.disabled}
      onClick={handleClick}
    >
      {buttonState.label}
      <ArrowRight className="w-4 h-4" />
    </Button>
  );
}
