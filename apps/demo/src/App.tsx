import React, { useEffect, useState } from 'react';
import './App.css';
// import ConnectIconWalletButton from '@/components/ConnectIconWalletButton';
// import ConnectStellarWalletButton from '@/components/ConnectStellarWalletButton';
import IntentStatus from '@/components/IntentStatus';
import ConnectEvmWalletButton from './components/ConnectEvmWalletButton';
// import ConnectSuiWalletButton from './components/ConnectSuiWalletButton';
import SwapCard from './components/SwapCard';
import type {
  Address,
  Hex,
  // SUI_MAINNET_CHAIN_ID,
  // ICON_MAINNET_CHAIN_ID,
  // STELLAR_MAINNET_CHAIN_ID,
} from '@new-world/sdk';
import { useAccount, useChainId } from 'wagmi';
import { SodaxProvider } from '@new-world/dapp-kit';
import { createBrowserRouter, RouterProvider } from 'react-router';
import HomePage from './pages/page';
import MoneyMarketPage from './pages/money-market/page';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/money-market',
    element: <MoneyMarketPage />,
  },
]);

function App() {
  const evmAccount = useAccount();
  const chainId = useChainId();
  console.log('evmAccount:', evmAccount);
  console.log('chainId:', chainId);

  const [intentTxHash, setIntentTxHash] = useState<Hex | undefined>(undefined);
  // const iconProvider = getProvider('icon', ICON_MAINNET_CHAIN_ID);
  // const suiProvider = getProvider('sui', SUI_MAINNET_CHAIN_ID);
  // const stellarProvider = getProvider('stellar', STELLAR_MAINNET_CHAIN_ID);
  const providers = [evmAccount.isConnected && evmAccount.address ? evmAccount : undefined];

  return (
    <SodaxProvider testnet={false}>
      <RouterProvider router={router} />
    </SodaxProvider>
  );
}

export default App;
