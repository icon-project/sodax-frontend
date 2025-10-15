// apps/demo/src/components/dex/CreatePool.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowUpDown, Info } from 'lucide-react';
import { getTokenInfo, createSonicPublicClient } from '@/lib/token-utils';
import type { TokenInfo } from '@/lib/token-utils';

interface CreatePoolProps {
  onPoolCreated?: (poolData: {
    token0: TokenInfo;
    token1: TokenInfo;
    startPrice: string;
    priceDirection: 'token0/token1' | 'token1/token0';
  }) => void;
}

export function CreatePool({ onPoolCreated }: CreatePoolProps) {
  const [token0Address, setToken0Address] = useState<string>('');
  const [token1Address, setToken1Address] = useState<string>('');
  const [startPrice, setStartPrice] = useState<string>('');
  const [tickSpacing, setTickSpacing] = useState<number>(10);
  const [token0Info, setToken0Info] = useState<TokenInfo | null>(null);
  const [token1Info, setToken1Info] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [priceDirection, setPriceDirection] = useState<'token0/token1' | 'token1/token0' | null>(null);
  const [orderWarning, setOrderWarning] = useState<string>('');

  const handleToken0Change = async (address: string) => {
    setToken0Address(address);
    if (address && address.length === 42) {
      try {
        const publicClient = createSonicPublicClient();
        const tokenInfo = await getTokenInfo(address as `0x${string}`, publicClient);
        setToken0Info(tokenInfo);
        updatePriceDirection();
      } catch (err) {
        console.error('Error fetching token0 info:', err);
        setToken0Info(null);
      }
    } else {
      setToken0Info(null);
    }
  };

  const handleToken1Change = async (address: string) => {
    setToken1Address(address);
    if (address && address.length === 42) {
      try {
        const publicClient = createSonicPublicClient();
        const tokenInfo = await getTokenInfo(address as `0x${string}`, publicClient);
        setToken1Info(tokenInfo);
        updatePriceDirection();
      } catch (err) {
        console.error('Error fetching token1 info:', err);
        setToken1Info(null);
      }
    } else {
      setToken1Info(null);
    }
  };

  const updatePriceDirection = () => {
    if (token0Info && token1Info) {
      // PancakeSwap/Uniswap V3 token ordering rule: token0 < token1 (by address)
      const token0AddressLower = token0Address.toLowerCase();
      const token1AddressLower = token1Address.toLowerCase();

      if (token0AddressLower < token1AddressLower) {
        // Current order is correct: token0 < token1
        setPriceDirection('token0/token1');
        setOrderWarning('');
      } else {
        // Current order is incorrect: token0 > token1
        setPriceDirection('token1/token0');
        setOrderWarning(
          '⚠️ Token order is incorrect! Token0 address must be lower than Token1 address. Please swap tokens.',
        );
      }
    }
  };

  const swapTokens = () => {
    const tempAddress = token0Address;
    const tempInfo = token0Info;

    setToken0Address(token1Address);
    setToken1Address(tempAddress);
    setToken0Info(token1Info);
    setToken1Info(tempInfo);

    // Clear price and warning when swapping
    setStartPrice('');
    setOrderWarning('');
    updatePriceDirection();
  };

  // Calculate adjusted price based on decimal differences
  const getAdjustedPrice = (userPrice: string, token0Decimals: number, token1Decimals: number): string => {
    if (!userPrice || !token0Decimals || !token1Decimals) return '0';
    const price = Number.parseFloat(userPrice);
    // For concentrated liquidity, we need to adjust based on the price direction
    // If token0 has more decimals than token1, we multiply by 10^(token0Decimals - token1Decimals)
    // If token1 has more decimals than token0, we divide by 10^(token1Decimals - token0Decimals)
    const decimalAdjustment = 10 ** (token0Decimals - token1Decimals);
    return (price * decimalAdjustment).toString();
  };

  const handleCreatePool = async () => {
    if (!token0Address || !token1Address || !startPrice || !tickSpacing) {
      setError('Please fill in all fields');
      return;
    }

    if (!token0Info || !token1Info) {
      setError('Please wait for token information to load');
      return;
    }

    if (orderWarning) {
      setError('Please fix token order before creating pool');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Calculate adjusted price for different decimals
      const adjustedPrice = getAdjustedPrice(startPrice, token0Info.decimals, token1Info.decimals);

      // Here you would implement the actual pool creation logic
      // For now, we'll just simulate it
      console.log('Creating pool with:', {
        token0: { address: token0Address, info: token0Info },
        token1: { address: token1Address, info: token1Info },
        startPrice: {
          userInput: startPrice,
          adjustedForDecimals: adjustedPrice,
          decimalDifference: token1Info.decimals - token0Info.decimals,
          adjustmentFactor: 10 ** (token1Info.decimals - token0Info.decimals),
        },
        tickSpacing,
        priceDirection,
        feeTier: 8388608, // Dynamic fees
        hook: '0x0000000000000000000000000000000000000000', // Default hook
      });

      // Simulate pool creation
      await new Promise(resolve => setTimeout(resolve, 2000));

      setError('');
      if (onPoolCreated) {
        onPoolCreated({
          token0: token0Info,
          token1: token1Info,
          startPrice,
          priceDirection,
        });
      }
    } catch (err) {
      console.error('Error creating pool:', err);
      setError(`Failed to create pool: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Create New Pool</span>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Dynamic Fees
            </Badge>
            <Badge variant="secondary">Default Hook</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Addresses */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token0">Token 0 Address</Label>
            <div className="flex gap-2">
              <Input
                id="token0"
                type="text"
                placeholder="0x..."
                value={token0Address}
                onChange={e => handleToken0Change(e.target.value)}
                className="flex-1"
              />
              {token0Info && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                  <span className="font-semibold">{token0Info.symbol}</span>
                  <span className="text-xs text-muted-foreground">{formatAddress(token0Address)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={swapTokens}
              disabled={!token0Address || !token1Address}
              className="px-4"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Swap Tokens
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token1">Token 1 Address</Label>
            <div className="flex gap-2">
              <Input
                id="token1"
                type="text"
                placeholder="0x..."
                value={token1Address}
                onChange={e => handleToken1Change(e.target.value)}
                className="flex-1"
              />
              {token1Info && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                  <span className="font-semibold">{token1Info.symbol}</span>
                  <span className="text-xs text-muted-foreground">{formatAddress(token1Address)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Price Direction Info */}
        {priceDirection && token0Info && token1Info && (
          <div
            className={`p-3 rounded-lg ${orderWarning ? 'bg-red-50 dark:bg-red-950/20' : 'bg-blue-50 dark:bg-blue-950/20'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Info className={`h-4 w-4 ${orderWarning ? 'text-red-600' : 'text-blue-600'}`} />
              <span
                className={`text-sm font-medium ${orderWarning ? 'text-red-800 dark:text-red-200' : 'text-blue-800 dark:text-blue-200'}`}
              >
                {orderWarning ? 'Token Order Issue' : 'Token Order Confirmed'}
              </span>
            </div>
            {orderWarning ? (
              <div className="text-xs text-red-700 dark:text-red-300">
                <div className="mb-2 font-medium">{orderWarning}</div>
                <div className="mb-1">
                  <strong>Current Token 0:</strong> {token0Info.symbol} ({formatAddress(token0Address)})
                </div>
                <div className="mb-1">
                  <strong>Current Token 1:</strong> {token1Info.symbol} ({formatAddress(token1Address)})
                </div>
                <div className="font-medium">Required: Token0 address &lt; Token1 address</div>
              </div>
            ) : (
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <div className="mb-1">
                  <strong>Token 0:</strong> {token0Info.symbol} ({formatAddress(token0Address)})
                </div>
                <div className="mb-1">
                  <strong>Token 1:</strong> {token1Info.symbol} ({formatAddress(token1Address)})
                </div>
                <div className="font-medium">
                  Price direction: {token0Info.symbol}/{token1Info.symbol}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Start Price */}
        <div className="space-y-2">
          <Label htmlFor="startPrice">Start Price</Label>
          <div className="space-y-2">
            <Input
              id="startPrice"
              type="number"
              placeholder="Enter initial price"
              value={startPrice}
              onChange={e => setStartPrice(e.target.value)}
              step="0.000001"
              min="0"
            />
            {priceDirection && token0Info && token1Info && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  Price is in {token0Info.symbol}/{token1Info.symbol} format
                </div>
                <div className="font-medium">
                  Decimal Adjustment: {token0Info.decimals} → {token1Info.decimals}
                </div>
                {token0Info.decimals !== token1Info.decimals && (
                  <div className="text-orange-600 dark:text-orange-400">
                    ⚠️ Different decimals detected! Price will be adjusted by 10^
                    {token0Info.decimals - token1Info.decimals}
                  </div>
                )}
                <div>
                  Example: If 1 {token0Info.symbol} = 100 {token1Info.symbol}, enter 100
                  {token0Info.decimals !== token1Info.decimals && (
                    <span className="block mt-1">
                      (Raw price will be: {100 * 10 ** (token0Info.decimals - token1Info.decimals)})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Price Display in Both Formats */}
            {startPrice && token0Info && token1Info && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Display</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {token0Info.symbol}/{token1Info.symbol}:
                    </span>
                    <span className="font-mono font-medium">{startPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {token1Info.symbol}/{token0Info.symbol}:
                    </span>
                    <span className="font-mono font-medium">
                      {Number.parseFloat(startPrice) > 0 ? (1 / Number.parseFloat(startPrice)).toFixed(6) : '0'}
                    </span>
                  </div>
                  {token0Info.decimals !== token1Info.decimals && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-orange-600 dark:text-orange-400 font-medium mb-1">
                        Adjusted for Decimals:
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {token0Info.symbol}/{token1Info.symbol}:
                        </span>
                        <span className="font-mono font-medium">
                          {getAdjustedPrice(startPrice, token0Info.decimals, token1Info.decimals)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {token1Info.symbol}/{token0Info.symbol}:
                        </span>
                        <span className="font-mono font-medium">
                          {(() => {
                            const adjusted = Number.parseFloat(
                              getAdjustedPrice(startPrice, token0Info.decimals, token1Info.decimals),
                            );
                            return adjusted > 0 ? (1 / adjusted).toFixed(6) : '0';
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tick Spacing */}
        <div className="space-y-2">
          <Label htmlFor="tickSpacing">Tick Spacing</Label>
          <Select value={tickSpacing.toString()} onValueChange={value => setTickSpacing(Number.parseInt(value, 10))}>
            <SelectTrigger>
              <SelectValue placeholder="Select tick spacing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="60">60</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">
            Tick spacing determines the granularity of price changes in the pool
          </div>
        </div>

        <Separator />

        {/* Pool Configuration Summary */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Pool Configuration</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Fee Tier:</span>
              <div className="font-semibold text-blue-600">Dynamic (8388608)</div>
            </div>
            <div>
              <span className="text-muted-foreground">Hook:</span>
              <div className="font-mono text-xs">Default Hook</div>
            </div>
            <div>
              <span className="text-muted-foreground">Tick Spacing:</span>
              <div>60 (Dynamic)</div>
            </div>
            <div>
              <span className="text-muted-foreground">Initial Price:</span>
              <div className="font-mono">{startPrice || 'Not set'}</div>
              {token0Info && token1Info && token0Info.decimals !== token1Info.decimals && startPrice && (
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Adjusted: {getAdjustedPrice(startPrice, token0Info.decimals, token1Info.decimals)}
                </div>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Tick Spacing:</span>
              <div className="font-semibold">{tickSpacing}</div>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleCreatePool}
          disabled={
            loading ||
            !token0Address ||
            !token1Address ||
            !startPrice ||
            !tickSpacing ||
            !token0Info ||
            !token1Info ||
            !!orderWarning
          }
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Pool...
            </>
          ) : (
            'Create Pool'
          )}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          💡 Dynamic fees will adjust automatically based on market volatility (0.01% - 1%)
        </div>
      </CardContent>
    </Card>
  );
}
