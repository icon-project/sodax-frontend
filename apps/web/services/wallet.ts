export async function registerWallet(address: string) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    throw new Error('Backend URL is not configured');
  }

  const response = await fetch(`${backendUrl}/api/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ evmAddress: address }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to register wallet');
  }

  return await response.json();
}

export async function checkWalletRegistration(address: string): Promise<boolean> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    throw new Error('Backend URL is not configured');
  }

  try {
    const response = await fetch(`${backendUrl}/api/users/check/${address}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.isRegistered || false;
    }

    // If user not found, return false
    if (response.status === 404) {
      return false;
    }

    throw new Error('Failed to check wallet registration');
  } catch (error) {
    console.error('Error checking wallet registration:', error);
    return false;
  }
}
