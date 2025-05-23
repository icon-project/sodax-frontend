'use client';

import { useEffect, useState } from 'react';

import { BaseCurrencyCard } from '@/components/markets/base-currency-card';
import { ReserveCard } from '@/components/markets/reserve-card';
import { UserReservesCard } from '@/components/markets/user-reserves-card';
import {
  type AggregatedReserveData,
  type BaseCurrencyInfo,
  SONIC_TESTNET_CHAIN_ID,
  type UserReserveData,
} from '@new-world/sdk';

const MONEY_MARKET_CONFIG = {
  lendingPool: '0xA33E8f7177A070D0162Eea0765d051592D110cDE',
  uiPoolDataProvider: '0x7997C9237D168986110A67C55106C410a2cF9d4f',
  poolAddressesProvider: '0x04b3f588578BF89B1D2af7283762E3375f0340dA',
} as const;

// This would typically come from environment variables
const privateKey = '0xd17e858c2aca0f31be86c01039dc070123e52df4d418535a9b3c92130d271120';

export default function MoneyMarketPage() {
  const [reserves, setReserves] = useState<AggregatedReserveData[]>([]);
  const [baseCurrencyInfo, setBaseCurrencyInfo] = useState<BaseCurrencyInfo | null>(null);
  const [userReserves, setUserReserves] = useState<UserReserveData[]>([]);
  const [eModeCategory, setEModeCategory] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const moneyMarket = new MoneyMarketService();

  //       // Get list of reserves
  //       const reservesList = await moneyMarket.getReservesList(
  //         MONEY_MARKET_CONFIG.uiPoolDataProvider as `0x${string}`,
  //         MONEY_MARKET_CONFIG.poolAddressesProvider as `0x${string}`,
  //         sonicTestnetEvmWallet,
  //       );

  //       // Get detailed reserve data
  //       const [reservesData, baseCurrencyData] = await moneyMarket.getReservesData(
  //         MONEY_MARKET_CONFIG.uiPoolDataProvider as `0x${string}`,
  //         MONEY_MARKET_CONFIG.poolAddressesProvider as `0x${string}`,
  //         sonicTestnetEvmWallet,
  //       );

  //       // Get user data - using the wallet address as the user address
  //       // const [userReservesData, eModeCategoryData] = await moneyMarket.getUserReservesData(
  //       //   await sonicTestnetEvmWallet.getAddress(),
  //       //   MONEY_MARKET_CONFIG.uiPoolDataProvider as `0x${string}`,
  //       //   MONEY_MARKET_CONFIG.poolAddressesProvider as `0x${string}`,
  //       //   sonicTestnetEvmWallet,
  //       // );

  //       setReserves([...reservesData]);
  //       setBaseCurrencyInfo(baseCurrencyData);
  //       // setUserReserves([...userReservesData]);
  //       // setEModeCategory(eModeCategoryData);
  //     } catch (err) {
  //       setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Money Market Dashboard</h1>

      <div className="grid gap-8">
        {/* User Reserves Section */}
        <section>
          <UserReservesCard reserves={userReserves} eModeCategory={eModeCategory} />
        </section>

        {/* Base Currency Section */}
        {baseCurrencyInfo && (
          <section>
            <BaseCurrencyCard info={baseCurrencyInfo} />
          </section>
        )}

        {/* Reserves Section */}
        <section className="grid gap-4">
          <h2 className="text-2xl font-semibold">Available Reserves</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {reserves.map(reserve => (
              <ReserveCard key={reserve.underlyingAsset} reserve={reserve} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
