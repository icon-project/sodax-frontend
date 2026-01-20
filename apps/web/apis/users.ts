// import { recoverMessageAddress } from 'viem';
import bs58 from 'bs58';
const BASE_URL = 'https://api.sodax.com/v2/be/register';
// const BASE_URL = 'https://canary-api.sodax.com/v1/be/register';

const SIGN_SUPPORTED_CHAINS = ['EVM', 'SUI', 'STELLAR', 'SOLANA'];

export const registerUser = async ({
  address,
  signature,
  chainType,
  message,
}: { address: string; signature: string; chainType: string; message: string }) => {
  try {
    if (SIGN_SUPPORTED_CHAINS.includes(chainType)) {
      await fetch(`${BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          signature: chainType === 'SOLANA' ? bs58.encode(new TextEncoder().encode(signature)) : signature,
          message,
          chain: chainType,
        }),
      });
      // return await response.json();
    } else {
      localStorage.setItem(`user-${address}`, JSON.stringify({ address, signature, message, chain: chainType }));
    }
  } catch (e) {}
};

export const getUser = async ({ address, chainType }: { address: string; chainType: string }) => {
  try {
    if (SIGN_SUPPORTED_CHAINS.includes(chainType)) {
      const response = await fetch(`${BASE_URL}/users/${address}/chain/${chainType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const res = await response.json();
      if (res.success) {
        return res.data;
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
    if (user) {
      return address.toLowerCase() === user.address.toLowerCase() && chainType === user.chain;
      // const { message, signature, address } = user;
      // const recoveredAddress = await recoverMessageAddress({ message, signature });
      // return recoveredAddress.toLowerCase() === address.toLowerCase();
    }
  } else {
    return user !== null;
  }

  return false;
};
