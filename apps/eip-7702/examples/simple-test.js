// Simple EIP-7702 test script using proper authorization flow
const { createPublicClient, createWalletClient, http, parseEther, encodeFunctionData } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Simple test function
async function testEIP7702() {
  console.log('🚀 EIP-7702 Test with Proper Authorization\n');

  // Replace these with your actual values
  const BATCH_CONTRACT_ADDRESS = '0xA28a0E5c305C567F4aD2500aE1EAE658f6627b45'; // Your deployed BatchCallAndSponsor contract
  const MOCK_TARGET_ADDRESS = '0xe494026Aa7B0bc7eF3Ec31A037c8E6c0aa56Ff51'; // Your deployed MockTarget contract
  const PRIVATE_KEY = '...'; // Your private key

  try {
    // Setup
    const eoa = privateKeyToAccount(PRIVATE_KEY);
    const publicClient = createPublicClient({
      chain: { id: 14601, name: 'Sonic Blaze' },
      transport: http('https://rpc.testnet.soniclabs.com '),
    });

    const walletClient = createWalletClient({
      account: eoa,
      chain: { id: 14601, name: 'Sonic Blaze' },
      transport: http('https://rpc.testnet.soniclabs.com '),
    });
    const authorizationList = [];
    console.log('EOA Account:', eoa.address);
    console.log('Batch Contract:', BATCH_CONTRACT_ADDRESS);
    console.log('Mock Target:', MOCK_TARGET_ADDRESS);

    console.log('\n📝 Step 1: Check authorization');

    const code = await publicClient.getCode({ address: eoa.address });
    const DELEGATION_PREFIX = '0xef0100';
    let address = '0x0000000000000000000000000000000000000000';
    console.log('Code at EOA:', code);
    if (code.startsWith(DELEGATION_PREFIX)) {
      address = code.slice(8);
    }
    console.log('Code at EOA:', address);
    if (address !== BATCH_CONTRACT_ADDRESS.toLowerCase()) {
      // Step 1: Authorize designation of the Contract onto the EOA
      console.log('\n📝 Step 1.5: Signing authorization...');
      const authorization = await walletClient.signAuthorization({
        account: eoa,
        contractAddress: BATCH_CONTRACT_ADDRESS,
        executor: 'self',
      });
      authorizationList.push(authorization);
      console.log('✅ Authorization signed');
    }
    // Step 2: Create batch call data
    console.log('\n📦 Step 2: Creating batch call...');

    const calls = [
      {
        to: MOCK_TARGET_ADDRESS,
        value: parseEther('0'),
        data: encodeFunctionData({
          abi: [
            {
              inputs: [{ name: '_value', type: 'uint256' }],
              name: 'setValue',
              outputs: [],
              type: 'function',
            },
          ],
          functionName: 'setValue',
          args: [42n],
        }),
      },
    ];

    // Step 3: Designate the Contract on the EOA and invoke execute function
    console.log('\n⚡ Step 3: Executing batch call via EIP-7702...');
    const hash = await walletClient.sendTransaction({
      authorizationList,
      //                  ↑ Pass the Authorization as a parameter
      data: encodeFunctionData({
        abi: [
          {
            inputs: [
              {
                components: [
                  { name: 'to', type: 'address' },
                  { name: 'value', type: 'uint256' },
                  { name: 'data', type: 'bytes' },
                ],
                name: 'calls',
                type: 'tuple[]',
              },
            ],
            name: 'execute',
            outputs: [],
            stateMutability: 'payable',
            type: 'function',
          },
        ],
        functionName: 'execute',
        args: [calls],
      }),
      to: eoa.address, // Send to EOA address (EIP-7702 will handle delegation)
    });
    console.log('✅ Success! Transaction hash:', hash);

    console.log('\n💡 What happened:');
    console.log('  1. EOA signed authorization for the contract');
    console.log('  2. Transaction sent to EOA with authorization list');
    console.log('  3. EIP-7702 automatically delegated to BatchCallAndSponsor');
    console.log('  4. Batch execution completed successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

// Run the test
testEIP7702();
