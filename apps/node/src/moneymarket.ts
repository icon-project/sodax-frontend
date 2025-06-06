import { argv } from 'node:process';
import {
  type AggregatedReserveData,
  type BaseCurrencyInfo,
  type EvmHubProviderConfig,
  getHubChainConfig,
  getMoneyMarketConfig,
  type HubChainId,
  type MoneyMarketConfig,
  Sodax,
  type SodaxConfig,
  SONIC_MAINNET_CHAIN_ID,
  type UserReserveData,
} from '@sodax/sdk';
import type { Address } from 'viem';

// load PK from .env
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const IS_TESTNET = process.env.IS_TESTNET === 'true';
const HUB_CHAIN_ID: HubChainId = SONIC_MAINNET_CHAIN_ID;
const HUB_RPC_URL = 'https://rpc.soniclabs.com';

const moneyMarketConfig: MoneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(HUB_CHAIN_ID),
} satisfies EvmHubProviderConfig;

const sodax = new Sodax({
  moneyMarket: moneyMarketConfig,
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

// Helper functions to format data
function formatPercentage(value: bigint, decimals = 27): string {
  return `${(Number(value) / 10 ** decimals).toFixed(2)}%`;
}

function formatBasisPoints(value: bigint): string {
  return `${(Number(value) / 100).toFixed(2)}%`;
}

async function displayReserveData(reserve: AggregatedReserveData) {
  console.log(`\n${reserve.name} (${reserve.symbol}):`);

  console.log('Asset Details:');
  console.log('- Underlying Asset:', reserve.underlyingAsset);
  console.log('- Decimals:', reserve.decimals.toString());
  console.log('- aToken Address:', reserve.aTokenAddress);

  console.log('\nLiquidity Info:');
  console.log('- Available Liquidity:', reserve.availableLiquidity.toString());
  console.log('- Total Variable Debt:', reserve.totalScaledVariableDebt.toString());
  console.log('- Supply Cap:', reserve.supplyCap.toString());
  console.log('- Borrow Cap:', reserve.borrowCap.toString());

  console.log('\nRates & Indexes:');
  console.log('- Borrow Rate:', formatPercentage(reserve.variableBorrowRate));
  console.log('- Supply Rate:', formatPercentage(reserve.liquidityRate));
  console.log('- Base Variable Borrow Rate:', formatPercentage(reserve.baseVariableBorrowRate));
  console.log('- Optimal Usage Ratio:', formatPercentage(reserve.optimalUsageRatio));
  console.log('- Variable Rate Slope 1:', formatPercentage(reserve.variableRateSlope1));
  console.log('- Variable Rate Slope 2:', formatPercentage(reserve.variableRateSlope2));

  console.log('\nRisk Parameters:');
  console.log('- Collateral Factor:', formatBasisPoints(reserve.baseLTVasCollateral));
  console.log('- Liquidation Threshold:', formatBasisPoints(reserve.reserveLiquidationThreshold));
  console.log('- Liquidation Bonus:', formatBasisPoints(reserve.reserveLiquidationBonus));
  console.log('- Reserve Factor:', formatBasisPoints(reserve.reserveFactor));
  console.log('- Debt Ceiling:', reserve.debtCeiling.toString());

  console.log('\nStatus:');
  console.log('- Is Active:', reserve.isActive ? 'Yes' : 'No');
  console.log('- Is Frozen:', reserve.isFrozen ? 'Yes' : 'No');
  console.log('- Is Paused:', reserve.isPaused ? 'Yes' : 'No');
  console.log('- Borrowing Enabled:', reserve.borrowingEnabled ? 'Yes' : 'No');
  console.log('- Flash Loans Enabled:', reserve.flashLoanEnabled ? 'Yes' : 'No');
  console.log('- Usage As Collateral:', reserve.usageAsCollateralEnabled ? 'Enabled' : 'Disabled');
  console.log('- Borrowable In Isolation:', reserve.borrowableInIsolation ? 'Yes' : 'No');
  console.log('- Siloed Borrowing:', reserve.isSiloedBorrowing ? 'Yes' : 'No');

  console.log('\nPricing:');
  console.log('- Price Oracle:', reserve.priceOracle);
  console.log('- Price In Market Currency:', reserve.priceInMarketReferenceCurrency.toString());

  console.log('\nVirtual Account Info:');
  console.log('- Virtual Account Active:', reserve.virtualAccActive ? 'Yes' : 'No');
  console.log('- Virtual Balance:', reserve.virtualUnderlyingBalance.toString());
}

function displayBaseCurrencyInfo(info: BaseCurrencyInfo) {
  console.log('\nBase Currency Info:');
  console.log('- Market Reference Price (USD):', info.marketReferenceCurrencyPriceInUsd.toString());
  console.log('- Network Base Token Price (USD):', info.networkBaseTokenPriceInUsd.toString());
  console.log('- Network Base Token Price Decimals:', info.networkBaseTokenPriceDecimals);
}

// Main function to fetch and display pool data
async function main() {
  try {
    // Get list of reserves
    console.log('Fetching reserves list...');
    const reserves = await sodax.moneyMarket.getReservesList(
      moneyMarketConfig.uiPoolDataProvider,
      moneyMarketConfig.poolAddressesProvider,
    );
    console.log('Available Reserves:', reserves);

    // Get detailed reserve data
    console.log('\nFetching detailed reserve data...');
    const [reservesData, baseCurrencyInfo] = await sodax.moneyMarket.getReservesData(
      moneyMarketConfig.uiPoolDataProvider,
      moneyMarketConfig.poolAddressesProvider,
    );

    // Display data for each reserve
    for (const reserve of reservesData) {
      await displayReserveData(reserve);
    }

    // Display base currency info
    displayBaseCurrencyInfo(baseCurrencyInfo);

    const userAddress = argv[2] as Address;
    const [userReserves, eModeCategory] = await sodax.moneyMarket.getUserReservesData(
      userAddress,
      moneyMarketConfig.uiPoolDataProvider,
      moneyMarketConfig.poolAddressesProvider,
    );

    console.log('\nUser Position:');
    console.log('E-Mode Category:', eModeCategory);
    userReserves.forEach((reserve: UserReserveData) => {
      if (Number(reserve.scaledATokenBalance) > 0 || Number(reserve.scaledVariableDebt) > 0) {
        console.log(`\nAsset ${reserve.underlyingAsset}:`);
        console.log('- Supplied:', reserve.scaledATokenBalance);
        console.log('- Borrowed:', reserve.scaledVariableDebt);
        console.log('- Used as Collateral:', reserve.usageAsCollateralEnabledOnUser ? 'Yes' : 'No');
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
