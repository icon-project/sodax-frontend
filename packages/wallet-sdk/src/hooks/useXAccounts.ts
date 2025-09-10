import { useMemo, useRef, useCallback } from 'react';

import type { ChainType } from '@sodax/types';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount, useConnections } from 'wagmi';

import type { XAccount } from '../types';
import { useXWagmiStore } from '../useXWagmiStore';

// Stable reference to prevent unnecessary re-renders
const EMPTY_ACCOUNTS: Partial<Record<ChainType, XAccount>> = {};

export function useXAccounts(): Partial<Record<ChainType, XAccount>> {
  const xChainTypes = useXWagmiStore(state => Object.keys(state.xServices));
  const xConnections = useXWagmiStore(state => state.xConnections);
  const { address: evmAddress, isConnected: evmIsConnected } = useAccount();
  const evmConnections = useConnections();
  const suiAccount = useCurrentAccount();
  const solanaWallet = useWallet();

  // Use ref to maintain stable reference and prevent unnecessary re-computations
  const previousAccountsRef = useRef<Partial<Record<ChainType, XAccount>>>(EMPTY_ACCOUNTS);
  const stableEvmAddressRef = useRef<string | undefined>(undefined);
  const stableSuiAddressRef = useRef<string | undefined>(undefined);
  const stableSolanaAddressRef = useRef<string | undefined>(undefined);

  // Stable connection check for EVM
  const isEvmStable = useCallback((): boolean => {
    const currentAddress = evmAddress;
    const previousAddress = stableEvmAddressRef.current;

    // Only update if address actually changed and is valid
    if (currentAddress && currentAddress !== previousAddress) {
      stableEvmAddressRef.current = currentAddress;
      return true;
    }

    // If address is undefined but was previously set, keep the previous value for stability
    if (!currentAddress && previousAddress) {
      return false; // Keep previous stable state
    }

    return currentAddress === previousAddress;
  }, [evmAddress]);

  // Stable connection check for SUI
  const isSuiStable = useCallback((): boolean => {
    const currentAddress = suiAccount?.address;
    const previousAddress = stableSuiAddressRef.current;

    if (currentAddress && currentAddress !== previousAddress) {
      stableSuiAddressRef.current = currentAddress;
      return true;
    }

    if (!currentAddress && previousAddress) {
      return false; // Keep previous stable state
    }

    return currentAddress === previousAddress;
  }, [suiAccount?.address]);

  // Stable connection check for Solana
  const isSolanaStable = useCallback((): boolean => {
    const currentAddress = solanaWallet.publicKey?.toString();
    const previousAddress = stableSolanaAddressRef.current;

    if (currentAddress && currentAddress !== previousAddress) {
      stableSolanaAddressRef.current = currentAddress;
      return true;
    }

    if (!currentAddress && previousAddress) {
      return false; // Keep previous stable state
    }

    return currentAddress === previousAddress;
  }, [solanaWallet.publicKey]);

  const xAccounts = useMemo((): Partial<Record<ChainType, XAccount>> => {
    const result: Partial<Record<ChainType, XAccount>> = {};

    // Process X-chain connections from store (most stable)
    for (const xChainType of xChainTypes) {
      const xConnection = xConnections[xChainType];

      if (xConnection?.xAccount?.address) {
        result[xChainType] = xConnection.xAccount;
      } else {
        result[xChainType] = {
          address: undefined,
          xChainType,
        };
      }
    }

    // Add EVM account only if connection is stable and valid
    if (evmIsConnected && evmAddress && isEvmStable()) {
      result['EVM'] = {
        address: evmAddress,
        xChainType: 'EVM',
      };
    } else if (stableEvmAddressRef.current && !evmAddress) {
      // Keep previous stable address if current is undefined (prevents flickering)
      result['EVM'] = {
        address: stableEvmAddressRef.current,
        xChainType: 'EVM',
      };
    }

    // Add SUI account only if connection is stable and valid
    if (suiAccount?.address && isSuiStable()) {
      result['SUI'] = {
        address: suiAccount.address,
        xChainType: 'SUI',
      };
    } else if (stableSuiAddressRef.current && !suiAccount?.address) {
      // Keep previous stable address if current is undefined
      result['SUI'] = {
        address: stableSuiAddressRef.current,
        xChainType: 'SUI',
      };
    }

    // Add Solana account only if connection is stable and valid
    if (solanaWallet.connected && solanaWallet.publicKey && isSolanaStable()) {
      result['SOLANA'] = {
        address: solanaWallet.publicKey.toString(),
        xChainType: 'SOLANA',
      };
    } else if (stableSolanaAddressRef.current && !solanaWallet.publicKey) {
      // Keep previous stable address if current is undefined
      result['SOLANA'] = {
        address: stableSolanaAddressRef.current,
        xChainType: 'SOLANA',
      };
    }

    // Only update if there are actual changes to prevent unnecessary re-renders
    const hasChanges =
      Object.keys(result).some(
        key => result[key as ChainType]?.address !== previousAccountsRef.current[key as ChainType]?.address,
      ) ||
      Object.keys(previousAccountsRef.current).some(
        key => !result[key as ChainType]?.address && previousAccountsRef.current[key as ChainType]?.address,
      );

    if (hasChanges) {
      previousAccountsRef.current = { ...result };
    }

    return previousAccountsRef.current;
  }, [
    xChainTypes,
    xConnections,
    evmAddress,
    evmIsConnected,
    suiAccount?.address,
    solanaWallet.connected,
    solanaWallet.publicKey,
    isEvmStable,
    isSuiStable,
    isSolanaStable,
  ]);

  return xAccounts;
}
