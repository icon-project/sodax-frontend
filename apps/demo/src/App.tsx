import React from 'react';
import './App.css';

import { createBrowserRouter, Outlet, RouterProvider, Navigate } from 'react-router';
import { ChainKeys } from '@sodax/types';
import Header from './components/shared/header';
import SolverPage from './pages/solver/page';
import MoneyMarketPage from './pages/money-market/page';
import BridgePage from './pages/bridge/page';
import DexPage from './pages/dex/page';
import StakingPage from './pages/staking/page';
import PartnerFeeClaimPage from './pages/partner-fee-claim/page';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <>
        <Header />
        <Outlet />
      </>
    ),
    children: [
      {
        path: '/',
        element: <Navigate to="/solver" />,
      },
      {
        path: '/solver',
        element: <SolverPage />,
      },
      {
        path: '/money-market',
        element: <Navigate to={`/money-market/${ChainKeys.ARBITRUM_MAINNET}`} replace />,
      },
      {
        path: '/money-market/:chainId',
        element: <MoneyMarketPage />,
      },
      {
        path: '/bridge',
        element: <BridgePage />,
      },
      {
        path: '/dex',
        element: <DexPage />,
      },
      {
        path: '/staking',
        element: <StakingPage />,
      },
      {
        path: '/partner-fee-claim',
        element: <PartnerFeeClaimPage />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
