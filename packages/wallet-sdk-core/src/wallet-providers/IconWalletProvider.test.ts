import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IconWalletProvider, type IconWalletConfig } from './IconWalletProvider.js';

describe('IconWalletProvider', () => {
  const mockRpcUrl = 'https://ctz.solidwallet.io/api/v3';
  const mockPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const mockWalletAddress = 'hx1234567890abcdef1234567890abcdef12345678';
  // const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with private key wallet config', () => {
      const provider = new IconWalletProvider({
        privateKey: mockPrivateKey,
        rpcUrl: mockRpcUrl,
      });

      expect(provider.iconService).toBeDefined();
    });

    it('should initialize with browser extension wallet config', () => {
      const provider = new IconWalletProvider({
        walletAddress: mockWalletAddress,
        rpcUrl: mockRpcUrl,
      });

      expect(provider.iconService).toBeDefined();
    });

    it('should throw error for invalid wallet config', () => {
      expect(() => {
        new IconWalletProvider({} as IconWalletConfig);
      }).toThrow('Invalid Icon wallet config');
    });
  });

  describe('getWalletAddress', () => {
    it('should get wallet address from browser extension wallet', async () => {
      const provider = new IconWalletProvider({
        walletAddress: mockWalletAddress,
        rpcUrl: mockRpcUrl,
      });

      const address = await provider.getWalletAddress();
      expect(address).toBe(mockWalletAddress);
    });

    it('should throw error if wallet is not initialized', async () => {
      const provider = new IconWalletProvider({
        walletAddress: undefined,
        rpcUrl: mockRpcUrl,
      });

      await expect(provider.getWalletAddress()).rejects.toThrow('Wallet not initialized');
    });
  });
});
