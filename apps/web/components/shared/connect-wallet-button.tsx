'use client';

import type React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';
import { useEffect } from 'react';

interface ConnectWalletButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onWalletClick?: () => void;
  onConnectModalChange?: (isOpen: boolean) => void;
  isRegistering?: boolean;
  className?: string;
  buttonText?: {
    default?: string;
    connecting?: string;
    registering?: string;
  };
  showAddressInfo?: boolean;
  children?: React.ReactNode;
  variant?: 'yellow-dark' | 'yellow-soda' | 'white' | 'cherry-brighter';
}

const ConnectWalletButton = ({
  onWalletClick,
  onConnectModalChange,
  isRegistering = false,
  className = '',
  buttonText = {
    default: 'pre-register',
    connecting: 'connecting...',
    registering: 'registering...',
  },
  showAddressInfo = true,
  variant = 'yellow-dark',
  children,
  ...props
}: ConnectWalletButtonProps): React.ReactElement => {
  const getBgColor = () => {
    if (isRegistering) {
      return 'bg-cherry-brighter';
    }

    switch (variant) {
      case 'yellow-dark':
        return 'bg-yellow-dark hover:bg-yellow-soda';
      case 'yellow-soda':
        return 'bg-yellow-soda hover:bg-yellow-soda/80';
      case 'cherry-brighter':
        return 'bg-cherry-brighter hover:bg-cherry-brighter/80';
      case 'white':
        return 'bg-white hover:bg-white/80';
      default:
        return 'bg-yellow-dark hover:bg-yellow-dark/80';
    }
  };

  const getTextColor = () => {
    return variant === 'white' ? 'text-cherry-soda' : 'text-cherry-dark';
  };

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted, connectModalOpen }) => {
        useEffect(() => {
          if (onConnectModalChange) {
            onConnectModalChange(connectModalOpen);
          }
        }, [connectModalOpen, onConnectModalChange]);

        const ready = mounted && account;
        const connected = ready && account.address;
        return (
          <div className="flex flex-col items-center relative">
            <Button
              type="button"
              onClick={
                connected
                  ? onWalletClick
                  : () => {
                      openConnectModal();
                    }
              }
              disabled={isRegistering}
              className={cn(
                'min-w-[183px] h-[40px] font-[Shrikhand] rounded-full text-[14px] z-10 pt-[11px] cursor-pointer',
                getBgColor(),
                getTextColor(),
                'transition-all hover:scale-[102%]',
                className,
              )}
              {...props}
            >
              {!ready
                ? buttonText.default
                : !account.address
                  ? buttonText.connecting
                  : isRegistering
                    ? buttonText.registering
                    : buttonText.default}
            </Button>

            <div className="w-4 h-6 absolute -right-[15px] top-[0px]">
              <div className={cn('w-2 h-2 left-[7px] top-[10px] absolute rounded-full', getBgColor())} />
              <div className={cn('w-1 h-1 left-[9px] top-[-8px] absolute rounded-full', getBgColor())} />
              <div className={cn('w-1.5 h-1.5 left-[0px] top-[-2px] absolute rounded-full', getBgColor())} />
              <div className={cn('w-1 h-1 left-[12px] top-[1px] absolute rounded-full', getBgColor())} />
            </div>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default ConnectWalletButton;
