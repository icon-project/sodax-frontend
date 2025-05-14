'use client';
import {
  AVALANCHE_FUJI_TESTNET_CHAIN_ID,
  EvmAssetManagerService,
  EvmHubProvider,
  type EvmSpokeChainConfig,
  EvmSpokeProvider,
  EvmSpokeService,
  EvmWalletAbstraction,
  EvmWalletProvider,
  type MoneyMarketConfig,
  MoneyMarketService,
  SONIC_TESTNET_CHAIN_ID,
  SpokeService,
  getHubChainConfig,
  spokeChainConfig,
  waitForTransactionReceipt,
} from '@new-world/sdk';
import { useMemo } from 'react';
import type { Address, Hash, Hex, TransactionReceipt } from 'viem';
import { formatUnits } from 'viem';
import { useAccount, useBalance, usePublicClient, useWalletClient } from 'wagmi';
import { avalancheFuji } from 'wagmi/chains';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { sonicBlazeTestnet } from './config';

const moneyMarketConfig: MoneyMarketConfig = {
  lendingPool: '0xA33E8f7177A070D0162Eea0765d051592D110cDE',
  uiPoolDataProvider: '0x7997C9237D168986110A67C55106C410a2cF9d4f',
  poolAddressesProvider: '0x04b3f588578BF89B1D2af7283762E3375f0340dA',
};
const sonicTestnetHubChainConfig = getHubChainConfig(SONIC_TESTNET_CHAIN_ID);
const avalancheFujiSpokeChainConfig = spokeChainConfig[AVALANCHE_FUJI_TESTNET_CHAIN_ID] as EvmSpokeChainConfig;

const moneyMarket = new MoneyMarketService();

