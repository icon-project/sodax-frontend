import React, { useMemo, useState } from 'react';
import {
  useApproveToken,
  useFeeClaimSwap,
  useFetchAssetsBalances,
  useIsTokenApproved,
  useSetSwapPreference,
  useSodaxContext,
} from '@sodax/dapp-kit';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ChainKeys, type SpokeChainKey } from '@sodax/types';
import { type Address, formatUnits, isAddress, parseUnits } from 'viem';
import { chainIdToChainName } from '@/constants';
import { SelectChain } from '@/components/solver/SelectChain';

const SONIC: typeof ChainKeys.SONIC_MAINNET = ChainKeys.SONIC_MAINNET;

/**
 * v2 SDK errors are tagged: `error.message` carries the CODE (e.g. FETCH_ASSETS_BALANCES_FAILED),
 * `error.cause` carries the underlying viem/RPC error. Surface both so users can debug.
 */
function formatSdkError(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;
  const cause = (err as { cause?: unknown }).cause;
  const causeText = cause instanceof Error ? ` — ${cause.message}` : '';
  return `${err.message}${causeText}`;
}

export default function PartnerFeeClaimPage() {
  const { sodax } = useSodaxContext();
  const sonicAccount = useXAccount(SONIC);
  const walletProvider = useWalletProvider(SONIC);
  const srcAddress = sonicAccount?.address as Address | undefined;

  const supportedSpokeChains = useMemo(() => sodax.config.getSupportedSpokeChains(), [sodax]);

  const [address, setAddress] = useState<string>('');
  const [submittedAddress, setSubmittedAddress] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const candidateAddress = useMemo(() => {
    const trimmed = address.trim();
    if (trimmed && isAddress(trimmed)) return trimmed;
    if (srcAddress) return srcAddress;
    return undefined;
  }, [address, srcAddress]);

  const {
    data: balances,
    isFetching: isFetchingBalances,
    error: balancesError,
  } = useFetchAssetsBalances({ queryAddress: submittedAddress });

  const balancesArray = useMemo(() => (balances ? Array.from(balances.values()) : []), [balances]);

  const handleFetchBalances = (): void => {
    setError(null);
    if (!candidateAddress) {
      setError('No address provided and wallet not connected');
      return;
    }
    setSubmittedAddress(candidateAddress);
  };

  // Approve token state
  const [approveTokenAddress, setApproveTokenAddress] = useState<string>('');
  const [approveError, setApproveError] = useState<string | null>(null);

  const isApprovedParams = useMemo(
    () =>
      approveTokenAddress.trim() && isAddress(approveTokenAddress.trim()) && srcAddress
        ? { srcChainKey: SONIC, srcAddress, token: approveTokenAddress.trim() as Address }
        : undefined,
    [approveTokenAddress, srcAddress],
  );

  const { data: isApproved } = useIsTokenApproved({ params: isApprovedParams });
  const { mutateAsync: approveToken, isPending: approveLoading } = useApproveToken();

  const handleApproveToken = async (): Promise<void> => {
    setApproveError(null);
    if (!srcAddress || !walletProvider || !approveTokenAddress.trim()) {
      setApproveError('Please provide a token address and connect your wallet');
      return;
    }
    const result = await approveToken({
      params: {
        srcChainKey: SONIC,
        srcAddress,
        token: approveTokenAddress.trim() as Address,
      },
      walletProvider,
    });
    if (!result.ok) {
      setApproveError(formatSdkError(result.error, 'Failed to approve token'));
    }
  };

  // Set swap preference state
  const [outputToken, setOutputToken] = useState<string>('');
  const [dstChain, setDstChain] = useState<SpokeChainKey>(SONIC);
  const [dstAddress, setDstAddress] = useState<string>('');
  const [setPreferenceError, setSetPreferenceError] = useState<string | null>(null);
  const [setPreferenceSuccess, setSetPreferenceSuccess] = useState<string | null>(null);
  const { mutateAsync: setSwapPreference, isPending: setPreferenceLoading } = useSetSwapPreference();

  const handleSetSwapPreference = async (): Promise<void> => {
    setSetPreferenceError(null);
    setSetPreferenceSuccess(null);
    if (!srcAddress || !walletProvider || !outputToken.trim() || !dstAddress.trim()) {
      setSetPreferenceError('Please fill in all fields and connect your wallet');
      return;
    }
    const result = await setSwapPreference({
      params: {
        srcChainKey: SONIC,
        srcAddress,
        outputToken: outputToken.trim() as Address,
        dstChain,
        dstAddress: dstAddress.trim(),
      },
      walletProvider,
    });
    if (!result.ok) {
      setSetPreferenceError(formatSdkError(result.error, 'Failed to set swap preference'));
      return;
    }
    setSetPreferenceSuccess(`Transaction sent: ${result.value}`);
  };

  // Swap state
  const [swapFromToken, setSwapFromToken] = useState<string>('');
  const [swapAmount, setSwapAmount] = useState<string>('');
  const [swapError, setSwapError] = useState<string | null>(null);
  const [swapSuccess, setSwapSuccess] = useState<string | null>(null);
  const { mutateAsync: feeClaimSwap, isPending: swapLoading } = useFeeClaimSwap();

  const handleSwap = async (): Promise<void> => {
    setSwapError(null);
    setSwapSuccess(null);
    if (!srcAddress || !walletProvider || !swapFromToken.trim() || !swapAmount.trim()) {
      setSwapError('Please fill in all fields and connect your wallet');
      return;
    }
    const token = balancesArray.find(a => a.address.toLowerCase() === swapFromToken.trim().toLowerCase());
    if (!token) {
      setSwapError('Token not found in balances. Please fetch balances first or provide a valid token address.');
      return;
    }
    const amount = parseUnits(swapAmount, token.decimal);
    const result = await feeClaimSwap({
      params: {
        srcChainKey: SONIC,
        srcAddress,
        fromToken: swapFromToken.trim() as Address,
        amount,
      },
      walletProvider,
    });
    if (!result.ok) {
      setSwapError(formatSdkError(result.error, 'Failed to execute swap'));
      return;
    }
    setSwapSuccess(`Swap executed successfully! Intent: ${result.value.solverExecutionResponse.intent_hash || 'N/A'}`);
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

            <Button onClick={handleFetchBalances} disabled={isFetchingBalances || !candidateAddress}>
              {isFetchingBalances ? 'Loading...' : 'Fetch Balances'}
            </Button>

            {error && <div className="p-3 bg-negative border border-red rounded-lg text-black text-sm">{error}</div>}
            {balancesError && (
              <div className="p-3 bg-negative border border-red rounded-lg text-black text-sm break-all">
                {formatSdkError(balancesError, 'Failed to fetch balances')}
              </div>
            )}

            {!srcAddress && (
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
              <Input
                id="approve-token"
                placeholder="0x..."
                value={approveTokenAddress}
                onChange={e => setApproveTokenAddress(e.target.value)}
                className="font-mono"
              />
              {balancesArray.length > 0 && (
                <select
                  className="w-full p-2 border rounded-lg text-sm"
                  onChange={e => {
                    if (e.target.value) {
                      setApproveTokenAddress(e.target.value);
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
              {isApprovedParams && isApproved !== undefined && (
                <p className={`text-sm ${isApproved ? 'text-green-500' : 'text-negative'}`}>
                  {isApproved ? '✓ Token is already approved' : 'Token is not approved'}
                </p>
              )}
            </div>

            <Button
              onClick={handleApproveToken}
              disabled={approveLoading || !srcAddress || !walletProvider || !approveTokenAddress.trim()}
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
              disabled={
                setPreferenceLoading ||
                !srcAddress ||
                !walletProvider ||
                !outputToken.trim() ||
                !dstAddress.trim()
              }
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
                      setSwapFromToken(e.target.value);
                      setSwapAmount('');
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
                  if (!token) return null;
                  const maxBalance = formatUnits(token.balance, token.decimal);
                  return (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSwapAmount(maxBalance)} className="text-xs">
                        Use Max ({maxBalance} {token.symbol})
                      </Button>
                    </div>
                  );
                })()}
            </div>

            <Button
              onClick={handleSwap}
              disabled={swapLoading || !srcAddress || !walletProvider || !swapFromToken.trim() || !swapAmount.trim()}
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
