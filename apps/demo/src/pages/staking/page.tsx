// apps/demo/src/pages/staking/page.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { SelectChain } from '@/components/solver/SelectChain';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { StakingService, SONIC_MAINNET_CHAIN_ID, spokeChainConfig, supportedSpokeChains } from '@sodax/sdk';
import type { SpokeChainId, XToken, UnstakeSodaRequest } from '@sodax/types';
import { getXChainType, useEvmSwitchChain, useWalletProvider, useXAccount, useXDisconnect } from '@sodax/wallet-sdk';
import { useAppStore } from '@/zustand/useAppStore';
import { ArrowDownUp, ArrowLeftRight, Coins, TrendingUp } from 'lucide-react';
import { normaliseTokenAmount, scaleTokenAmount } from '@/lib/utils';
import { useSpokeProvider, useSodaxContext } from '@sodax/dapp-kit';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSodaBalance } from '@/hooks/useSodaBalance';

export default function StakingPage() {
  const { openWalletModal } = useAppStore();
  const { sodax } = useSodaxContext();

  const [selectedChainId, setSelectedChainId] = useState<SpokeChainId>(SONIC_MAINNET_CHAIN_ID);
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [unstakeAmount, setUnstakeAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [claimRequestId, setClaimRequestId] = useState<string>('');

  const account = useXAccount(selectedChainId);
  const walletProvider = useWalletProvider(selectedChainId);
  const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);

  // Staking service instance
  const stakingService = useMemo(() => {
    if (!sodax?.hubProvider) return null;
    return new StakingService(sodax.hubProvider, 'https://api.sodax.io'); // Replace with actual relayer endpoint
  }, [sodax?.hubProvider]);

  // State for staking info
  const [stakingInfo, setStakingInfo] = useState<{
    totalStaked: bigint;
    userStaked: bigint;
    userXSodaBalance: bigint;
  } | null>(null);

  const [unstakingInfo, setUnstakingInfo] = useState<{
    userUnstakeSodaRequests: readonly UnstakeSodaRequest[];
    totalUnstaking: bigint;
  } | null>(null);

  // Loading states
  const [isLoadingStakingInfo, setIsLoadingStakingInfo] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Dialog states
  const [stakeDialogOpen, setStakeDialogOpen] = useState(false);
  const [unstakeDialogOpen, setUnstakeDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);

  // SODA token for the selected chain
  const sodaToken = useMemo(() => {
    const chainConfig = spokeChainConfig[selectedChainId];
    return chainConfig?.supportedTokens?.SODA || null;
  }, [selectedChainId]);

  // SODA balance for the connected wallet
  const { data: sodaBalance, isLoading: isLoadingSodaBalance } = useSodaBalance(selectedChainId, account.address);

  // Load staking info when account changes
  useEffect(() => {
    const loadStakingInfo = async () => {
      if (!stakingService || !account.address) return;

      setIsLoadingStakingInfo(true);
      try {
        const [stakingResult, unstakingResult] = await Promise.all([
          stakingService.getStakingInfo(account.address),
          stakingService.getUnstakingInfo(account.address),
        ]);

        if (stakingResult.ok) {
          setStakingInfo(stakingResult.value);
        }

        if (unstakingResult.ok) {
          setUnstakingInfo(unstakingResult.value);
        }
      } catch (error) {
        console.error('Failed to load staking info:', error);
      } finally {
        setIsLoadingStakingInfo(false);
      }
    };

    loadStakingInfo();
  }, [stakingService, account.address]);

  const handleStake = async () => {
    if (!stakingService || !account.address || !sodaToken || !stakeAmount) return;

    setIsStaking(true);
    try {
      const result = await stakingService.stake(
        {
          amount: scaleTokenAmount(stakeAmount, sodaToken.decimals),
          account: account.address,
          srcAsset: sodaToken.address,
        },
        spokeProvider,
        60000,
      );

      if (result.ok) {
        console.log('Stake successful:', result.value);
        setStakeDialogOpen(false);
        setStakeAmount('');
        // Refresh staking info
        window.location.reload();
      } else {
        console.error('Stake failed:', result.error);
      }
    } catch (error) {
      console.error('Stake error:', error);
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async () => {
    if (!stakingService || !account.address || !unstakeAmount) return;

    setIsUnstaking(true);
    try {
      const result = await stakingService.unstake(
        {
          amount: scaleTokenAmount(unstakeAmount, 18), // xSoda has 18 decimals
          account: account.address,
        },
        spokeProvider,
        60000,
      );

      if (result.ok) {
        console.log('Unstake successful:', result.value);
        setUnstakeDialogOpen(false);
        setUnstakeAmount('');
        // Refresh staking info
        window.location.reload();
      } else {
        console.error('Unstake failed:', result.error);
      }
    } catch (error) {
      console.error('Unstake error:', error);
    } finally {
      setIsUnstaking(false);
    }
  };

  const handleWithdraw = async () => {
    if (!stakingService || !account.address || !withdrawAmount) return;

    setIsWithdrawing(true);
    try {
      const result = await stakingService.withdraw(
        {
          amount: scaleTokenAmount(withdrawAmount, 18), // xSoda has 18 decimals
          account: account.address,
        },
        spokeProvider,
        60000,
      );

      if (result.ok) {
        console.log('Withdraw successful:', result.value);
        setWithdrawDialogOpen(false);
        setWithdrawAmount('');
        // Refresh staking info
        window.location.reload();
      } else {
        console.error('Withdraw failed:', result.error);
      }
    } catch (error) {
      console.error('Withdraw error:', error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleClaim = async () => {
    if (!stakingService || !claimRequestId) return;

    setIsClaiming(true);
    try {
      const result = await stakingService.claim(
        {
          requestId: BigInt(claimRequestId),
        },
        spokeProvider,
        60000,
      );

      if (result.ok) {
        console.log('Claim successful:', result.value);
        setClaimDialogOpen(false);
        setClaimRequestId('');
        // Refresh staking info
        window.location.reload();
      } else {
        console.error('Claim failed:', result.error);
      }
    } catch (error) {
      console.error('Claim error:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const disconnect = useXDisconnect();
  const handleDisconnect = () => {
    disconnect(getXChainType(selectedChainId));
  };

  return (
    <div className="flex flex-col items-center content-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center flex items-center gap-2">
            <Coins className="h-6 w-6" />
            SODA Staking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chain Selection */}
          <div className="space-y-2">
            <Label>Select Chain</Label>
            <SelectChain
              chainList={supportedSpokeChains}
              value={selectedChainId}
              setChain={setSelectedChainId}
              placeholder="Select chain"
              id="staking-chain"
              label="Chain"
            />
          </div>

          {/* Account Connection */}
          <div className="space-y-2">
            <Label>Account</Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Connect wallet to see address"
                value={account.address || ''}
                disabled={true}
              />
              {account.address ? (
                <Button onClick={handleDisconnect}>Disconnect</Button>
              ) : (
                <Button onClick={openWalletModal}>Connect</Button>
              )}
            </div>
          </div>

          {/* SODA Balance */}
          {account.address && sodaToken && (
            <div className="space-y-2">
              <Label>SODA Balance</Label>
              <div className="p-4 border rounded-lg bg-muted/50">
                {isLoadingSodaBalance ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold">
                      {normaliseTokenAmount(sodaBalance || 0n, sodaToken.decimals)} {sodaToken.symbol}
                    </div>
                    <div className="text-sm text-muted-foreground">Available for staking</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Staking Info */}
          {account.address && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Staking Information</h3>
              {isLoadingStakingInfo ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : stakingInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Staked</div>
                    <div className="text-lg font-semibold">
                      {normaliseTokenAmount(stakingInfo.totalStaked, 18)} SODA
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Your Staked</div>
                    <div className="text-lg font-semibold">{normaliseTokenAmount(stakingInfo.userStaked, 18)} SODA</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">xSODA Balance</div>
                    <div className="text-lg font-semibold">
                      {normaliseTokenAmount(stakingInfo.userXSodaBalance, 18)} xSODA
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">No staking information available</div>
              )}
            </div>
          )}

          {/* Action Tabs */}
          {account.address && (
            <Tabs defaultValue="stake" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="stake">Stake</TabsTrigger>
                <TabsTrigger value="unstake">Unstake</TabsTrigger>
                <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                <TabsTrigger value="claim">Claim</TabsTrigger>
              </TabsList>

              <TabsContent value="stake" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stake-amount">Amount to Stake (SODA)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="stake-amount"
                      type="number"
                      placeholder="0.0"
                      value={stakeAmount}
                      onChange={e => setStakeAmount(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (sodaBalance && sodaToken) {
                          setStakeAmount(normaliseTokenAmount(sodaBalance, sodaToken.decimals));
                        }
                      }}
                      disabled={!sodaBalance || sodaBalance === 0n || !sodaToken}
                    >
                      Max
                    </Button>
                  </div>
                  {sodaBalance === 0n && !isLoadingSodaBalance && (
                    <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border">
                      ⚠️ You have no SODA tokens to stake. Get some SODA tokens first.
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => setStakeDialogOpen(true)}
                  disabled={!stakeAmount || !sodaToken || sodaBalance === 0n}
                  className="w-full"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Stake SODA
                </Button>
              </TabsContent>

              <TabsContent value="unstake" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unstake-amount">Amount to Unstake (xSODA)</Label>
                  <Input
                    id="unstake-amount"
                    type="number"
                    placeholder="0.0"
                    value={unstakeAmount}
                    onChange={e => setUnstakeAmount(e.target.value)}
                  />
                </div>
                <Button onClick={() => setUnstakeDialogOpen(true)} disabled={!unstakeAmount} className="w-full">
                  <ArrowDownUp className="mr-2 h-4 w-4" />
                  Unstake xSODA
                </Button>
              </TabsContent>

              <TabsContent value="withdraw" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount to Withdraw (xSODA)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="0.0"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <Button onClick={() => setWithdrawDialogOpen(true)} disabled={!withdrawAmount} className="w-full">
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Withdraw xSODA
                </Button>
              </TabsContent>

              <TabsContent value="claim" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="claim-request-id">Request ID to Claim</Label>
                  <Input
                    id="claim-request-id"
                    type="number"
                    placeholder="0"
                    value={claimRequestId}
                    onChange={e => setClaimRequestId(e.target.value)}
                  />
                </div>
                {unstakingInfo && unstakingInfo.userUnstakeSodaRequests.length > 0 && (
                  <div className="space-y-2">
                    <Label>Available Requests</Label>
                    <div className="space-y-1">
                      {unstakingInfo.userUnstakeSodaRequests.map((request, index) => (
                        <div key={index} className="p-2 border rounded text-sm">
                          ID: {index}, Amount: {normaliseTokenAmount(request.amount, 18)} SODA
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Button onClick={() => setClaimDialogOpen(true)} disabled={!claimRequestId} className="w-full">
                  <Coins className="mr-2 h-4 w-4" />
                  Claim SODA
                </Button>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Stake Dialog */}
      <Dialog open={stakeDialogOpen} onOpenChange={setStakeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stake SODA</DialogTitle>
            <DialogDescription>Stake {stakeAmount} SODA to receive xSODA shares</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">Your SODA Balance</div>
              <div className="text-lg font-semibold">
                {isLoadingSodaBalance ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  `${normaliseTokenAmount(sodaBalance || 0n, sodaToken?.decimals || 18)} ${sodaToken?.symbol || 'SODA'}`
                )}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Amount to Stake</div>
              <div className="text-lg font-semibold">{stakeAmount} SODA</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStakeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStake} disabled={isStaking}>
              {isStaking ? 'Staking...' : 'Confirm Stake'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unstake Dialog */}
      <Dialog open={unstakeDialogOpen} onOpenChange={setUnstakeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unstake xSODA</DialogTitle>
            <DialogDescription>Unstake {unstakeAmount} xSODA shares to initiate unstaking process</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnstakeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUnstake} disabled={isUnstaking}>
              {isUnstaking ? 'Unstaking...' : 'Confirm Unstake'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw xSODA</DialogTitle>
            <DialogDescription>Withdraw {withdrawAmount} xSODA shares to receive SODA tokens</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleWithdraw} disabled={isWithdrawing}>
              {isWithdrawing ? 'Withdrawing...' : 'Confirm Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Claim Dialog */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim SODA</DialogTitle>
            <DialogDescription>Claim unstaked SODA for request ID {claimRequestId}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleClaim} disabled={isClaiming}>
              {isClaiming ? 'Claiming...' : 'Confirm Claim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
