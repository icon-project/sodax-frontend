// Purpose: Unit tests for EvmWalletProvider initialization using real chain IDs and valid config values

import { describe, it, expect, beforeEach } from 'vitest';
import { EvmWalletProvider, type BrowserExtensionEvmWalletConfig, type EvmWalletConfig } from './EvmWalletProvider.js';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sonic } from 'viem/chains';

describe('EvmWalletProvider', () => {
  // Use real chainId and chain config for Sonic Mainnet
  const spokeChainId = SONIC_MAINNET_CHAIN_ID;
  const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as const; // mock private key
  const rpcUrl = sonic.rpcUrls.default.http[0];

  beforeEach(() => {
    // No mocks to clear, but keep for consistency
  });

  describe('constructor', () => {
    it('should initialize with private key wallet config', () => {
      // Arrange
      const config: EvmWalletConfig = {
        privateKey: privateKey,
        chainId: spokeChainId,
        rpcUrl: rpcUrl,
      };

      // Act
      const provider = new EvmWalletProvider(config);

      // Assert
      expect(provider).toBeInstanceOf(EvmWalletProvider);
      expect(provider.publicClient).toBeDefined();
    });

    it('should initialize with browser extension wallet config', () => {
      // Arrange
      const account = privateKeyToAccount(privateKey);
      const walletClient = createWalletClient({
        chain: sonic,
        transport: http(rpcUrl),
        account,
      });
      const publicClient = createPublicClient({
        chain: sonic,
        transport: http(rpcUrl),
      });
      const config: BrowserExtensionEvmWalletConfig = {
        walletClient,
        publicClient,
      };

      // Act
      const provider = new EvmWalletProvider(config);

      // Assert
      expect(provider).toBeInstanceOf(EvmWalletProvider);
      expect(provider.publicClient).toBe(publicClient);
    });

    it('should throw error for invalid wallet config', () => {
      // Arrange
      const config = {} as EvmWalletConfig;

      // Act & Assert
      expect(() => new EvmWalletProvider(config)).toThrow('Invalid EVM wallet config');
    });
  });
});
