import React from 'react';
import './App.css';

import { SodaxProvider } from '@new-world/dapp-kit';

import { createBrowserRouter, Outlet, RouterProvider, Navigate } from 'react-router';
import HomePage from './pages/page';
import MoneyMarketPage from './pages/money-market/page';
import Header from './components/layout/header';

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
        element: <Navigate to="/money-market" />,
      },
      {
        path: '/money-market',
        element: <MoneyMarketPage />,
      },
    ],
  },
]);

function App() {
  return (
    <SodaxProvider testnet={false}>
      <RouterProvider router={router} />
    </SodaxProvider>
  );
}

export default App;
