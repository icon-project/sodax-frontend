// import { recoverMessageAddress } from 'viem';
import bs58 from 'bs58';
const BASE_URL = 'https://api.sodax.com/v2/be/register';

const SIGN_SUPPORTED_CHAINS = ['EVM', 'SUI', 'STELLAR', 'SOLANA'];

export const registerUser = async ({
  address,
  signature,
  chainType,
  message,
}: { address: string; signature: string | Uint8Array; chainType: string; message: string }) => {
  if (SIGN_SUPPORTED_CHAINS.includes(chainType)) {
    const response = await fetch(`${BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address,
        signature: chainType === 'SOLANA' ? bs58.encode(Uint8Array.from(signature as Uint8Array)) : signature,
        message,
        chain: chainType,
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`registerUser failed: ${response.status} ${responseText}`);
    }
  } else {
    localStorage.setItem(`user-${address}`, JSON.stringify({ address, signature, message, chain: chainType }));
  }
};

export const getUser = async ({ address, chainType }: { address: string; chainType: string }) => {
  const normalizedAddress = chainType === 'EVM' ? address.toLowerCase() : address;

  try {
    if (SIGN_SUPPORTED_CHAINS.includes(chainType)) {
      const response = await fetch(`${BASE_URL}/users/${normalizedAddress}/chain/${chainType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const res = await response.json();
      if (res.success) {
        return res.data?.user ?? null;
      }
      return null;
    }

    return JSON.parse(localStorage.getItem(`user-${address}`) || 'null');
  } catch (e) {
    return null;
  }
};

export const isRegisteredUser = async ({ address, chainType }: { address: string; chainType: string }) => {
  const user = await getUser({ address, chainType });
  if (SIGN_SUPPORTED_CHAINS.includes(chainType)) {
    if (user && user.address && user.chain) {
      return address.toLowerCase() === user.address.toLowerCase() && chainType === user.chain;
    }
  } else {
    return user !== null;
  }

  return false;
};
