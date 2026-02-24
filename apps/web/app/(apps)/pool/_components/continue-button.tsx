'use client';

import type React from 'react';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useModalStore } from '@/stores/modal-store-provider';
import { MODAL_ID } from '@/stores/modal-store';
import { usePoolState, usePoolActions } from '../_stores/pool-store-provider';
import { MOCK_POOL_PAIR } from '../_mocks';
import { useXAccount, useXBalances, getXChainType } from '@sodax/wallet-sdk-react';
import { formatTokenAmount } from '@/lib/utils';
import { chainIdToChainName } from '@/providers/constants';
import type { SpokeChainId } from '@sodax/types';

export function ContinueButton(): React.JSX.Element {
  const router = useRouter();
  const openModal = useModalStore(state => state.openModal);
  const { selectedChainId, token0Amount, token1Amount, minPrice, maxPrice } = usePoolState();
  const { setIsDialogOpen } = usePoolActions();

  const pair = MOCK_POOL_PAIR;

  // Wallet state
  const { address } = useXAccount(selectedChainId || undefined);
  const walletConnected = !!address;

  const { data: balances } = useXBalances({
    xChainId: selectedChainId || 'sonic',
    xTokens: selectedChainId
      ? [
          { ...pair.token0, xChainId: selectedChainId },
          { ...pair.token1, xChainId: selectedChainId },
        ]
      : [],
    address,
  });

  const token0Balance = balances?.[pair.token0.address] ?? 0n;
  const token1Balance = balances?.[pair.token1.address] ?? 0n;

  const formattedToken0Balance = formatTokenAmount(token0Balance, pair.token0.decimals);
  const formattedToken1Balance = formatTokenAmount(token1Balance, pair.token1.decimals);

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

    // No balance
    if (token0Balance === 0n && token1Balance === 0n) {
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
    token0Balance,
    token1Balance,
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
      className="w-full h-12 rounded-lg text-sm font-semibold font-['InterRegular']"
      disabled={buttonState.disabled}
      onClick={handleClick}
    >
      {buttonState.label}
    </Button>
  );
}
