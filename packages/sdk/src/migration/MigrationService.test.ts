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
  SpokeService,
  SonicSpokeService,
  Erc20Service,
  DEFAULT_RELAY_TX_TIMEOUT,
  encodeAddress,
  type PacketData,
  type IcxTokenType,
  type MigrationAction,
  type UnifiedBnUSDMigrateParams,
  bnUSDLegacySpokeChainIds,
  newbnUSDSpokeChainIds,
  bnUSDLegacyTokens,
  bnUSDNewTokens,
  isLegacybnUSDChainId,
  isNewbnUSDChainId,
  isLegacybnUSDToken,
  isNewbnUSDToken,
  Sodax,
  getHubChainConfig,
  DEFAULT_RELAYER_API_ENDPOINT,
} from '../index.js';
import {
  ICON_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  spokeChainConfig,
  getIntentRelayChainId,
  type EvmRawTransaction,
  type IIconWalletProvider,
  type IEvmWalletProvider,
  type SpokeChainId,
  type Address,
} from '@sodax/types';
import * as IntentRelayApiService from '../shared/services/intentRelay/IntentRelayApiService.js';
import * as SharedUtils from '../shared/utils/shared-utils.js';

const sodax = new Sodax();
const mockEvmAddress = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8' satisfies `0x${string}`;

// Mock payloads and parameters at the top for re-use
const mockMigrationParams: MigrationParams = {
  address: 'cx3975b43d260fb8ec802cef6e60c2f4d07486f11d', // wICX address
  amount: 1000000000000000000n, // 1 ICX with 18 decimals
  to: mockEvmAddress,
} satisfies MigrationParams;

const mockRevertMigrationParams: IcxCreateRevertMigrationParams = {
  amount: 1000000000000000000n, // 1 SODA token with 18 decimals
  to: 'hx742d35cc6634c0532925a3b8d4c9db96c4b4d8b6', // Icon address
} satisfies IcxCreateRevertMigrationParams;

// bnUSD Migration test parameters using real constants
const mockBnUSDLegacyToNewParams: UnifiedBnUSDMigrateParams = {
  srcChainId: ICON_MAINNET_CHAIN_ID,
  dstChainId: SONIC_MAINNET_CHAIN_ID,
  srcbnUSD: bnUSDLegacyTokens[0]?.address ?? 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb', // ICON legacy bnUSD
  dstbnUSD: bnUSDNewTokens[0]?.address ?? '0xE801CA34E19aBCbFeA12025378D19c4FBE250131', // Sonic new bnUSD
  amount: 1000000000000000000n, // 1 bnUSD with 18 decimals
  to: mockEvmAddress,
} satisfies UnifiedBnUSDMigrateParams;

const mockBnUSDNewToLegacyParams: UnifiedBnUSDMigrateParams = {
  srcChainId: SONIC_MAINNET_CHAIN_ID,
  dstChainId: ICON_MAINNET_CHAIN_ID,
  srcbnUSD: bnUSDNewTokens[0]?.address ?? '0xE801CA34E19aBCbFeA12025378D19c4FBE250131', // Sonic new bnUSD
  dstbnUSD: bnUSDLegacyTokens[0]?.address ?? 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb', // ICON legacy bnUSD
  amount: 1000000000000000000n, // 1 bnUSD with 18 decimals
  to: 'hx742d35cc6634c0532925a3b8d4c9db96c4b4d8b6', // Icon address
} satisfies UnifiedBnUSDMigrateParams;

const mockIconWalletProvider = {
  getWalletAddress: vi.fn().mockResolvedValueOnce('hx742d35cc6634c0532925a3b8d4c9db96c4b4d8b6'),
  sendTransaction: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
} satisfies IIconWalletProvider;

const mockSonicWalletProvider = {
  getWalletAddress: vi.fn().mockResolvedValueOnce(mockEvmAddress),
  sendTransaction: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
} satisfies IEvmWalletProvider;

const mockHubConfig: EvmHubProviderConfig = {
  hubRpcUrl: 'https://rpc.soniclabs.com',
  chainConfig: getHubChainConfig(),
} satisfies EvmHubProviderConfig;

const mockIconSpokeProvider = new IconSpokeProvider(mockIconWalletProvider, spokeChainConfig[ICON_MAINNET_CHAIN_ID]);

