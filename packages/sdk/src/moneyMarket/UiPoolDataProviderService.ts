import { type Address, getMoneyMarketConfig } from '@sodax/types';
import type { EvmHubProvider } from '../shared/entities/Providers.js';
import { uiPoolDataAbi } from '../shared/abis/uiPoolData.abi.js';
import type {
  AggregatedReserveData,
  BaseCurrencyInfo,
  EModeData,
  EmodeDataHumanized,
  PoolBaseCurrencyHumanized,
  ReserveDataHumanized,
  ReservesDataHumanized,
  UserReserveData,
  UserReserveDataHumanized,
  UiPoolDataProviderInterface,
} from './MoneyMarketTypes.js';
import { erc20BnusdAbi } from '../shared/abis/erc20-bnusd.abi.js';

export class UiPoolDataProviderService implements UiPoolDataProviderInterface {
  private readonly hubProvider: EvmHubProvider;
  private readonly uiPoolDataProvider: Address;
  private readonly poolAddressesProvider: Address;

  constructor(hubProvider: EvmHubProvider) {
    this.hubProvider = hubProvider;
    this.uiPoolDataProvider = getMoneyMarketConfig(this.hubProvider.chainConfig.chain.id).uiPoolDataProvider;
    this.poolAddressesProvider = getMoneyMarketConfig(this.hubProvider.chainConfig.chain.id).poolAddressesProvider;
  }

  public async getUserReservesHumanized(userAddress: Address): Promise<{
    userReserves: UserReserveDataHumanized[];
    userEmodeCategoryId: number;
  }> {
    const [userReservesRaw, userEmodeCategoryId] = await this.getUserReservesData(userAddress);

    return {
      userReserves: userReservesRaw.map(userReserveRaw => ({
        id: `${this.hubProvider.chainConfig.chain.id}-${userAddress}-${userReserveRaw.underlyingAsset}-${this.poolAddressesProvider}`.toLowerCase(),
        underlyingAsset: userReserveRaw.underlyingAsset.toLowerCase(),
        scaledATokenBalance: userReserveRaw.scaledATokenBalance.toString(),
        usageAsCollateralEnabledOnUser: userReserveRaw.usageAsCollateralEnabledOnUser,
        scaledVariableDebt: userReserveRaw.scaledVariableDebt.toString(),
      })),
      userEmodeCategoryId,
    };
  }

  /**
   * Get the list of all eModes in the pool humanized
   * @returns {Promise<EmodeDataHumanized[]>} - Array of eMode data humanized
   */
  public async getEModesHumanized(): Promise<EmodeDataHumanized[]> {
    const eModeData = await this.getEModes();
    return eModeData.map(eMode => ({
      id: eMode.id,
      eMode: {
        ltv: eMode.eMode.ltv.toString(),
        liquidationThreshold: eMode.eMode.liquidationThreshold.toString(),
        liquidationBonus: eMode.eMode.liquidationBonus.toString(),
        collateralBitmap: eMode.eMode.collateralBitmap.toString(2).padStart(256, '0'),
        label: eMode.eMode.label,
        borrowableBitmap: eMode.eMode.borrowableBitmap.toString(2).padStart(256, '0'),
      },
    }));
  }

  /**
   * Get the list of all eModes in the pool
   * @returns {Promise<readonly EModeData[]>} - Array of eMode data
   */
  public async getEModes(): Promise<readonly EModeData[]> {
    return this.hubProvider.publicClient.readContract({
      address: this.uiPoolDataProvider,
      abi: uiPoolDataAbi,
      functionName: 'getEModes',
      args: [this.poolAddressesProvider],
    });
  }
  /**
   * Get the list of all reserves in the pool
   * @param unfiltered - If true, returns all reserves in the pool (including bnUSD (debt) reserve); if false (default), filters out bnUSD.
   * @returns {Promise<readonly Address[]>} - Array of reserve addresses
   */
  public async getReservesList(unfiltered = false): Promise<readonly Address[]> {
    const reservesList = await this.hubProvider.publicClient.readContract({
      address: this.uiPoolDataProvider,
      abi: uiPoolDataAbi,
      functionName: 'getReservesList',
      args: [this.poolAddressesProvider],
    });

    if (unfiltered) {
      return reservesList;
    }

    // filter out bnUSD (debt) reserve by default
    return reservesList.filter(
      reserve =>
        reserve.toLowerCase() !== getMoneyMarketConfig(this.hubProvider.chainConfig.chain.id).bnUSD.toLowerCase(),
    );
  }

