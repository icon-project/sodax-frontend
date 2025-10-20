'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { ChainType } from '@sodax/types';
import { useEvmSwitchChain, useXAccount, getXChainType } from '@sodax/wallet-sdk-react';
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

  const { inputToken, outputToken, inputAmount, isSwapAndSend, customDestinationAddress, slippageTolerance } =
    useSwapState();

  const { address: sourceAddress } = useXAccount(inputToken.xChainId);
  const { address: destinationAddress } = useXAccount(outputToken.xChainId);

  const isSourceChainConnected = sourceAddress !== undefined;
  const isDestinationChainConnected = destinationAddress !== undefined;

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(inputToken.xChainId);

  const isQuoteUnavailable = quoteQuery.data?.ok === false;
  const isConnected = isSourceChainConnected && (isDestinationChainConnected || isSwapAndSend);
  const inputError = useMemo(() => {
    if (inputAmount === '0' || inputAmount === '') {
      return 'Enter Amount';
    }
    if (isSwapAndSend && customDestinationAddress === '') {
      return 'Enter destination address';
    }
    if (isSwapAndSend && !validateChainAddress(customDestinationAddress, getXChainType(outputToken.xChainId) || '')) {
      return 'Address is not valid';
    }
    return null;
  }, [inputAmount, isSwapAndSend, customDestinationAddress, outputToken.xChainId]);

  const sourceChainType = getXChainType(inputToken.xChainId);
  const destinationChainType = getXChainType(outputToken.xChainId);

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
          {!isSourceChainConnected ? chainIdToChainName(inputToken.xChainId) : chainIdToChainName(outputToken.xChainId)}
        </Button>
      ) : isWrongChain ? (
        <Button
          variant="cherry"
          className="w-full md:w-[232px] text-(length:--body-comfortable) text-white"
          onClick={handleSwitchChain}
        >
          Switch to {chainIdToChainName(inputToken.xChainId)}
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