export default function Page() {
  // const { address } = useAccount();
  // const { data: avaxBalance } = useBalance({
  //   address,
  //   chainId: avalancheFuji.id,
  // });

  // const avalancheFujiPublicClient = usePublicClient({
  //   chainId: avalancheFuji.id,
  // });
  // const { data: avalancheFujiWalletClient } = useWalletClient({
  //   chainId: avalancheFuji.id,
  // });
  // const sonicTestnetPublicClient = usePublicClient({
  //   chainId: sonicBlazeTestnet.id,
  // });
  // const { data: sonicTestnetWalletClient } = useWalletClient({
  //   chainId: sonicBlazeTestnet.id,
  // });

  // const sonicTestnetEvmWallet = useMemo(() => {
  //   if (!sonicTestnetPublicClient || !sonicTestnetWalletClient) {
  //     return undefined;
  //   }

  //   return new EvmWalletProvider({
  //     // @ts-ignore
  //     publicClient: sonicTestnetPublicClient,
  //     // @ts-ignore
  //     walletClient: sonicTestnetWalletClient,
  //   });
  // }, [sonicTestnetPublicClient, sonicTestnetWalletClient]);

  // const avalancheFujiEvmWallet = useMemo(() => {
  //   if (!avalancheFujiPublicClient || !avalancheFujiWalletClient) {
  //     return undefined;
  //   }

  //   return new EvmWalletProvider({
  //     // @ts-ignore
  //     publicClient: avalancheFujiPublicClient,
  //     // @ts-ignore
  //     walletClient: avalancheFujiWalletClient,
  //   });
  // }, [avalancheFujiPublicClient, avalancheFujiWalletClient]);

  // const sonicTestnetEvmHubProvider = useMemo(
  //   () => (sonicTestnetEvmWallet ? new EvmHubProvider(sonicTestnetEvmWallet, sonicTestnetHubChainConfig) : undefined),
  //   [sonicTestnetEvmWallet],
  // );

  // const avalancheFujiEvmSpokeProvider = useMemo(
  //   () =>
  //     avalancheFujiEvmWallet ? new EvmSpokeProvider(avalancheFujiEvmWallet, avalancheFujiSpokeChainConfig) : undefined,
  //   [avalancheFujiEvmWallet],
  // );

  // const handleSupplyAVAX = async () => {
  //   console.log('Supplying AVAX');
  //   console.log('avalancheFujiPublicClient', avalancheFujiPublicClient);
  //   console.log('avalancheFujiWalletClient', avalancheFujiWalletClient);
  //   console.log('sonicTestnetPublicClient', sonicTestnetPublicClient);
  //   console.log('sonicTestnetWalletClient', sonicTestnetWalletClient);

  //   if (!avalancheFujiEvmSpokeProvider) {
  //     throw new Error('avalancheFujiEvmSpokeProvider is not defined');
  //   }
  //   if (!sonicTestnetEvmHubProvider) {
  //     throw new Error('sonicTestnetEvmHubProvider is not defined');
  //   }

  //   const token = '0x0000000000000000000000000000000000000000';
  //   const amount = 100000000000000000n;
  //   const hubWallet = await EvmWalletAbstraction.getUserWallet(
  //     BigInt(avalancheFujiEvmSpokeProvider.chainConfig.chain.id),
  //     avalancheFujiEvmSpokeProvider.walletProvider.walletClient.account.address,
  //     sonicTestnetEvmHubProvider,
  //   );

  //   console.log('hubWallet', hubWallet);

  //   const data = MoneyMarketService.supplyData(
  //     token,
  //     hubWallet,
  //     amount,
  //     6, //avalancheFujiEvmSpokeProvider.chainConfig.chain.id,
  //     moneyMarketConfig,
  //   );

  //   console.log('spokeProvider instanceof EvmSpokeProvider', avalancheFujiEvmSpokeProvider instanceof EvmSpokeProvider);
  //   const txHash = await EvmSpokeService.deposit(
  //     {
  //       from: avalancheFujiEvmSpokeProvider.walletProvider.walletClient.account.address,
  //       token,
  //       amount,
  //       data,
  //     },
  //     avalancheFujiEvmSpokeProvider,
  //     sonicTestnetEvmHubProvider,
  //   );

  //   // EvmSpokeService.deposit(params as EvmSpokeDepositParams, spokeProvider, hubProvider);

  //   console.log('[supply] txHash', txHash);

  //   const txReceipt: TransactionReceipt = await waitForTransactionReceipt(
  //     txHash,
  //     sonicTestnetEvmHubProvider.walletProvider,
  //   );

  //   console.log(txReceipt);
  // };

  // const handleWithdrawAVAX = () => {
  //   console.log('Withdrawing AVAX');
  // };

  // const { data: userReserves } = useQuery({
  //   queryKey: ['userReserves', address],
  //   queryFn: () =>
  //     moneyMarket.getUserReservesData(
  //       // '0x64a4Cbe09adEB70111B387483d85023Af867609D' as Address,
  //       address as Address,
  //       moneyMarketConfig.uiPoolDataProvider as Address,
  //       moneyMarketConfig.poolAddressesProvider as Address,
  //       // @ts-ignore
  //       sonicTestnetEvmWallet,
  //     ),
  //   enabled: !!address && !!sonicTestnetEvmWallet,
  //   refetchInterval: 1000,
  // });

  // console.log('userReserves', userReserves);

  return (
    <main className="">
      <div className="container mx-auto p-4 mt-10">
        {/* Market Selector */}
        {/* <div className="mb-8 flex justify-center">
          <Select>
            <SelectTrigger className="w-[200px]">
              <div className="flex items-center gap-2">
                <SelectValue placeholder="Select a market" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eth">Ethereum</SelectItem>
              <SelectItem value="btc">Bitcoin</SelectItem>
              <SelectItem value="usdt">USDT</SelectItem>
            </SelectContent>
          </Select>
        </div> */}

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Your Supplies */}
            <Card>
              <CardHeader>
                <CardTitle>Your supplies</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>APY</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>AVAX</TableCell>
                      <TableCell>10</TableCell>
                      <TableCell>2%</TableCell>
                      <TableCell>
                        <Button variant="secondary" size="sm">
                          Withdraw
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Assets to Supply */}
            <Card>
              <CardHeader>
                <CardTitle>Assets to supply</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>APY</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>AVAX</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>2%</TableCell>
                      <TableCell>
                        <Button variant="secondary" size="sm">
                          Supply 0.1 AVAX
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6 opacity-30">
            {/* Your Borrows */}
            <Card>
              <CardHeader>
                <CardTitle>Your borrows</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>APY</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>bnUSD</TableCell>
                      <TableCell>10000</TableCell>
                      <TableCell>7%</TableCell>
                      <TableCell>
                        <Button variant="secondary" size="sm">
                          Repay
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Assets to Borrow */}
            <Card>
              <CardHeader>
                <CardTitle>Assets to borrow</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>APY</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>ETH</TableCell>
                      <TableCell>100</TableCell>
                      <TableCell>3.5%</TableCell>
                      <TableCell>
                        <Button variant="secondary" size="sm">
                          Borrow
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>WBTC</TableCell>
                      <TableCell>10</TableCell>
                      <TableCell>4.2%</TableCell>
                      <TableCell>
                        <Button variant="secondary" size="sm">
                          Borrow
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>USDC</TableCell>
                      <TableCell>1000000</TableCell>
                      <TableCell>5.8%</TableCell>
                      <TableCell>
                        <Button variant="secondary" size="sm">
                          Borrow
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
