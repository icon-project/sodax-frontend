'use client';

import { Button } from '@/components/ui/button';
import { useEvmSwitchChain, useXAccount, getXChainType, useWalletProvider } from '@sodax/wallet-sdk-react';
import { chainIdToChainName } from '@/providers/constants';
import { useSwapInfo } from '../_stores/swap-store-provider';
import { MODAL_ID } from '@/stores/modal-store';
import { useModalStore } from '@/stores/modal-store-provider';
import { validateChainAddress } from '@/lib/utils';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Result, SpokeProvider } from '@sodax/sdk';
import type { SolverIntentQuoteResponse, SolverErrorResponse } from '@sodax/sdk';
import { useValidateStellarAccount } from '@/hooks/useValidateStellarAccount';
import { STELLAR_MAINNET_CHAIN_ID } from '@sodax/types';
import { useActivateStellarAccount } from '@/hooks/useActivateStellarAccount';
import { Loader2 } from 'lucide-react';
import { useRequestTrustline, useSpokeProvider } from '@sodax/dapp-kit';
import { useValidateStellarTrustline } from '@/hooks/useValidateStellarTrustline';
import { getChainName } from '@/constants/chains';

export default function SwapReviewButton({
  quoteQuery,
  handleReview,
}: {
  quoteQuery: UseQueryResult<Result<SolverIntentQuoteResponse, SolverErrorResponse> | undefined>;
  handleReview: () => void;
}) {
  const openModal = useModalStore(state => state.openModal);

  const { inputToken, outputToken, isSwapAndSend, customDestinationAddress, inputError } = useSwapInfo();

  const { address: sourceAddress } = useXAccount(inputToken.xChainId);
  const { address: destinationAddress } = useXAccount(outputToken.xChainId);

  const isSourceChainConnected = sourceAddress !== undefined;
  const isDestinationChainConnected = destinationAddress !== undefined;

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(inputToken.xChainId);

  const isQuoteUnavailable = quoteQuery.data?.ok === false;

  const sourceChainType = getXChainType(inputToken.xChainId);
  const destinationChainType = getXChainType(outputToken.xChainId);

  const finalDestinationAddress = isSwapAndSend ? customDestinationAddress : destinationAddress;

  const { data: stellarAccountValidation } = useValidateStellarAccount(
    outputToken.xChainId === STELLAR_MAINNET_CHAIN_ID ? finalDestinationAddress : undefined,
  );
  const handleActivateStellarAccount = async () => {
    if (!finalDestinationAddress) {
      return;
    }
    await activateStellarAccount({ address: finalDestinationAddress });
  };
  const {
    activateStellarAccount,
    isLoading: isActivatingStellarAccount,
    isActivated: isActivatedStellarAccount,
  } = useActivateStellarAccount();

  // trustline check
  const { data: stellarTrustlineValidation } = useValidateStellarTrustline(
    outputToken.xChainId === STELLAR_MAINNET_CHAIN_ID ? finalDestinationAddress : undefined,
    outputToken,
  );

  const destinationWalletProvider = useWalletProvider(outputToken.xChainId);
  const destinationSpokeProvider = useSpokeProvider(outputToken.xChainId, destinationWalletProvider);

  const {
    requestTrustline,
    isLoading: isRequestingTrustline,
    isRequested: hasTrustline,
  } = useRequestTrustline(outputToken.address);
  const handleRequestTrustline = async () => {
    if (!quoteQuery.data?.ok || !quoteQuery.data.value) {
      return;
    }
    await requestTrustline({
      token: outputToken.address,
      amount: quoteQuery.data.value.quoted_amount,
      spokeProvider: destinationSpokeProvider as SpokeProvider,
    });
  };

  return (
    <>
      {!isSourceChainConnected ? (
        <Button
          variant="cherry"
          className="w-full md:w-[232px] text-(length:--body-comfortable) text-white"
          onClick={() => {
            openModal(MODAL_ID.WALLET_MODAL, {
              primaryChainType: sourceChainType,
              xChainId: inputToken.xChainId,
            });
          }}
        >
          {`Connect ${getChainName(inputToken.xChainId)}`}
        </Button>
      ) : isQuoteUnavailable ? (
        <Button variant="cherry" className="w-full md:w-[232px] text-(length:--body-comfortable) text-white" disabled>
          Quote unavailable
        </Button>
      ) : !isDestinationChainConnected && !isSwapAndSend ? (
        <Button
          variant="cherry"
          className="w-full md:w-[232px] text-(length:--body-comfortable) text-white"
          onClick={() => {
            openModal(MODAL_ID.WALLET_MODAL, { primaryChainType: destinationChainType });
          }}
        >
          {`Connect ${chainIdToChainName(outputToken.xChainId)}`}
        </Button>
      ) : inputError ? (
        <Button variant="cherry" className="w-full md:w-[232px] text-(length:--body-comfortable) text-white" disabled>
          {inputError}
        </Button>
      ) : outputToken.xChainId === STELLAR_MAINNET_CHAIN_ID &&
        !isActivatedStellarAccount &&
        stellarAccountValidation?.ok === false &&
        validateChainAddress(finalDestinationAddress, 'STELLAR') ? (
        <Button
          variant="cherry"
          className="w-full md:w-[232px] text-(length:--body-comfortable) text-white"
          onClick={handleActivateStellarAccount}
          disabled={isActivatingStellarAccount || isSwapAndSend}
        >
          {isActivatingStellarAccount ? 'Activating Stellar Account' : 'Activate Stellar Account'}
          {isActivatingStellarAccount && <Loader2 className="w-4 h-4 animate-spin" />}
        </Button>
      ) : outputToken.xChainId === STELLAR_MAINNET_CHAIN_ID &&
        stellarTrustlineValidation?.ok === false &&
        !hasTrustline &&
        validateChainAddress(finalDestinationAddress || '', 'STELLAR') ? (
        <Button
          variant="cherry"
          className="w-full md:w-[232px] text-(length:--body-comfortable) text-white"
          onClick={handleRequestTrustline}
          disabled={isRequestingTrustline || isSwapAndSend}
        >
          {isRequestingTrustline ? 'Adding Stellar Trustline' : 'Add Stellar Trustline'}
          {isRequestingTrustline && <Loader2 className="w-4 h-4 animate-spin" />}
        </Button>
      ) : isWrongChain ? (
        <Button
          variant="cherry"
          className="w-full md:w-[232px] text-(length:--body-comfortable) text-white"
          onClick={handleSwitchChain}
        >
          Switch to {getChainName(inputToken.xChainId)}
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
