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
    <div className="flex items-center content-center justify-center h-screen w-screen">
      <div className="flex flex-col flex items-center content-center justify-center">
        {providers.some(v => v === undefined) ? (
          <div className="text-center">
            <h1 className="pb-4">Please connect all wallets (Hana Wallet supported)</h1>
            <div className="flex space-x-2 flex items-center content-center justify-center">
              {/* {!iconProvider && <ConnectIconWalletButton />} */}
              {!evmAccount.isConnected && <ConnectEvmWalletButton />}
              {/* {!suiProvider && <ConnectSuiWalletButton />} */}
              {/* {!stellarProvider && <ConnectStellarWalletButton />} */}
            </div>
          </div>
        ) : (
          <div className="flex flex-col text-center pb-6">
            {/* {iconProvider && <div>Connected Icon address: {iconProvider.walletProvider.getWalletAddress()}</div>} */}
            {evmAccount.isConnected && (
              <div>
                <div>Connected EVM address: {evmAccount.address}</div>
                <div>Chain ID: {chainId}</div>
                <div>Chain Name: {evmAccount.chain?.name}</div>
              </div>
            )}
            {/* {suiProvider && <div>Connected SUI address: {suiProvider.walletProvider.getWalletAddress()}</div>} */}
            {/* {stellarProvider && <div>Connected Stellar address: {stellarProvider.walletProvider.getWalletAddress()}</div>} */}
          </div>
        )}
        {intentTxHash && <IntentStatus intent_tx_hash={intentTxHash} />}
        {providers.filter(v => v !== undefined).length === providers.length && (
          <SwapCard setIntentTxHash={setIntentTxHash} address={evmAccount.address as Address} />
        )}
      </div>
    </div>
  );
}

export default App;
