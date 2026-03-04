// apps/web/hooks/useActivateStellarAccount.ts
import { type StellarXService, useXService } from '@sodax/wallet-sdk-react';
import { BASE_FEE, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { useCallback, useState } from 'react';

const SPONSOR_URL = 'https://ciihnqaqiomjdoicuy5rgwmy5m0vxanz.lambda-url.us-east-1.on.aws';
const SPONSORING_ADDRESS = 'GCV5PJ4H57MZFRH5GM3E3CNFLWQURNFNIHQOYGRQ7JHGWJLAR2SFVZO6';

interface ActivateStellarAccountParams {
  address: string;
}

export const useActivateStellarAccount = (): {
  activateStellarAccount: (params: ActivateStellarAccountParams) => Promise<void>;
  isLoading: boolean;
  isActivated: boolean;
} => {
  const stellarXService = useXService('STELLAR') as StellarXService;
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isActivated, setIsActivated] = useState<boolean>(false);

  const activateStellarAccount = useCallback(
    async ({ address }: ActivateStellarAccountParams): Promise<void> => {
      if (!stellarXService) {
        throw new Error('Stellar service not available');
      }

      setIsLoading(true);
      try {
        const sourceAccount = await stellarXService.server.loadAccount(SPONSORING_ADDRESS);

        // Create the transaction to sponsor the user account creation
        const transaction = new TransactionBuilder(sourceAccount, {
          fee: BASE_FEE,
          networkPassphrase: Networks.PUBLIC,
        })
          .addOperation(
            Operation.beginSponsoringFutureReserves({
              source: SPONSORING_ADDRESS,
              sponsoredId: address,
            }),
          )
          .addOperation(
            Operation.createAccount({
              destination: address,
              startingBalance: '0',
            }),
          )
          .addOperation(
            Operation.endSponsoringFutureReserves({
              source: address,
            }),
          )
          .setTimeout(180)
          .build();

        const { signedTxXdr: signedTx } = await stellarXService.walletsKit.signTransaction(transaction.toXDR(), {
          networkPassphrase: Networks.PUBLIC,
        });

        const response = await fetch(SPONSOR_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: signedTx }),
        });

        if (!response.ok) {
          throw new Error('Failed to activate Stellar account');
        }

        setIsActivated(true);
      } catch (error) {
        console.error('Error activating Stellar account:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [stellarXService],
  );

  return {
    activateStellarAccount,
    isLoading,
    isActivated,
  };
};
