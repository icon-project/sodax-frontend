import { Button } from '@/components/ui/button';
import { defaultSourceChainId } from '@/constants';
import { type EvmChainId, getEvmViemChain } from '@new-world/sdk';
import React from 'react';
import { useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export default function ConnectEvmWalletButton() {
  const { connect } = useConnect();

  return (
    <Button
      onClick={() =>
        connect({ connector: injected(), chainId: getEvmViemChain(defaultSourceChainId as EvmChainId).id })
      }
    >
      Connect Evm Wallet
    </Button>
  );
}
