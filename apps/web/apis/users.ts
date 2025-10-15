import { recoverMessageAddress } from 'viem';

const BASE_URL = 'https://register-api.sodax.com';

export const registerUser = async ({
  address,
  signature,
  chainType,
  message,
}: { address: string; signature: string; chainType: string; message: string }) => {
  try {
    if (chainType === 'EVM') {
      const response = await fetch(`${BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, signature, message }),
      });
      // return await response.json();
    } else {
      localStorage.setItem(`user-${address}`, JSON.stringify({ address, signature, message }));
    }
  } catch (e) {}
};

export const getUser = async ({ address, chainType }: { address: string; chainType: string }) => {
  try {
    if (chainType === 'EVM') {
      const response = await fetch(`${BASE_URL}/api/users/${address}`, {
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

  if (chainType === 'EVM') {
    if (user) {
      const { message, signature, address } = user;
      const recoveredAddress = await recoverMessageAddress({ message, signature });
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    }
  } else {
    return user !== null;
  }

  return false;
};
