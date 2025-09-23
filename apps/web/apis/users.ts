import { recoverMessageAddress } from 'viem';

const BASE_URL = 'https://register-api.sodax.com';
export const registerUser = async ({
  address,
  signature,
  chainType,
  message,
}: { address: string; signature: string; chainType: string; message: string }) => {
  try {
    const response = await fetch(`${BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address, signature, message }),
    });
    // return await response.json();
  } catch (e) {}
};

export const getUser = async ({ address }: { address: string }) => {
  try {
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
  } catch (e) {
    console.log('AAA');
    return null;
  }
};

export const isRegisteredUser = async ({ address }: { address: string }) => {
  const user = await getUser({ address });

  if (user) {
    const { message, signature, address } = user;
    const recoveredAddress = await recoverMessageAddress({ message, signature });
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  }
  return false;
};
