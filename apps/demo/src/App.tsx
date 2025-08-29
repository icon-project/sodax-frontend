import React from 'react';
import './App.css';

import { createBrowserRouter, Outlet, RouterProvider, Navigate } from 'react-router';
import MoneyMarketPage from './pages/money-market/page';
import Header from './components/shared/header';
import SolverPage from './pages/solver/page';
import BridgePage from './pages/bridge/page';

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
      {
        path: '/solver',
        element: <SolverPage />,
      },
      {
        path: '/bridge',
        element: <BridgePage />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
