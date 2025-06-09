export const rateLimitAbi = [
    {
        "type": "function",
        "name": "getAvailable",
        "inputs": [
            {
                "name": "token",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "withdrawalLimit",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "tokenConfigs",
        "inputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "ratePerSecond",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "lastUpdated",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "available",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "maxAvailable",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "lastRecordedBalance",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    }]