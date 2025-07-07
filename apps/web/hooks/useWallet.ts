'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { sonic } from '../config/web3';
import { useState, useEffect, useCallback } from 'react';
import { registerWallet as registerWalletService, checkWalletRegistration } from '../services/wallet';

type NotificationType = 'success' | 'error' | 'warning' | null;

export function useWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [isRegistering, setIsRegistering] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [notification, setNotification] = useState<{ type: NotificationType; message: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle notification timeout in useEffect to avoid hydration issues
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = useCallback((type: NotificationType, message: string) => {
    setNotification({ type, message });
  }, []);

  const registerWallet = useCallback(
    async (walletAddress: string) => {
      setIsRegistering(true);
      try {
        await registerWalletService(walletAddress);
        setIsRegistered(true);
        // showNotification('success', 'Wallet registered successfully!');
      } catch (error) {
        console.error('Error registering wallet:', error);
        if (error instanceof Error && error.message.includes('E11000 duplicate key error')) {
          setIsRegistered(true);
          // showNotification('warning', 'Wallet exists already.');
        } else {
          // showNotification('error', 'Failed to register wallet. Please try again.');
        }
        throw error;
      } finally {
        setIsRegistering(false);
      }
    },
    [showNotification],
  );

  const checkRegistration = useCallback(async (walletAddress: string) => {
    setIsCheckingRegistration(true);
    try {
      const registered = await checkWalletRegistration(walletAddress);
      setIsRegistered(registered);
      return registered;
    } catch (error) {
      console.error('Error checking registration:', error);
      return false;
    } finally {
      setIsCheckingRegistration(false);
    }
  }, []);

  // Watch for address changes and check registration when connected
  useEffect(() => {
    if (isConnected && address) {
      registerWallet(address);
      // checkRegistration(address);
    } else {
      setIsRegistered(false);
    }
  }, [isConnected, address, checkRegistration, registerWallet]);

  const handleWalletClick = async () => {
    if (isConnected && address) {
      try {
        // Switch to Sonic network if needed
        if (chainId !== sonic.id) {
          await switchChain({ chainId: sonic.id });
        }

        // Check if wallet is registered
        const registered = await checkRegistration(address);

        // Return the registration status so the component can decide what to do
        return { isRegistered: registered, address };
      } catch (error) {
        console.error('Failed to switch network:', error);
        showNotification('error', 'Failed to switch network. Please try again.');
        throw error;
      }
    }
  };

  return {
    address,
    isConnected,
    isRegistering,
    isCheckingRegistration,
    isRegistered,
    notification,
    mounted,
    handleWalletClick,
    registerWallet,
  };
}