  /**
   * @description Get the bnUSD facilitator bucket
   * @returns {Promise<readonly [bigint, bigint]>} - The bnUSD [cap, current borrowed]
   */
  public async getBnusdFacilitatorBucket(): Promise<readonly [bigint, bigint]> {
    return this.hubProvider.publicClient.readContract({
      address: getMoneyMarketConfig(this.hubProvider.chainConfig.chain.id).bnUSD,
      abi: erc20BnusdAbi,
      functionName: 'getFacilitatorBucket',
      args: [getMoneyMarketConfig(this.hubProvider.chainConfig.chain.id).bnUSDAToken],
    });
  }

  /**
   * Get detailed data for all reserves in the pool
   * @returns {Promise<readonly [readonly AggregatedReserveData[], BaseCurrencyInfo]>} - Tuple containing array of reserve data and base currency info
   */
  public async getReservesData(): Promise<readonly [readonly AggregatedReserveData[], BaseCurrencyInfo]> {
    const [reserveData, bnUSDFacilitatorBucket] = await Promise.all([
      this.hubProvider.publicClient.readContract({
        address: this.uiPoolDataProvider,
        abi: uiPoolDataAbi,
        functionName: 'getReservesData',
        args: [this.poolAddressesProvider],
      }),
      this.getBnusdFacilitatorBucket(),
    ]);

    const [cap, currentBorrowed] = bnUSDFacilitatorBucket;
    const reserves = reserveData[0];
    const baseCurrencyInfo = reserveData[1];
    const bnUSD = getMoneyMarketConfig(this.hubProvider.chainConfig.chain.id).bnUSD.toLowerCase();
    const bnUSDVault = getMoneyMarketConfig(this.hubProvider.chainConfig.chain.id).bnUSDVault.toLowerCase();

    // merge bnUSD vault and bnUSD Debt (bnUSD) reserves into one bnUSD reserve (vault)
    const bnUSDReserve = reserves.find(r => bnUSD === r.underlyingAsset.toLowerCase());
    const bnUSDVaultReserve = reserves.find(r => bnUSDVault === r.underlyingAsset.toLowerCase());

    if (!bnUSDReserve || !bnUSDVaultReserve) {
      return reserveData;
    }

    const mergedBNUSDReserve = {
      ...bnUSDVaultReserve,
      borrowCap: cap,
      availableLiquidity: cap - currentBorrowed,
      totalScaledVariableDebt: bnUSDReserve.totalScaledVariableDebt + bnUSDVaultReserve.totalScaledVariableDebt,
      virtualUnderlyingBalance: bnUSDReserve.virtualUnderlyingBalance + bnUSDVaultReserve.virtualUnderlyingBalance,
      accruedToTreasury: bnUSDReserve.accruedToTreasury + bnUSDVaultReserve.accruedToTreasury,
      variableBorrowRate: bnUSDReserve.variableBorrowRate,
    };

    return [
      [
        mergedBNUSDReserve,
        ...reserves.filter(
          r => r.underlyingAsset.toLowerCase() !== bnUSD && r.underlyingAsset.toLowerCase() !== bnUSDVault,
        ),
      ],
      baseCurrencyInfo,
    ];
  }

  /**
   * Get user-specific reserve data
   * @param userAddress Address of the user
   * @param uiPoolDataProvider - The address of the UI Pool Data Provider
   * @param poolAddressesProvider - The address of the Pool Addresses Provider
   * @returns {Promise<readonly [readonly UserReserveData[], number]>} - Tuple containing array of user reserve data and eMode category ID
   */
  public async getUserReservesData(userAddress: Address): Promise<readonly [readonly UserReserveData[], number]> {
    const userReserves = await this.hubProvider.publicClient.readContract({
      address: this.uiPoolDataProvider,
      abi: uiPoolDataAbi,
      functionName: 'getUserReservesData',
      args: [this.poolAddressesProvider, userAddress],
    });

    const userReservesData = userReserves[0];
    const eModeCategoryId = userReserves[1];
    const bnUSD = getMoneyMarketConfig(this.hubProvider.chainConfig.chain.id).bnUSD.toLowerCase();
    const bnUSDVault = getMoneyMarketConfig(this.hubProvider.chainConfig.chain.id).bnUSDVault.toLowerCase();

    // merge bnUSD vault and bnUSD Debt (bnUSD) reserves into one bnUSD reserve (vault)
    const bnUSDReserve = userReservesData.find(r => bnUSD === r.underlyingAsset.toLowerCase());
    const bnUSDVaultReserve = userReservesData.find(r => bnUSDVault === r.underlyingAsset.toLowerCase());

    if (!bnUSDReserve || !bnUSDVaultReserve) {
      return userReserves;
    }

    const mergedBNUSDReserve = {
      ...bnUSDVaultReserve,
      scaledATokenBalance: bnUSDReserve.scaledATokenBalance + bnUSDVaultReserve.scaledATokenBalance,
      scaledVariableDebt: bnUSDReserve.scaledVariableDebt + bnUSDVaultReserve.scaledVariableDebt,
    };

    return [
      [
        mergedBNUSDReserve,
        ...userReservesData.filter(
          r => r.underlyingAsset.toLowerCase() !== bnUSD && r.underlyingAsset.toLowerCase() !== bnUSDVault,
        ),
      ],
      eModeCategoryId,
    ];
  }

