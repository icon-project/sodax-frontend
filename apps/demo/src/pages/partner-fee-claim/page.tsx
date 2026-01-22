// apps/demo/src/pages/partner-fee-claim/page.tsx
import React, { useState } from 'react';
import { useSodaxContext, useSpokeProvider } from '@sodax/dapp-kit';
import { useXAccount, useWalletProvider } from '@sodax/wallet-sdk-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { SONIC_MAINNET_CHAIN_ID, type Address, type SpokeChainId } from '@sodax/types';
import { formatUnits, isAddress, parseUnits } from 'viem';
import type { AssetBalance, SonicSpokeProvider } from '@sodax/sdk';
import { chainIdToChainName } from '@/constants';
import { SelectChain } from '@/components/solver/SelectChain';

export default function PartnerFeeClaimPage() {
  const { sodax } = useSodaxContext();
  const sonicAccount = useXAccount(SONIC_MAINNET_CHAIN_ID);
  const walletProvider = useWalletProvider(SONIC_MAINNET_CHAIN_ID);
  const spokeProvider = useSpokeProvider(SONIC_MAINNET_CHAIN_ID, walletProvider) as SonicSpokeProvider | undefined;
  const [address, setAddress] = useState<string>('');
  const [balances, setBalances] = useState<Map<string, AssetBalance> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Approve token state
  const [approveTokenAddress, setApproveTokenAddress] = useState<string>('');
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [checkingApproval, setCheckingApproval] = useState(false);

  // Set swap preference state
  const [outputToken, setOutputToken] = useState<string>('');
  const [dstChain, setDstChain] = useState<SpokeChainId>(SONIC_MAINNET_CHAIN_ID);
  const [dstAddress, setDstAddress] = useState<string>('');
  const [setPreferenceLoading, setSetPreferenceLoading] = useState(false);
  const [setPreferenceError, setSetPreferenceError] = useState<string | null>(null);
  const [setPreferenceSuccess, setSetPreferenceSuccess] = useState<string | null>(null);

  // Swap state
  const [swapFromToken, setSwapFromToken] = useState<string>('');
  const [swapAmount, setSwapAmount] = useState<string>('');
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [swapSuccess, setSwapSuccess] = useState<string | null>(null);

  const supportedSpokeChains = sodax?.config?.getSupportedSpokeChains() || [];

  const handleFetchBalances = async () => {
    if (!spokeProvider) {
      setError('Please connect your Sonic wallet');
      return;
    }

    setLoading(true);
    setError(null);
    setBalances(null);

    try {
      const queryAddress = address.trim() || sonicAccount?.address;
      if (!queryAddress || !isAddress(queryAddress)) {
        setError('No address provided and wallet not connected');
        setLoading(false);
        return;
      }

      if (!sodax.partners.feeClaim) {
        setError('PartnerFeeClaimService not initialized');
        setLoading(false);
        return;
      }

      console.log('[PartnerFeeClaimPage] Fetching balances for address:', queryAddress);
      const result = await sodax.partners.feeClaim.fetchAssetsBalances({ address: queryAddress });

      if (!result.ok) {
        console.error('[PartnerFeeClaimPage] Error fetching balances:', result.error);
        setError(result.error.message || 'Failed to fetch balances');
        setLoading(false);
        return;
      }

      console.log('[PartnerFeeClaimPage] Balances result:', result.value);
      console.log('[PartnerFeeClaimPage] Balances map size:', result.value.size);
      console.log('[PartnerFeeClaimPage] Balances array length:', Array.from(result.value.values()).length);
      console.log(
        '[PartnerFeeClaimPage] Non-zero balances:',
        Array.from(result.value.values()).filter(a => a.balance > 0n).length,
      );

      setBalances(result.value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const balancesArray = balances ? Array.from(balances.values()) : [];

  // Check if token is approved
  const handleCheckApproval = async () => {
    if (!spokeProvider || !approveTokenAddress.trim()) {
      setApproveError('Please provide a token address');
      return;
    }

    setCheckingApproval(true);
    setApproveError(null);
    setIsApproved(null);

    try {
      if (!sodax.partners.feeClaim) {
        setApproveError('PartnerFeeClaimService not initialized');
        return;
      }
      const result = await sodax.partners.feeClaim.isTokenApproved({
        token: approveTokenAddress.trim() as Address,
        spokeProvider,
      });

      if (!result.ok) {
        setApproveError(result.error.message || 'Failed to check approval');
        return;
      }

      setIsApproved(result.value);
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setCheckingApproval(false);
    }
  };

  // Approve token
  const handleApproveToken = async () => {
    if (!spokeProvider || !approveTokenAddress.trim()) {
      setApproveError('Please provide a token address');
      return;
    }

    setApproveLoading(true);
    setApproveError(null);

    try {
      if (!sodax.partners.feeClaim) {
        setApproveError('PartnerFeeClaimService not initialized');
        return;
      }

      const result = await sodax.partners.feeClaim.approveToken({
        token: approveTokenAddress.trim() as Address,
        spokeProvider,
      });

      if (!result.ok) {
        setApproveError(result.error.message || 'Failed to approve token');
        return;
      }

      // Check approval status after transaction
      setTimeout(() => {
        handleCheckApproval();
      }, 2000);
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setApproveLoading(false);
    }
  };

  // Set swap preference
  const handleSetSwapPreference = async () => {
    if (!spokeProvider || !outputToken.trim() || !dstAddress.trim()) {
      setSetPreferenceError('Please fill in all fields');
      return;
    }

    setSetPreferenceLoading(true);
    setSetPreferenceError(null);
    setSetPreferenceSuccess(null);

    try {
      if (!sodax.partners.feeClaim) {
        setSetPreferenceError('PartnerFeeClaimService not initialized');
        return;
      }

      const result = await sodax.partners.feeClaim.setSwapPreference({
        params: {
          outputToken: outputToken.trim() as Address,
          dstChain,
          dstAddress: dstAddress.trim(),
        },
        spokeProvider,
      });

      if (!result.ok) {
        setSetPreferenceError(JSON.stringify(result.error.data.error) || 'Failed to set swap preference');
        return;
      }

      setSetPreferenceSuccess(`Transaction sent: ${result.value}`);
    } catch (err) {
      setSetPreferenceError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setSetPreferenceLoading(false);
    }
  };

  // Execute swap
  const handleSwap = async () => {
    if (!spokeProvider || !swapFromToken.trim() || !swapAmount.trim()) {
      setSwapError('Please fill in all fields');
      return;
    }

    // Find the token to get decimals
    const token = balancesArray.find(a => a.address.toLowerCase() === swapFromToken.trim().toLowerCase());
    if (!token) {
      setSwapError('Token not found in balances. Please fetch balances first or provide a valid token address.');
      return;
    }

    setSwapLoading(true);
    setSwapError(null);
    setSwapSuccess(null);

    try {
      if (!sodax.partners.feeClaim) {
        setSwapError('PartnerFeeClaimService not initialized');
        return;
      }

      const amount = parseUnits(swapAmount, token.decimal);

      const result = await sodax.partners.feeClaim.swap({
        params: {
          fromToken: swapFromToken.trim() as Address,
          amount,
        },
        spokeProvider,
      });

      if (!result.ok) {
        setSwapError(JSON.stringify(result.error) || 'Failed to execute swap');
        return;
      }

      setSwapSuccess(`Swap executed successfully! Intent: ${result.value.intent_hash || 'N/A'}`);
    } catch (err) {
      setSwapError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setSwapLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-cream-white mb-2">Partner Fee Claim Demo</h1>
          <p className="text-cream/70">Query asset balances for any address on Sonic chain</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fetch Asset Balances</CardTitle>
            <CardDescription>
              Enter an address to query balances, or leave empty to use your connected wallet address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address (optional)</Label>
              <Input
                id="address"
                placeholder={sonicAccount?.address || 'Enter address or connect wallet'}
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="font-mono"
              />
              {sonicAccount?.address && (
                <p className="text-sm text-cream/60">
                  Connected: {sonicAccount.address.slice(0, 10)}...{sonicAccount.address.slice(-8)}
                </p>
              )}
            </div>

            <Button onClick={handleFetchBalances} disabled={loading || !spokeProvider}>
              {loading ? 'Loading...' : 'Fetch Balances'}
            </Button>

            {error && <div className="p-3 bg-negative border border-red rounded-lg text-black text-sm">{error}</div>}

            {!spokeProvider && (
              <div className="p-3 bg-negative border border-negative rounded-lg text-black text-sm">
                Please connect your Sonic wallet to use this feature
              </div>
            )}
          </CardContent>
        </Card>

        {balances && (
          <Card>
            <CardHeader>
              <CardTitle>Asset Balances</CardTitle>
              <CardDescription>
                Found {balancesArray.length} assets with non-zero balances on Sonic chain
              </CardDescription>
            </CardHeader>
            <CardContent>
              {balancesArray.length === 0 ? (
                <p className="text-cream/60">No balances found</p>
              ) : (
                <div className="space-y-2">
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {balancesArray.map(asset => (
                      <div
                        key={asset.address}
                        className="flex items-center justify-between p-3 rounded-lg border bg-white/90 border-cherry-soda/30"
                      >
                        <div>
                          <div className="font-semibold text-black">{asset.symbol}</div>
                          <div className="text-sm text-gray-800">{asset.name}</div>
                          <div className="text-xs mt-1 text-gray-700">
                            From: {chainIdToChainName(asset.originalChain)}
                          </div>
                          <div className="text-xs font-mono mt-1 text-gray-600">
                            Wrapped: {asset.address.slice(0, 10)}...{asset.address.slice(-8)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-cherry-bright">
                            {formatUnits(asset.balance, asset.decimal)}
                          </div>
                          <div className="text-xs text-gray-700">{asset.symbol}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Approve Token</CardTitle>
            <CardDescription>Approve a token to the protocol intents contract (max allowance)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approve-token">Token Address</Label>
              <div className="flex gap-2">
                <Input
                  id="approve-token"
                  placeholder="0x..."
                  value={approveTokenAddress}
                  onChange={e => {
                    setApproveTokenAddress(e.target.value);
                    setIsApproved(null);
                  }}
                  className="font-mono"
                />
                <Button onClick={handleCheckApproval} disabled={checkingApproval || !spokeProvider} variant="outline">
                  {checkingApproval ? 'Checking...' : 'Check'}
                </Button>
              </div>
              {balancesArray.length > 0 && (
                <select
                  className="w-full p-2 border rounded-lg text-sm"
                  onChange={e => {
                    if (e.target.value) {
                      setApproveTokenAddress(e.target.value);
                      setIsApproved(null);
                    }
                  }}
                  value=""
                >
                  <option value="">Select from balances...</option>
                  {balancesArray.map(asset => (
                    <option key={asset.address} value={asset.address}>
                      {asset.symbol} ({asset.address.slice(0, 10)}...{asset.address.slice(-8)})
                    </option>
                  ))}
                </select>
              )}
              {isApproved !== null && (
                <p className={`text-sm ${isApproved ? 'text-green-500' : 'text-negative'}`}>
                  {isApproved ? '✓ Token is already approved' : 'Token is not approved'}
                </p>
              )}
            </div>

            <Button
              onClick={handleApproveToken}
              disabled={approveLoading || !spokeProvider || !approveTokenAddress.trim()}
            >
              {approveLoading ? 'Approving...' : 'Approve Token'}
            </Button>

            {approveError && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-black text-sm break-all">
                {approveError}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Set Swap Preference</CardTitle>
            <CardDescription>Configure auto-swap preferences for partner fee claims</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="output-token">Output Token Address</Label>
              <Input
                id="output-token"
                placeholder="0x..."
                value={outputToken}
                onChange={e => setOutputToken(e.target.value)}
                className="font-mono"
              />
              {balancesArray.length > 0 && (
                <select
                  className="w-full p-2 border rounded-lg text-sm"
                  onChange={e => {
                    if (e.target.value) {
                      setOutputToken(e.target.value);
                    }
                  }}
                  value=""
                >
                  <option value="">Select from balances...</option>
                  {balancesArray.map(asset => (
                    <option key={asset.address} value={asset.address}>
                      {asset.symbol} ({asset.address.slice(0, 10)}...{asset.address.slice(-8)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <SelectChain
              chainList={supportedSpokeChains}
              value={dstChain}
              setChain={setDstChain}
              label="Destination Chain"
              id="dst-chain"
            />

            <div className="space-y-2">
              <Label htmlFor="dst-address">Destination Address</Label>
              <Input
                id="dst-address"
                placeholder="0x... or address"
                value={dstAddress}
                onChange={e => setDstAddress(e.target.value)}
                className="font-mono"
              />
              {sonicAccount?.address && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDstAddress(sonicAccount.address ?? '')}
                  className="text-xs"
                >
                  Use Connected Wallet
                </Button>
              )}
            </div>

            <Button
              onClick={handleSetSwapPreference}
              disabled={setPreferenceLoading || !spokeProvider || !outputToken.trim() || !dstAddress.trim()}
            >
              {setPreferenceLoading ? 'Setting...' : 'Set Swap Preference'}
            </Button>

            {setPreferenceError && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {setPreferenceError}
              </div>
            )}

            {setPreferenceSuccess && (
              <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-black text-sm">
                {setPreferenceSuccess}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execute Swap</CardTitle>
            <CardDescription>Create an intent auto-swap (minOutputAmount is always 0)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="swap-from-token">From Token Address</Label>
              <Input
                id="swap-from-token"
                placeholder="0x..."
                value={swapFromToken}
                onChange={e => setSwapFromToken(e.target.value)}
                className="font-mono"
              />
              {balancesArray.length > 0 && (
                <select
                  className="w-full p-2 border rounded-lg text-sm"
                  onChange={e => {
                    if (e.target.value) {
                      const selected = balancesArray.find(a => a.address === e.target.value);
                      setSwapFromToken(e.target.value);
                      if (selected) {
                        // Show max balance as placeholder
                        const maxBalance = formatUnits(selected.balance, selected.decimal);
                        setSwapAmount('');
                      }
                    }
                  }}
                  value=""
                >
                  <option value="">Select from balances...</option>
                  {balancesArray.map(asset => (
                    <option key={asset.address} value={asset.address}>
                      {asset.symbol} - Balance: {formatUnits(asset.balance, asset.decimal)} (
                      {asset.address.slice(0, 10)}...{asset.address.slice(-8)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="swap-amount">Amount</Label>
              <Input
                id="swap-amount"
                type="number"
                placeholder="0.0"
                value={swapAmount}
                onChange={e => setSwapAmount(e.target.value)}
                step="any"
              />
              {swapFromToken &&
                balancesArray.length > 0 &&
                (() => {
                  const token = balancesArray.find(a => a.address.toLowerCase() === swapFromToken.toLowerCase());
                  if (token) {
                    const maxBalance = formatUnits(token.balance, token.decimal);
                    return (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSwapAmount(maxBalance)}
                          className="text-xs"
                        >
                          Use Max ({maxBalance} {token.symbol})
                        </Button>
                      </div>
                    );
                  }
                  return null;
                })()}
            </div>

            <Button
              onClick={handleSwap}
              disabled={swapLoading || !spokeProvider || !swapFromToken.trim() || !swapAmount.trim()}
            >
              {swapLoading ? 'Swapping...' : 'Execute Swap'}
            </Button>

            {swapError && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {swapError}
              </div>
            )}

            {swapSuccess && (
              <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-black text-sm">
                {swapSuccess}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
