'use client';

import { ChainSelector } from '@/components/dashboard/ChainSelector';
import { SuppliedAssetsList } from '@/components/dashboard/lists/SuppliedAssetsList/SuppliedAssetsList';
import { SupplyAssetsList } from '@/components/dashboard/lists/SupplyAssetsList/SupplyAssetsList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WalletModal } from '@/components/wallet-modal';
import { useXAccount } from '@new-world/xwagmi';
import { useState } from 'react';

export default function Page() {
  const xAccount = useXAccount('EVM');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <main className="">
      <div className="container mx-auto p-4 mt-10">
        {/* Market Selector */}
        <div className="mb-8 flex justify-center">
          <ChainSelector />
        </div>

        {/* Main Content Grid */}
        {xAccount?.address ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Your Supplies */}
              <SuppliedAssetsList />

              {/* Assets to Supply */}
              <SupplyAssetsList />
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
        ) : (
          <div className="flex justify-center items-center h-[600px] border-2">
            <Button onClick={() => setIsOpen(true)}>Connect</Button>
          </div>
        )}
      </div>
      <WalletModal isOpen={isOpen} onDismiss={() => setIsOpen(false)} />
    </main>
  );
}
