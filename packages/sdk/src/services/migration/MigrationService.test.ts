// packages/sdk/src/services/migration/MigrationService.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MigrationService,
  type MigrationParams,
  type IcxCreateRevertMigrationParams,
  type MigrationError,
  type RelayError,
  type RelayErrorCode,
  IconSpokeProvider,
  SonicSpokeProvider,
  EvmHubProvider,
  type EvmHubProviderConfig,
  getHubChainConfig,
  spokeChainConfig,
  SpokeService,
  SonicSpokeService,
  Erc20Service,
  DEFAULT_RELAY_TX_TIMEOUT,
  encodeAddress,
  type EvmRawTransaction,
  type PacketData,
  getIntentRelayChainId,
  type IcxTokenType,
} from '../../index.js';
import { ICON_MAINNET_CHAIN_ID, SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import type { IIconWalletProvider, IEvmWalletProvider } from '@sodax/types';
import * as IntentRelayApiService from '../../services/intentRelay/IntentRelayApiService.js';

const mockEvmAddress = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8' satisfies `0x${string}`;

// Mock payloads and parameters at the top for re-use
const mockMigrationParams: MigrationParams = {
  token: 'ICX',
  icx: 'cx3975b43d260fb8ec802cef6e60c2f4d07486f11d', // wICX address
  amount: 1000000000000000000n, // 1 ICX with 18 decimals
  to: mockEvmAddress,
  action: 'migrate',
} satisfies MigrationParams;

const mockRevertMigrationParams: IcxCreateRevertMigrationParams = {
  amount: 1000000000000000000n, // 1 SODA token with 18 decimals
  to: 'hx742d35cc6634c0532925a3b8d4c9db96c4b4d8b6', // Icon address
  action: 'revert',
} satisfies IcxCreateRevertMigrationParams;

const mockIconWalletProvider = {
  getWalletAddress: vi.fn().mockResolvedValueOnce('hx742d35cc6634c0532925a3b8d4c9db96c4b4d8b6'),
  getWalletAddressBytes: vi
    .fn()
    .mockResolvedValueOnce(encodeAddress(ICON_MAINNET_CHAIN_ID, 'hx742d35cc6634c0532925a3b8d4c9db96c4b4d8b6')),
  sendTransaction: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
} satisfies IIconWalletProvider;

const mockSonicWalletProvider = {
  getWalletAddress: vi.fn().mockResolvedValueOnce(mockEvmAddress),
  getWalletAddressBytes: vi.fn().mockResolvedValueOnce(encodeAddress(SONIC_MAINNET_CHAIN_ID, mockEvmAddress)),
  sendTransaction: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
} satisfies IEvmWalletProvider;

const mockHubConfig: EvmHubProviderConfig = {
  hubRpcUrl: 'https://rpc.soniclabs.com',
  chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
} satisfies EvmHubProviderConfig;

const mockIconSpokeProvider = new IconSpokeProvider(mockIconWalletProvider, spokeChainConfig[ICON_MAINNET_CHAIN_ID]);

const mockSonicSpokeProvider = new SonicSpokeProvider(
  mockSonicWalletProvider,
  spokeChainConfig[SONIC_MAINNET_CHAIN_ID],
);

const mockHubProvider = new EvmHubProvider(mockHubConfig);

const mockTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const mockHubTxHash = '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';

const mockPacketData = {
  src_tx_hash: mockTxHash,
  status: 'pending',
  src_chain_id: Number(getIntentRelayChainId(ICON_MAINNET_CHAIN_ID)),
  src_address: mockIconWalletProvider.getWalletAddress(),
  dst_chain_id: Number(getIntentRelayChainId(SONIC_MAINNET_CHAIN_ID)),
  conn_sn: 1,
  dst_address: mockSonicWalletProvider.getWalletAddress(),
  dst_tx_hash: mockHubTxHash,
  signatures: ['0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'],
  payload: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
} satisfies PacketData;

describe('MigrationService', () => {
  let migrationService: MigrationService;

  beforeEach(() => {
    vi.clearAllMocks();
    migrationService = new MigrationService(mockHubProvider);
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const service = new MigrationService(mockHubProvider);
      expect(service).toBeInstanceOf(MigrationService);
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        relayerApiEndpoint: 'https://custom-relayer.com' as const,
      };
      const service = new MigrationService(mockHubProvider, customConfig);
      expect(service).toBeInstanceOf(MigrationService);
    });
  });

  describe('migrateData', () => {
    it('should return migration data as hex', async () => {
      const result = await migrationService.migrateData(mockMigrationParams);
      expect(typeof result).toBe('string');
      expect(result.startsWith('0x')).toBe(true);
    });
  });

  describe('isAllowanceValid', () => {
    describe('migrate action', () => {
      it('should return true for valid migration params with IconSpokeProvider', async () => {
        const result = await migrationService.isAllowanceValid(mockMigrationParams, mockIconSpokeProvider);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(true);
        }
      });

      it('should return error for invalid amount', async () => {
        const invalidParams = {
          ...mockMigrationParams,
          amount: 0n,
        } satisfies MigrationParams;

        const result = await migrationService.isAllowanceValid(invalidParams, mockIconSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeInstanceOf(Error);
        }
      });

      it('should return error for empty to address', async () => {
        const invalidParams = {
          ...mockMigrationParams,
          to: '0x' as `0x${string}`,
        } satisfies MigrationParams;

        const result = await migrationService.isAllowanceValid(invalidParams, mockIconSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeInstanceOf(Error);
        }
      });

      it('should return error for wrong provider type', async () => {
        const result = await migrationService.isAllowanceValid(mockMigrationParams, mockSonicSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeInstanceOf(Error);
        }
      });

      it('should return error for invalid token', async () => {
        const invalidParams = {
          ...mockMigrationParams,
          icx: 'cx0000000000000000000000000000000000000001' as IcxTokenType,
        } satisfies MigrationParams;

        const result = await migrationService.isAllowanceValid(invalidParams, mockIconSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeInstanceOf(Error);
        }
      });

      it('should return error for wrong token type', async () => {
        const invalidParams = {
          ...mockMigrationParams,
          token: 'INVALID' as never,
        } satisfies MigrationParams;

        const result = await migrationService.isAllowanceValid(invalidParams, mockIconSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeInstanceOf(Error);
        }
      });
    });

    describe('revert action', () => {
      it('should return true for valid revert params with SonicSpokeProvider', async () => {
        vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce('0xUserRouterAddress');
        vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce({
          ok: true,
          value: true,
        });

        const result = await migrationService.isAllowanceValid(mockRevertMigrationParams, mockSonicSpokeProvider);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(true);
        }
      });

      it('should return error for invalid amount', async () => {
        const invalidParams = {
          ...mockRevertMigrationParams,
          amount: 0n,
        } satisfies IcxCreateRevertMigrationParams;

        const result = await migrationService.isAllowanceValid(invalidParams, mockSonicSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeInstanceOf(Error);
        }
      });

      it('should return error for empty to address', async () => {
        const invalidParams = {
          ...mockRevertMigrationParams,
          to: 'hx' as `hx${string}`,
        } satisfies IcxCreateRevertMigrationParams;

        const result = await migrationService.isAllowanceValid(invalidParams, mockSonicSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeInstanceOf(Error);
        }
      });

      it('should return error for wrong provider type', async () => {
        const result = await migrationService.isAllowanceValid(mockRevertMigrationParams, mockIconSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeInstanceOf(Error);
        }
      });

      it('should return error when Erc20Service.isAllowanceValid fails', async () => {
        vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce('0xUserRouterAddress');
        vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce({
          ok: false,
          error: new Error('Allowance check failed'),
        });

        const result = await migrationService.isAllowanceValid(mockRevertMigrationParams, mockSonicSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeInstanceOf(Error);
        }
      });
    });

    it('should return error for invalid action', async () => {
      const invalidParams = {
        ...mockMigrationParams,
        action: 'invalid' as never,
      } satisfies MigrationParams;

      const result = await migrationService.isAllowanceValid(invalidParams, mockIconSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });

  describe('approve', () => {
    it('should approve revert migration with SonicSpokeProvider', async () => {
      vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce('0xUserRouterAddress');
      vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockTxHash);

      const result = await migrationService.approve(mockRevertMigrationParams, mockSonicSpokeProvider);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(mockTxHash);
      }
    });

    it('should approve revert migration with raw flag', async () => {
      const mockRawTx: EvmRawTransaction = {
        from: mockEvmAddress,
        to: '0x8515352CB9832D1d379D52366D1E995ADd358420',
        value: 0n,
        data: '0x',
      };

      vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce('0xUserRouterAddress');
      vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(mockRawTx);

      const result = await migrationService.approve(mockRevertMigrationParams, mockSonicSpokeProvider, true);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockRawTx);
      }
    });

    it('should return error for invalid amount', async () => {
      const invalidParams = {
        ...mockRevertMigrationParams,
        amount: 0n,
      } satisfies IcxCreateRevertMigrationParams;

      const result = await migrationService.approve(invalidParams, mockSonicSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should return error for empty to address', async () => {
      const invalidParams = {
        ...mockRevertMigrationParams,
        to: 'hx' as `hx${string}`,
      } satisfies IcxCreateRevertMigrationParams;

      const result = await migrationService.approve(invalidParams, mockSonicSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should return error for wrong provider type', async () => {
      const result = await migrationService.approve(mockRevertMigrationParams, mockIconSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should return error when Erc20Service.approve fails', async () => {
      vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce('0xUserRouterAddress');
      vi.spyOn(Erc20Service, 'approve').mockRejectedValueOnce(new Error('Approve failed'));

      const result = await migrationService.approve(mockRevertMigrationParams, mockSonicSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should return error for invalid action', async () => {
      const invalidParams = {
        ...mockRevertMigrationParams,
        action: 'invalid' as never,
      } satisfies IcxCreateRevertMigrationParams;

      const result = await migrationService.approve(invalidParams, mockSonicSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });

  describe('createAndSubmitMigrateIntent', () => {
    it('should successfully create and submit migration intent', async () => {
      vi.spyOn(migrationService, 'createMigrateIntent').mockResolvedValueOnce({
        ok: true,
        value: mockTxHash,
      });
      vi.spyOn(IntentRelayApiService, 'relayTxAndWaitPacket').mockResolvedValueOnce({
        ok: true,
        value: mockPacketData,
      });

      const result = await migrationService.createAndSubmitMigrateIntent(
        mockMigrationParams,
        mockIconSpokeProvider,
        DEFAULT_RELAY_TX_TIMEOUT,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([mockTxHash, mockHubTxHash]);
      }
    });

    it('should handle createMigrateIntent failure', async () => {
      const mockError: MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> = {
        code: 'CREATE_MIGRATION_INTENT_FAILED',
        data: {
          payload: mockMigrationParams,
          error: new Error('Create intent failed'),
        },
      };

      vi.spyOn(migrationService, 'createMigrateIntent').mockResolvedValueOnce({
        ok: false,
        error: mockError,
      });

      const result = await migrationService.createAndSubmitMigrateIntent(
        mockMigrationParams,
        mockIconSpokeProvider,
        DEFAULT_RELAY_TX_TIMEOUT,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(mockError);
      }
    });

    it('should handle relayTxAndWaitPacket failure', async () => {
      const mockRelayError: RelayError = {
        code: 'SUBMIT_TX_FAILED' as RelayErrorCode,
        error: 'Relay failed',
      };

      vi.spyOn(migrationService, 'createMigrateIntent').mockResolvedValueOnce({
        ok: true,
        value: mockTxHash,
      });
      vi.spyOn(IntentRelayApiService, 'relayTxAndWaitPacket').mockResolvedValueOnce({
        ok: false,
        error: mockRelayError,
      });

      const result = await migrationService.createAndSubmitMigrateIntent(
        mockMigrationParams,
        mockIconSpokeProvider,
        DEFAULT_RELAY_TX_TIMEOUT,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(mockRelayError);
      }
    });

    it('should handle unexpected errors', async () => {
      vi.spyOn(migrationService, 'createMigrateIntent').mockRejectedValue(new Error('Unexpected error'));

      const result = await migrationService.createAndSubmitMigrateIntent(
        mockMigrationParams,
        mockIconSpokeProvider,
        DEFAULT_RELAY_TX_TIMEOUT,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('MIGRATION_FAILED');
        if ('data' in result.error) {
          expect(result.error.data.payload).toEqual(mockMigrationParams);
        }
      }
    });
  });

  describe('createAndSubmitRevertMigrationIntent', () => {
    it('should successfully create and submit revert migration intent', async () => {
      vi.spyOn(migrationService, 'createRevertMigrationIntent').mockResolvedValueOnce({
        ok: true,
        value: mockTxHash,
      });
      vi.spyOn(IntentRelayApiService, 'relayTxAndWaitPacket').mockResolvedValueOnce({
        ok: true,
        value: mockPacketData,
      });

      const result = await migrationService.createAndSubmitRevertMigrationIntent(
        mockRevertMigrationParams,
        mockSonicSpokeProvider,
        DEFAULT_RELAY_TX_TIMEOUT,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([mockTxHash, mockHubTxHash]);
      }
    });

    it('should handle createRevertMigrationIntent failure', async () => {
      const mockError: MigrationError<'CREATE_REVERT_MIGRATION_INTENT_FAILED'> = {
        code: 'CREATE_REVERT_MIGRATION_INTENT_FAILED',
        data: {
          payload: mockRevertMigrationParams,
          error: new Error('Create revert intent failed'),
        },
      };

      vi.spyOn(migrationService, 'createRevertMigrationIntent').mockResolvedValueOnce({
        ok: false,
        error: mockError,
      });

      const result = await migrationService.createAndSubmitRevertMigrationIntent(
        mockRevertMigrationParams,
        mockSonicSpokeProvider,
        DEFAULT_RELAY_TX_TIMEOUT,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(mockError);
      }
    });

    it('should handle relayTxAndWaitPacket failure', async () => {
      const mockRelayError: RelayError = {
        code: 'SUBMIT_TX_FAILED' as RelayErrorCode,
        error: 'Relay failed',
      };

      vi.spyOn(migrationService, 'createRevertMigrationIntent').mockResolvedValueOnce({
        ok: true,
        value: mockTxHash,
      });
      vi.spyOn(IntentRelayApiService, 'relayTxAndWaitPacket').mockResolvedValueOnce({
        ok: false,
        error: mockRelayError,
      });

      const result = await migrationService.createAndSubmitRevertMigrationIntent(
        mockRevertMigrationParams,
        mockSonicSpokeProvider,
        DEFAULT_RELAY_TX_TIMEOUT,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(mockRelayError);
      }
    });

    it('should handle unexpected errors', async () => {
      vi.spyOn(migrationService, 'createRevertMigrationIntent').mockRejectedValue(new Error('Unexpected error'));

      const result = await migrationService.createAndSubmitRevertMigrationIntent(
        mockRevertMigrationParams,
        mockSonicSpokeProvider,
        DEFAULT_RELAY_TX_TIMEOUT,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('REVERT_MIGRATION_FAILED');
        if ('data' in result.error) {
          expect(result.error.data.payload).toEqual(mockRevertMigrationParams);
        }
      }
    });
  });

  describe('createMigrateIntent', () => {
    it('should successfully create migration intent', async () => {
      vi.spyOn(migrationService['icxMigration'], 'getAvailableAmount').mockResolvedValueOnce(10000000000000000000n);
      vi.spyOn(migrationService['icxMigration'], 'migrateData').mockReturnValue('0xmigrationdata');
      vi.spyOn(SpokeService, 'deposit').mockResolvedValueOnce(mockTxHash);

      const result = await migrationService.createMigrateIntent(mockMigrationParams, mockIconSpokeProvider);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(mockTxHash);
      }
    });

    it('should create migration intent with raw flag', async () => {
      const mockRawTx = {
        from: 'hx742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
        to: 'cx1be33c283c7dc7617181d1b21a6a2309e71b1ee7',
        value: 1000000000000000000n,
        data: '0xmigrationdata',
      };

      vi.spyOn(migrationService['icxMigration'], 'getAvailableAmount').mockResolvedValueOnce(10000000000000000000n);
      vi.spyOn(migrationService['icxMigration'], 'migrateData').mockReturnValue('0xmigrationdata');
      vi.spyOn(SpokeService, 'deposit').mockResolvedValueOnce(mockRawTx);

      const result = await migrationService.createMigrateIntent(mockMigrationParams, mockIconSpokeProvider, true);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockRawTx);
      }
    });

    it('should return error for invalid amount', async () => {
      const invalidParams = {
        ...mockMigrationParams,
        amount: 0n,
      } satisfies MigrationParams;

      const result = await migrationService.createMigrateIntent(invalidParams, mockIconSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
      }
    });

    it('should return error for invalid to address', async () => {
      const invalidParams = {
        ...mockMigrationParams,
        to: '0xinvalid' as `0x${string}`,
      } satisfies MigrationParams;

      const result = await migrationService.createMigrateIntent(invalidParams, mockIconSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
      }
    });

    it('should return error for invalid token', async () => {
      const invalidParams = {
        ...mockMigrationParams,
        icx: 'cx0000000000000000000000000000000000000000',
      } satisfies MigrationParams;

      const result = await migrationService.createMigrateIntent(invalidParams, mockIconSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
      }
    });

    it('should return error for wrong provider type', async () => {
      const result = await migrationService.createMigrateIntent(mockMigrationParams, mockIconSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
      }
    });

    it('should return error for wrong token type', async () => {
      const invalidParams = {
        ...mockMigrationParams,
        token: 'INVALID' as never,
      } satisfies MigrationParams;

      const result = await migrationService.createMigrateIntent(invalidParams, mockIconSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
      }
    });

    it('should return error for insufficient liquidity', async () => {
      vi.spyOn(migrationService['icxMigration'], 'getAvailableAmount').mockResolvedValueOnce(100000000000000000n);

      const result = await migrationService.createMigrateIntent(mockMigrationParams, mockIconSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
      }
    });

    it('should return error when SpokeService.deposit fails', async () => {
      vi.spyOn(migrationService['icxMigration'], 'getAvailableAmount').mockResolvedValueOnce(10000000000000000000n);
      vi.spyOn(migrationService['icxMigration'], 'migrateData').mockReturnValue('0xmigrationdata');
      vi.spyOn(SpokeService, 'deposit').mockRejectedValue(new Error('Deposit failed'));

      const result = await migrationService.createMigrateIntent(mockMigrationParams, mockIconSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
      }
    });
  });

  describe('createRevertMigrationIntent', () => {
    it('should successfully create revert migration intent', async () => {
      vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce('0xUserRouterAddress');
      vi.spyOn(migrationService['icxMigration'], 'revertMigration').mockReturnValue('0xrevertdata');
      vi.spyOn(SonicSpokeService, 'deposit').mockResolvedValueOnce(mockTxHash);

      const result = await migrationService.createRevertMigrationIntent(
        mockRevertMigrationParams,
        mockSonicSpokeProvider,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(mockTxHash);
      }
    });

    it('should create revert migration intent with raw flag', async () => {
      const mockRawTx: EvmRawTransaction = {
        from: mockEvmAddress,
        to: '0x8515352CB9832D1d379D52366D1E995ADd358420',
        value: 0n,
        data: '0xrevertdata',
      };

      vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce('0xUserRouterAddress');
      vi.spyOn(migrationService['icxMigration'], 'revertMigration').mockReturnValue('0xrevertdata');
      vi.spyOn(SonicSpokeService, 'deposit').mockResolvedValueOnce(mockRawTx);

      const result = await migrationService.createRevertMigrationIntent(
        mockRevertMigrationParams,
        mockSonicSpokeProvider,
        true,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockRawTx);
      }
    });

    it('should return error when SonicSpokeService.getUserRouter fails', async () => {
      vi.spyOn(SonicSpokeService, 'getUserRouter').mockRejectedValue(new Error('Get user router failed'));

      const result = await migrationService.createRevertMigrationIntent(
        mockRevertMigrationParams,
        mockSonicSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_REVERT_MIGRATION_INTENT_FAILED');
      }
    });

    it('should return error when SonicSpokeService.deposit fails', async () => {
      vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce('0xUserRouterAddress');
      vi.spyOn(migrationService['icxMigration'], 'revertMigration').mockReturnValue('0xrevertdata');
      vi.spyOn(SonicSpokeService, 'deposit').mockRejectedValue(new Error('Deposit failed'));

      const result = await migrationService.createRevertMigrationIntent(
        mockRevertMigrationParams,
        mockSonicSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_REVERT_MIGRATION_INTENT_FAILED');
      }
    });

    it('should call revertMigration with correct parameters', async () => {
      const revertMigrationSpy = vi
        .spyOn(migrationService['icxMigration'], 'revertMigration')
        .mockReturnValue('0xrevertdata');
      vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce('0xUserRouterAddress');
      vi.spyOn(SonicSpokeService, 'deposit').mockResolvedValueOnce(mockTxHash);

      await migrationService.createRevertMigrationIntent(mockRevertMigrationParams, mockSonicSpokeProvider);

      expect(revertMigrationSpy).toHaveBeenCalledWith({
        wICX: spokeChainConfig[ICON_MAINNET_CHAIN_ID].addresses.wICX,
        amount: mockRevertMigrationParams.amount,
        to: encodeAddress(ICON_MAINNET_CHAIN_ID, mockRevertMigrationParams.to),
        userWallet: '0xUserRouterAddress',
      });
    });
  });
});
