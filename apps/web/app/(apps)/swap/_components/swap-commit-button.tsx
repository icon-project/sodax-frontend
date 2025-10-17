'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { ChainType } from '@sodax/types';
import { useEvmSwitchChain, useXAccount } from '@sodax/wallet-sdk-react';
import { getXChainType } from '@sodax/wallet-sdk-react';
import { chainIdToChainName } from '@/providers/constants';
import { useSwapState } from '../_stores/swap-store-provider';
import { MODAL_ID } from '@/stores/modal-store';
import { useModalStore } from '@/stores/modal-store-provider';
import { validateChainAddress } from '@/lib/utils';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Result } from '@sodax/sdk';
import type { SolverIntentQuoteResponse, SolverErrorResponse } from '@sodax/sdk';

export default function SwapCommitButton({
  quoteQuery,
  handleReview,
}: {
  quoteQuery: UseQueryResult<Result<SolverIntentQuoteResponse, SolverErrorResponse> | undefined>;
  handleReview: () => void;
}) {
  const openModal = useModalStore(state => state.openModal);

  const { sourceToken, destinationToken, sourceAmount, isSwapAndSend, customDestinationAddress, slippageTolerance } =
    useSwapState();

  const { address: sourceAddress } = useXAccount(sourceToken.xChainId);
  const { address: destinationAddress } = useXAccount(destinationToken.xChainId);

  const isSourceChainConnected = sourceAddress !== undefined;
  const isDestinationChainConnected = destinationAddress !== undefined;

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(sourceToken.xChainId);

  const isQuoteUnavailable = quoteQuery.data?.ok === false;
  const isConnected = isSourceChainConnected && (isDestinationChainConnected || isSwapAndSend);
  const inputError = useMemo(() => {
    if (sourceAmount === '0' || sourceAmount === '') {
      return 'Enter Amount';
    }
    if (isSwapAndSend && customDestinationAddress === '') {
      return 'Enter destination address';
    }
    if (
      isSwapAndSend &&
      !validateChainAddress(customDestinationAddress, getXChainType(destinationToken.xChainId) || '')
    ) {
      return 'Address is not valid';
    }
    return null;
  }, [sourceAmount, isSwapAndSend, customDestinationAddress, destinationToken.xChainId]);

  const sourceChainType = getXChainType(sourceToken.xChainId);
  const destinationChainType = getXChainType(destinationToken.xChainId);

  const getTargetChainType = (): ChainType | undefined => {
    if (!sourceAddress) {
      return sourceChainType;
    }

    if (!destinationAddress) {
      return destinationChainType;
    }

    return undefined;
  };

  const handleOpenWalletModal = (): void => {
    openModal(MODAL_ID.WALLET_MODAL, { primaryChainType: getTargetChainType() });
  };

  return (
    <>
      {isQuoteUnavailable ? (
        <Button variant="cherry" className="w-full md:w-[232px] text-(length:--body-comfortable) text-white" disabled>
          Quote unavailable
        </Button>
      ) : !isConnected ? (
        <Button
          variant="cherry"
          className="w-full md:w-[232px] text-(length:--body-comfortable) text-white"
          onClick={handleOpenWalletModal}
        >
          Connect{' '}
          {!isSourceChainConnected
            ? chainIdToChainName(sourceToken.xChainId)
            : chainIdToChainName(destinationToken.xChainId)}
        </Button>
      ) : isWrongChain ? (
        <Button
          variant="cherry"
          className="w-full md:w-[232px] text-(length:--body-comfortable) text-white"
          onClick={handleSwitchChain}
        >
          Switch to {chainIdToChainName(sourceToken.xChainId)}
        </Button>
      ) : inputError ? (
        <Button variant="cherry" className="w-full md:w-[232px] text-(length:--body-comfortable) text-white" disabled>
          {inputError}
        </Button>
      ) : (
        <Button
          variant="cherry"
          className="w-full md:w-[232px] text-(length:--body-comfortable) text-white"
          onClick={handleReview}
        >
          Review
        </Button>
      )}
    </>
  );
}