const mockSonicSpokeProvider = new SonicSpokeProvider(
  mockSonicWalletProvider,
  spokeChainConfig[SONIC_MAINNET_CHAIN_ID],
);

const mockHubProvider = new EvmHubProvider({ config: mockHubConfig, configService: sodax.config });

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
    migrationService = new MigrationService({
      hubProvider: mockHubProvider,
      configService: sodax.config,
      relayerApiEndpoint: DEFAULT_RELAYER_API_ENDPOINT,
    });
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const service = new MigrationService({
        hubProvider: mockHubProvider,
        configService: sodax.config,
        relayerApiEndpoint: DEFAULT_RELAYER_API_ENDPOINT,
      });
      expect(service).toBeInstanceOf(MigrationService);
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        relayerApiEndpoint: 'https://custom-relayer.com' as const,
      };
      const service = new MigrationService({
        hubProvider: mockHubProvider,
        configService: sodax.config,
        relayerApiEndpoint: customConfig.relayerApiEndpoint,
      });
      expect(service).toBeInstanceOf(MigrationService);
    });
  });

  describe('isAllowanceValid', () => {
    describe('migrate action', () => {
      it('should return true for valid migration params with IconSpokeProvider', async () => {
        const result = await migrationService.isAllowanceValid(mockMigrationParams, 'migrate', mockIconSpokeProvider);

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

        const result = await migrationService.isAllowanceValid(invalidParams, 'migrate', mockIconSpokeProvider);

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

        const result = await migrationService.isAllowanceValid(invalidParams, 'migrate', mockIconSpokeProvider);

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

        const result = await migrationService.isAllowanceValid(
          mockRevertMigrationParams,
          'revert',
          mockSonicSpokeProvider,
        );

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

        const result = await migrationService.isAllowanceValid(invalidParams, 'revert', mockSonicSpokeProvider);

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

        const result = await migrationService.isAllowanceValid(invalidParams, 'revert', mockSonicSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeInstanceOf(Error);
        }
      });

      it('should return error for wrong provider type', async () => {
        const result = await migrationService.isAllowanceValid(
          mockRevertMigrationParams,
          'revert',
          {} as unknown as SonicSpokeProvider,
        );

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

        const result = await migrationService.isAllowanceValid(
          mockRevertMigrationParams,
          'revert',
          mockSonicSpokeProvider,
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeInstanceOf(Error);
        }
      });
    });

    it('should return error for invalid action', async () => {
      const invalidParams = {
        ...mockMigrationParams,
      } satisfies MigrationParams;

      const result = await migrationService.isAllowanceValid(
        invalidParams,
        'migrate1' as MigrationAction,
        mockIconSpokeProvider,
      );

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

      const result = await migrationService.approve(mockRevertMigrationParams, 'revert', mockSonicSpokeProvider);

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

      const result = await migrationService.approve(mockRevertMigrationParams, 'revert', mockSonicSpokeProvider, true);

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

      const result = await migrationService.approve(invalidParams, 'revert', mockSonicSpokeProvider);

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

      const result = await migrationService.approve(invalidParams, 'revert', mockSonicSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should return error for wrong provider type', async () => {
      const result = await migrationService.approve(
        mockRevertMigrationParams,
        'revert',
        {} as unknown as SonicSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should return error when Erc20Service.approve fails', async () => {
      vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce('0xUserRouterAddress');
      vi.spyOn(Erc20Service, 'approve').mockRejectedValueOnce(new Error('Approve failed'));

      const result = await migrationService.approve(mockRevertMigrationParams, 'revert', mockSonicSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should return error for invalid action', async () => {
      const invalidParams = {
        ...mockRevertMigrationParams,
      } satisfies IcxCreateRevertMigrationParams;

      const result = await migrationService.approve(invalidParams, 'revert', mockSonicSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });

  describe('createAndSubmitMigrateIntent', () => {
    it('should successfully create and submit migration intent', async () => {
      vi.spyOn(migrationService, 'createMigrateIcxToSodaIntent').mockResolvedValueOnce({
        ok: true,
        value: mockTxHash,
      });
      vi.spyOn(IntentRelayApiService, 'relayTxAndWaitPacket').mockResolvedValueOnce({
        ok: true,
        value: mockPacketData,
      });

      const result = await migrationService.migrateIcxToSoda(
        mockMigrationParams,
        mockIconSpokeProvider,
        DEFAULT_RELAY_TX_TIMEOUT,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([mockTxHash, mockHubTxHash]);
      }
    });

    it('should handle createMigrateIcxToSodaIntent failure', async () => {
      const mockError: MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> = {
        code: 'CREATE_MIGRATION_INTENT_FAILED',
        data: {
          payload: mockMigrationParams,
          error: new Error('Create intent failed'),
        },
      };

      vi.spyOn(migrationService, 'createMigrateIcxToSodaIntent').mockResolvedValueOnce({
        ok: false,
        error: mockError,
      });

      const result = await migrationService.migrateIcxToSoda(
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

      vi.spyOn(migrationService, 'createMigrateIcxToSodaIntent').mockResolvedValueOnce({
        ok: true,
        value: mockTxHash,
      });
      vi.spyOn(IntentRelayApiService, 'relayTxAndWaitPacket').mockResolvedValueOnce({
        ok: false,
        error: mockRelayError,
      });

      const result = await migrationService.migrateIcxToSoda(
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
      vi.spyOn(migrationService, 'createMigrateIcxToSodaIntent').mockRejectedValue(new Error('Unexpected error'));

      const result = await migrationService.migrateIcxToSoda(
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
      vi.spyOn(migrationService, 'createRevertSodaToIcxMigrationIntent').mockResolvedValueOnce({
        ok: true,
        value: mockTxHash,
      });
      vi.spyOn(IntentRelayApiService, 'relayTxAndWaitPacket').mockResolvedValueOnce({
        ok: true,
        value: mockPacketData,
      });

      const result = await migrationService.revertMigrateSodaToIcx(
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

      vi.spyOn(migrationService, 'createRevertSodaToIcxMigrationIntent').mockResolvedValueOnce({
        ok: false,
        error: mockError,
      });

      const result = await migrationService.revertMigrateSodaToIcx(
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

      vi.spyOn(migrationService, 'createRevertSodaToIcxMigrationIntent').mockResolvedValueOnce({
        ok: true,
        value: mockTxHash,
      });
      vi.spyOn(IntentRelayApiService, 'relayTxAndWaitPacket').mockResolvedValueOnce({
        ok: false,
        error: mockRelayError,
      });

      const result = await migrationService.revertMigrateSodaToIcx(
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
      vi.spyOn(migrationService, 'createRevertSodaToIcxMigrationIntent').mockRejectedValue(
        new Error('Unexpected error'),
      );

      const result = await migrationService.revertMigrateSodaToIcx(
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
      vi.spyOn(migrationService['icxMigration'], 'migrateData').mockResolvedValueOnce('0xmigrationdata');
      vi.spyOn(SpokeService, 'deposit').mockResolvedValueOnce(mockTxHash);

      const result = await migrationService.createMigrateIcxToSodaIntent(mockMigrationParams, mockIconSpokeProvider);

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
      vi.spyOn(migrationService['icxMigration'], 'migrateData').mockResolvedValueOnce('0xmigrationdata');
      vi.spyOn(SpokeService, 'deposit').mockResolvedValueOnce(mockRawTx);

      const result = await migrationService.createMigrateIcxToSodaIntent(
        mockMigrationParams,
        mockIconSpokeProvider,
        true,
      );

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

      const result = await migrationService.createMigrateIcxToSodaIntent(invalidParams, mockIconSpokeProvider);

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

      const result = await migrationService.createMigrateIcxToSodaIntent(invalidParams, mockIconSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
      }
    });

    it('should return error for invalid token', async () => {
      const invalidParams = {
        ...mockMigrationParams,
        address: 'cx0' as unknown as IcxTokenType,
      } satisfies MigrationParams;

      const result = await migrationService.createMigrateIcxToSodaIntent(invalidParams, mockIconSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
      }
    });

    it('should return error for wrong provider type', async () => {
      const result = await migrationService.createMigrateIcxToSodaIntent(
        mockMigrationParams,
        {} as unknown as IconSpokeProvider,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
      }
    });

    it('should return error for insufficient liquidity', async () => {
      vi.spyOn(migrationService['icxMigration'], 'getAvailableAmount').mockResolvedValueOnce(100000000000000000n);

      const result = await migrationService.createMigrateIcxToSodaIntent(mockMigrationParams, mockIconSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
      }
    });

    it('should return error when SpokeService.deposit fails', async () => {
      vi.spyOn(migrationService['icxMigration'], 'getAvailableAmount').mockResolvedValueOnce(10000000000000000000n);
      vi.spyOn(migrationService['icxMigration'], 'migrateData').mockResolvedValueOnce('0xmigrationdata');
      vi.spyOn(SpokeService, 'deposit').mockRejectedValue(new Error('Deposit failed'));

      const result = await migrationService.createMigrateIcxToSodaIntent(mockMigrationParams, mockIconSpokeProvider);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
      }
    });
  });

  describe('createRevertMigrationIntent', () => {
    it('should successfully create revert migration intent', async () => {
      vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce('0xUserRouterAddress');
      vi.spyOn(migrationService['icxMigration'], 'revertMigration').mockResolvedValueOnce('0xrevertdata');
      vi.spyOn(SonicSpokeService, 'deposit').mockResolvedValueOnce(mockTxHash);

      const result = await migrationService.createRevertSodaToIcxMigrationIntent(
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
      vi.spyOn(migrationService['icxMigration'], 'revertMigration').mockResolvedValueOnce('0xrevertdata');
      vi.spyOn(SonicSpokeService, 'deposit').mockResolvedValueOnce(mockRawTx);

      const result = await migrationService.createRevertSodaToIcxMigrationIntent(
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

      const result = await migrationService.createRevertSodaToIcxMigrationIntent(
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
      vi.spyOn(migrationService['icxMigration'], 'revertMigration').mockResolvedValueOnce('0xrevertdata');
      vi.spyOn(SonicSpokeService, 'deposit').mockRejectedValue(new Error('Deposit failed'));

      const result = await migrationService.createRevertSodaToIcxMigrationIntent(
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
        .mockResolvedValueOnce('0xrevertdata');
      vi.spyOn(SonicSpokeService, 'getUserRouter').mockResolvedValueOnce('0xUserRouterAddress');
      vi.spyOn(SonicSpokeService, 'deposit').mockResolvedValueOnce(mockTxHash);

      await migrationService.createRevertSodaToIcxMigrationIntent(mockRevertMigrationParams, mockSonicSpokeProvider);

      expect(revertMigrationSpy).toHaveBeenCalledWith({
        wICX: spokeChainConfig[ICON_MAINNET_CHAIN_ID].addresses.wICX,
        amount: mockRevertMigrationParams.amount,
        to: encodeAddress(ICON_MAINNET_CHAIN_ID, mockRevertMigrationParams.to),
        userWallet: '0xUserRouterAddress',
      });
    });
  });

  describe('bnUSD Migration', () => {
    describe('migratebnUSD - Legacy to New', () => {
      it('should successfully migrate legacy bnUSD to new bnUSD', async () => {
        vi.spyOn(migrationService, 'createMigratebnUSDIntent').mockResolvedValueOnce({
          ok: true,
          value: [mockTxHash, { address: mockBnUSDLegacyToNewParams.to as Address, payload: '0xbnusdmigrationdata' }],
        });
        vi.spyOn(IntentRelayApiService, 'relayTxAndWaitPacket').mockResolvedValueOnce({
          ok: true,
          value: mockPacketData,
        });

        const result = await migrationService.migratebnUSD(
          mockBnUSDLegacyToNewParams,
          mockIconSpokeProvider,
          DEFAULT_RELAY_TX_TIMEOUT,
        );

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toEqual([mockTxHash, mockHubTxHash]);
        }
      });

      it('should handle createMigratebnUSDIntent failure for legacy to new', async () => {
        const mockError: MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> = {
          code: 'CREATE_MIGRATION_INTENT_FAILED',
          data: {
            payload: mockBnUSDLegacyToNewParams,
            error: new Error('Create bnUSD intent failed'),
          },
        };

        vi.spyOn(migrationService, 'createMigratebnUSDIntent').mockResolvedValueOnce({
          ok: false,
          error: mockError,
        });

        const result = await migrationService.migratebnUSD(
          mockBnUSDLegacyToNewParams,
          mockIconSpokeProvider,
          DEFAULT_RELAY_TX_TIMEOUT,
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toEqual(mockError);
        }
      });

      it('should handle relayTxAndWaitPacket failure for legacy to new', async () => {
        const mockRelayError: RelayError = {
          code: 'SUBMIT_TX_FAILED' as RelayErrorCode,
          error: 'Relay failed for bnUSD migration',
        };

        vi.spyOn(migrationService, 'createMigratebnUSDIntent').mockResolvedValueOnce({
          ok: true,
          value: [mockTxHash, { address: mockBnUSDLegacyToNewParams.to as Address, payload: '0xbnusdmigrationdata' }],
        });
        vi.spyOn(IntentRelayApiService, 'relayTxAndWaitPacket').mockResolvedValueOnce({
          ok: false,
          error: mockRelayError,
        });

        const result = await migrationService.migratebnUSD(
          mockBnUSDLegacyToNewParams,
          mockIconSpokeProvider,
          DEFAULT_RELAY_TX_TIMEOUT,
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toEqual(mockRelayError);
        }
      });

      it('should handle unexpected errors for legacy to new migration', async () => {
        vi.spyOn(migrationService, 'createMigratebnUSDIntent').mockRejectedValue(new Error('Unexpected bnUSD error'));

        const result = await migrationService.migratebnUSD(
          mockBnUSDLegacyToNewParams,
          mockIconSpokeProvider,
          DEFAULT_RELAY_TX_TIMEOUT,
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('MIGRATION_FAILED');
          if ('data' in result.error) {
            expect(result.error.data.payload).toEqual(mockBnUSDLegacyToNewParams);
          }
        }
      });
    });

    describe('migratebnUSD - New to Legacy', () => {
      it('should successfully migrate new bnUSD to legacy bnUSD', async () => {
        vi.spyOn(migrationService, 'createMigratebnUSDIntent').mockResolvedValueOnce({
          ok: true,
          value: [mockTxHash, { address: mockBnUSDLegacyToNewParams.to as Address, payload: '0xbnusdmigrationdata' }],
        });
        vi.spyOn(IntentRelayApiService, 'relayTxAndWaitPacket').mockResolvedValueOnce({
          ok: true,
          value: mockPacketData,
        });

        const result = await migrationService.migratebnUSD(
          mockBnUSDNewToLegacyParams,
          mockSonicSpokeProvider,
          DEFAULT_RELAY_TX_TIMEOUT,
        );

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toEqual([mockTxHash, mockHubTxHash]);
        }
      });

      it('should handle createMigratebnUSDIntent failure for new to legacy', async () => {
        const mockError: MigrationError<'CREATE_MIGRATION_INTENT_FAILED'> = {
          code: 'CREATE_MIGRATION_INTENT_FAILED',
          data: {
            payload: mockBnUSDNewToLegacyParams,
            error: new Error('Create bnUSD revert intent failed'),
          },
        };

        vi.spyOn(migrationService, 'createMigratebnUSDIntent').mockResolvedValueOnce({
          ok: false,
          error: mockError,
        });

        const result = await migrationService.migratebnUSD(
          mockBnUSDNewToLegacyParams,
          mockSonicSpokeProvider,
          DEFAULT_RELAY_TX_TIMEOUT,
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toEqual(mockError);
        }
      });

      it('should handle relayTxAndWaitPacket failure for new to legacy', async () => {
        const mockRelayError: RelayError = {
          code: 'SUBMIT_TX_FAILED' as RelayErrorCode,
          error: 'Relay failed for bnUSD revert migration',
        };

        vi.spyOn(migrationService, 'createMigratebnUSDIntent').mockResolvedValueOnce({
          ok: true,
          value: [mockTxHash, { address: mockBnUSDLegacyToNewParams.to as Address, payload: '0xbnusdmigrationdata' }],
        });
        vi.spyOn(IntentRelayApiService, 'relayTxAndWaitPacket').mockResolvedValueOnce({
          ok: false,
          error: mockRelayError,
        });

        const result = await migrationService.migratebnUSD(
          mockBnUSDNewToLegacyParams,
          mockSonicSpokeProvider,
          DEFAULT_RELAY_TX_TIMEOUT,
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toEqual(mockRelayError);
        }
      });

      it('should handle unexpected errors for new to legacy migration', async () => {
        vi.spyOn(migrationService, 'createMigratebnUSDIntent').mockRejectedValue(
          new Error('Unexpected bnUSD revert error'),
        );

        const result = await migrationService.migratebnUSD(
          mockBnUSDNewToLegacyParams,
          mockSonicSpokeProvider,
          DEFAULT_RELAY_TX_TIMEOUT,
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('MIGRATION_FAILED');
          if ('data' in result.error) {
            expect(result.error.data.payload).toEqual(mockBnUSDNewToLegacyParams);
          }
        }
      });
    });

    describe('createMigratebnUSDIntent', () => {
      it('should successfully create legacy to new bnUSD migration intent', async () => {
        vi.spyOn(SpokeService, 'deposit').mockResolvedValueOnce(mockTxHash);
        vi.spyOn(SharedUtils, 'deriveUserWalletAddress').mockResolvedValueOnce(
          '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
        );

        const result = await migrationService.createMigratebnUSDIntent(
          mockBnUSDLegacyToNewParams,
          mockIconSpokeProvider,
        );

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value[0]).toEqual(mockTxHash);
        }
      });

      it('should successfully create new to legacy bnUSD migration intent', async () => {
        vi.spyOn(SpokeService, 'deposit').mockResolvedValueOnce(mockTxHash);
        vi.spyOn(SharedUtils, 'deriveUserWalletAddress').mockResolvedValueOnce(
          '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
        );

        const result = await migrationService.createMigratebnUSDIntent(
          mockBnUSDNewToLegacyParams,
          mockSonicSpokeProvider,
        );

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value[0]).toEqual(mockTxHash);
        }
      });

      it('should create bnUSD migration intent with raw flag', async () => {
        const mockRawTx = {
          from: 'hx742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
          to: 'cx1be33c283c7dc7617181d1b21a6a2309e71b1ee7',
          value: 1000000000000000000n,
          data: '0xbnusdmigrationdata',
        };

        vi.spyOn(SpokeService, 'deposit').mockResolvedValueOnce(mockRawTx);
        vi.spyOn(SharedUtils, 'deriveUserWalletAddress').mockResolvedValueOnce(
          '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
        );

        const result = await migrationService.createMigratebnUSDIntent(
          mockBnUSDLegacyToNewParams,
          mockIconSpokeProvider,
          false, // unchecked
          true, // raw
        );

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value[0]).toEqual(mockRawTx);
        }
      });

      it('should return error for invalid source chain ID', async () => {
        const invalidParams = {
          ...mockBnUSDLegacyToNewParams,
          srcChainId: 'invalid-chain' as SpokeChainId,
        };

        const result = await migrationService.createMigratebnUSDIntent(invalidParams, mockIconSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
        }
      });

      it('should return error for invalid destination chain ID', async () => {
        const invalidParams = {
          ...mockBnUSDLegacyToNewParams,
          dstChainId: 'invalid-chain' as SpokeChainId,
        };

        const result = await migrationService.createMigratebnUSDIntent(invalidParams, mockIconSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
        }
      });

      it('should return error for empty source bnUSD address', async () => {
        const invalidParams = {
          ...mockBnUSDLegacyToNewParams,
          srcbnUSD: '',
        };

        const result = await migrationService.createMigratebnUSDIntent(invalidParams, mockIconSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
        }
      });

      it('should return error for empty destination bnUSD address', async () => {
        const invalidParams = {
          ...mockBnUSDLegacyToNewParams,
          dstbnUSD: '',
        };

        const result = await migrationService.createMigratebnUSDIntent(invalidParams, mockIconSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
        }
      });

      it('should return error for zero amount', async () => {
        const invalidParams = {
          ...mockBnUSDLegacyToNewParams,
          amount: 0n,
        };

        const result = await migrationService.createMigratebnUSDIntent(invalidParams, mockIconSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
        }
      });

      it('should return error for empty recipient address', async () => {
        const invalidParams = {
          ...mockBnUSDLegacyToNewParams,
          to: '',
        };

        const result = await migrationService.createMigratebnUSDIntent(invalidParams, mockIconSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
        }
      });

      it('should return error when both tokens are legacy bnUSD', async () => {
        const invalidParams = {
          ...mockBnUSDLegacyToNewParams,
          dstbnUSD: bnUSDLegacyTokens[1]?.address ?? 'cx1234567890123456789012345678901234567890',
        };

        const result = await migrationService.createMigratebnUSDIntent(invalidParams, mockIconSpokeProvider);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
        }
      });

      it('should return error when SpokeService.deposit fails', async () => {
        vi.spyOn(SpokeService, 'deposit').mockRejectedValue(new Error('Deposit failed'));

        const result = await migrationService.createMigratebnUSDIntent(
          mockBnUSDLegacyToNewParams,
          mockIconSpokeProvider,
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('CREATE_MIGRATION_INTENT_FAILED');
        }
      });

      it('should return error if neither srcbnUSD nor dstbnUSD is a legacy bnUSD token (even if unchecked)', async () => {
        const invalidParams = {
          ...mockBnUSDLegacyToNewParams,
          srcChainId: 'invalid-chain' as SpokeChainId,
          dstChainId: 'invalid-chain' as SpokeChainId,
          srcbnUSD: '0xnotlegacy',
          dstbnUSD: '0xnotlegacy',
          amount: 1n,
          to: '0x1234567890123456789012345678901234567890',
        };

        // No need to mock revertMigrationData or SpokeService.deposit, as error is thrown before they're called

        const result = await migrationService.createMigratebnUSDIntent(
          invalidParams,
          mockIconSpokeProvider,
          true, // unchecked
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
          // The error is wrapped in MigrationError, but the original error is in error.data.error
          // It could be a string or Error, so check for the message string
          const errorData = result.error.data;
          const errorMsg =
            typeof errorData.error === 'string'
              ? errorData.error
              : errorData.error instanceof Error
                ? errorData.error.message
                : '';
          expect(errorMsg).toContain('srcbnUSD or dstbnUSD must be a legacy bnUSD token');
        }
      });
    });

    describe('bnUSD Constants and Helper Functions', () => {
      it('should correctly identify legacy bnUSD chains', () => {
        expect(bnUSDLegacySpokeChainIds).toContain(ICON_MAINNET_CHAIN_ID);
        expect(isLegacybnUSDChainId(ICON_MAINNET_CHAIN_ID)).toBe(true);
      });

      it('should correctly identify new bnUSD chains', () => {
        expect(newbnUSDSpokeChainIds).toContain(SONIC_MAINNET_CHAIN_ID);
        expect(isNewbnUSDChainId(SONIC_MAINNET_CHAIN_ID)).toBe(true);
      });

      it('should correctly identify legacy bnUSD tokens', () => {
        const legacyToken = bnUSDLegacyTokens[0];
        expect(legacyToken).toBeDefined();
        if (legacyToken) {
          expect(isLegacybnUSDToken(legacyToken.address)).toBe(true);
          expect(isLegacybnUSDToken(legacyToken)).toBe(true);
        }
      });

      it('should correctly identify new bnUSD tokens', () => {
        const newToken = bnUSDNewTokens[0];
        expect(newToken).toBeDefined();
        if (newToken) {
          expect(isNewbnUSDToken(newToken.address)).toBe(true);
          expect(isNewbnUSDToken(newToken)).toBe(true);
        }
      });

      it('should validate bnUSD migration parameters correctly', () => {
        // Test legacy to new migration
        expect(isLegacybnUSDToken(mockBnUSDLegacyToNewParams.srcbnUSD)).toBe(true);
        expect(isNewbnUSDToken(mockBnUSDLegacyToNewParams.dstbnUSD)).toBe(true);
        expect(isLegacybnUSDChainId(mockBnUSDLegacyToNewParams.srcChainId)).toBe(true);
        expect(isNewbnUSDChainId(mockBnUSDLegacyToNewParams.dstChainId)).toBe(true);

        // Test new to legacy migration
        expect(isNewbnUSDToken(mockBnUSDNewToLegacyParams.srcbnUSD)).toBe(true);
        expect(isLegacybnUSDToken(mockBnUSDNewToLegacyParams.dstbnUSD)).toBe(true);
        expect(isNewbnUSDChainId(mockBnUSDNewToLegacyParams.srcChainId)).toBe(true);
        expect(isLegacybnUSDChainId(mockBnUSDNewToLegacyParams.dstChainId)).toBe(true);
      });
    });
  });
});
