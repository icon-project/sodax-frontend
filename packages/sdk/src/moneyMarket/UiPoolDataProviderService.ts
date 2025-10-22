import { type Address, getMoneyMarketConfig } from '@sodax/types';
import type { EvmHubProvider } from '../entities/Providers.js';
import { uiPoolDataAbi } from '../abis/uiPoolData.abi.js';
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
   * @param uiPoolDataProvider - The address of the UI Pool Data Provider
   * @param poolAddressesProvider - The address of the Pool Addresses Provider
   * @returns {Promise<readonly Address[]>} - Array of reserve addresses
   */
  public async getReservesList(): Promise<readonly Address[]> {
    return this.hubProvider.publicClient.readContract({
      address: this.uiPoolDataProvider,
      abi: uiPoolDataAbi,
      functionName: 'getReservesList',
      args: [this.poolAddressesProvider],
    });
  }

  /**
   * Get detailed data for all reserves in the pool
   * @returns {Promise<readonly [readonly AggregatedReserveData[], BaseCurrencyInfo]>} - Tuple containing array of reserve data and base currency info
   */
  public async getReservesData(): Promise<readonly [readonly AggregatedReserveData[], BaseCurrencyInfo]> {
    return this.hubProvider.publicClient.readContract({
      address: this.uiPoolDataProvider,
      abi: uiPoolDataAbi,
      functionName: 'getReservesData',
      args: [this.poolAddressesProvider],
    });
  }

  /**
   * Get user-specific reserve data
   * @param userAddress Address of the user
   * @param uiPoolDataProvider - The address of the UI Pool Data Provider
   * @param poolAddressesProvider - The address of the Pool Addresses Provider
   * @returns {Promise<readonly [readonly UserReserveData[], number]>} - Tuple containing array of user reserve data and eMode category ID
   */
  public async getUserReservesData(userAddress: Address): Promise<readonly [readonly UserReserveData[], number]> {
    return this.hubProvider.publicClient.readContract({
      address: this.uiPoolDataProvider,
      abi: uiPoolDataAbi,
      functionName: 'getUserReservesData',
      args: [this.poolAddressesProvider, userAddress],
    });
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