  /**
   * Get the reserves data humanized
   * @returns {Promise<ReservesDataHumanized>} - The reserves data humanized
   */
  public async getReservesHumanized(): Promise<ReservesDataHumanized> {
    const [reservesRaw, poolBaseCurrencyRaw] = await this.getReservesData();

    const reservesData: ReserveDataHumanized[] = reservesRaw.map((reserveRaw, index) => {
      const virtualUnderlyingBalance = reserveRaw.virtualUnderlyingBalance.toString();
      const { virtualAccActive } = reserveRaw;
      return {
        originalId: index,
        id: `${this.hubProvider.chainConfig.chain.id}-${reserveRaw.underlyingAsset}-${this.poolAddressesProvider}`.toLowerCase(),
        underlyingAsset: reserveRaw.underlyingAsset.toLowerCase(),
        name: reserveRaw.name,
        symbol: reserveRaw.symbol,
        decimals: Number(reserveRaw.decimals),
        baseLTVasCollateral: reserveRaw.baseLTVasCollateral.toString(),
        reserveLiquidationThreshold: reserveRaw.reserveLiquidationThreshold.toString(),
        reserveLiquidationBonus: reserveRaw.reserveLiquidationBonus.toString(),
        reserveFactor: reserveRaw.reserveFactor.toString(),
        usageAsCollateralEnabled: reserveRaw.usageAsCollateralEnabled,
        borrowingEnabled: reserveRaw.borrowingEnabled,
        isActive: reserveRaw.isActive,
        isFrozen: reserveRaw.isFrozen,
        liquidityIndex: reserveRaw.liquidityIndex.toString(),
        variableBorrowIndex: reserveRaw.variableBorrowIndex.toString(),
        liquidityRate: reserveRaw.liquidityRate.toString(),
        variableBorrowRate: reserveRaw.variableBorrowRate.toString(),
        lastUpdateTimestamp: reserveRaw.lastUpdateTimestamp,
        aTokenAddress: reserveRaw.aTokenAddress.toString(),
        variableDebtTokenAddress: reserveRaw.variableDebtTokenAddress.toString(),
        interestRateStrategyAddress: reserveRaw.interestRateStrategyAddress.toString(),
        availableLiquidity: reserveRaw.availableLiquidity.toString(),
        totalScaledVariableDebt: reserveRaw.totalScaledVariableDebt.toString(),
        priceInMarketReferenceCurrency: reserveRaw.priceInMarketReferenceCurrency.toString(),
        priceOracle: reserveRaw.priceOracle,
        variableRateSlope1: reserveRaw.variableRateSlope1.toString(),
        variableRateSlope2: reserveRaw.variableRateSlope2.toString(),
        baseVariableBorrowRate: reserveRaw.baseVariableBorrowRate.toString(),
        optimalUsageRatio: reserveRaw.optimalUsageRatio.toString(),
        // new fields
        isPaused: reserveRaw.isPaused,
        debtCeiling: reserveRaw.debtCeiling.toString(),
        borrowCap: reserveRaw.borrowCap.toString(),
        supplyCap: reserveRaw.supplyCap.toString(),
        borrowableInIsolation: reserveRaw.borrowableInIsolation,
        accruedToTreasury: reserveRaw.accruedToTreasury.toString(),
        unbacked: reserveRaw.unbacked.toString(),
        isolationModeTotalDebt: reserveRaw.isolationModeTotalDebt.toString(),
        debtCeilingDecimals: Number(reserveRaw.debtCeilingDecimals),
        isSiloedBorrowing: reserveRaw.isSiloedBorrowing,
        flashLoanEnabled: reserveRaw.flashLoanEnabled,
        virtualAccActive,
        virtualUnderlyingBalance,
      };
    });

    const baseCurrencyData: PoolBaseCurrencyHumanized = {
      // this is to get the decimals from the unit so 1e18 = string length of 19 - 1 to get the number of 0
      marketReferenceCurrencyDecimals: poolBaseCurrencyRaw.marketReferenceCurrencyUnit.toString().length - 1,
      marketReferenceCurrencyPriceInUsd: poolBaseCurrencyRaw.marketReferenceCurrencyPriceInUsd.toString(),
      networkBaseTokenPriceInUsd: poolBaseCurrencyRaw.networkBaseTokenPriceInUsd.toString(),
      networkBaseTokenPriceDecimals: poolBaseCurrencyRaw.networkBaseTokenPriceDecimals,
    };

    return {
      reservesData,
      baseCurrencyData,
    };
  }
}
