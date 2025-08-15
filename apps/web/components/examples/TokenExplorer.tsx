// apps/web/components/examples/TokenExplorer.tsx
import React from 'react';
import { useSupportedTokens } from '@/hooks/useSupportedTokens';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, X } from 'lucide-react';
import type { SpokeChainId } from '@sodax/types';

/**
 * Example component demonstrating how to explore all supported solver tokens
 */
export const TokenExplorer: React.FC = () => {
  const {
    tokens,
    allTokens,
    tokensByChain,
    tokenSummary,
    isLoading,
    error,
    filterByChain,
    filterBySearch,
    filterBySymbol,
    clearFilters,
  } = useSupportedTokens();

  const [searchQuery, setSearchQuery] = React.useState<string>('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const query = e.target.value;
    setSearchQuery(query);
    filterBySearch(query);
  };

  const handleChainFilter = (chainId: string): void => {
    filterByChain(chainId as SpokeChainId);
  };

  const handleClearFilters = (): void => {
    setSearchQuery('');
    clearFilters();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading tokens...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Token Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{allTokens.length}</div>
                <div className="text-sm text-gray-600">Total Tokens</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{Object.keys(tokensByChain).length}</div>
                <div className="text-sm text-gray-600">Supported Chains</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{tokens.length}</div>
                <div className="text-sm text-gray-600">Filtered Tokens</div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search tokens by name or symbol..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full"
                />
              </div>
              <Button variant="outline" onClick={handleClearFilters} className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
            </div>

            {/* Chain Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleChainFilter('all')}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                All Chains
              </Button>
              {Object.keys(tokensByChain).map(chainId => (
                <Button key={chainId} variant="outline" size="sm" onClick={() => handleChainFilter(chainId)}>
                  {chainId}
                  <Badge variant="secondary" className="ml-2">
                    {tokensByChain[chainId as SpokeChainId]?.length || 0}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token List */}
      <Card>
        <CardHeader>
          <CardTitle>Tokens ({tokens.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokens.map(token => (
                <div
                  key={`${token.xChainId}-${token.address}`}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{token.symbol}</div>
                    <Badge variant="outline">{token.xChainId}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{token.name}</div>
                  <div className="text-xs text-gray-500 font-mono truncate">{token.address}</div>
                  <div className="text-xs text-gray-400 mt-1">Decimals: {token.decimals}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Token Summary by Chain */}
      <Card>
        <CardHeader>
          <CardTitle>Token Summary by Chain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(tokenSummary).map(([chainId, count]) => (
              <div
                key={chainId}
                className="text-center p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleChainFilter(chainId)}
              >
                <div className="font-semibold">{chainId}</div>
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-xs text-gray-500">tokens</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenExplorer;
