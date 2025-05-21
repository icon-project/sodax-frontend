## Intent Relay API Service

The Intent Relay API Service provides functionality for submitting transactions and retrieving transaction packets across different chains. This service is part of the cross-chain communication infrastructure.

### Available Actions

1. `submit` - Submit a transaction to the intent relay service
2. `get_transaction_packets` - Get transaction packets from the intent relay service
3. `get_packet` - Get a specific packet from the intent relay service

### Transaction Status Types

- `pending` - No signatures
- `validating` - Not enough signatures
- `executing` - Enough signatures, no confirmed txn-hash
- `executed` - Has confirmed transaction-hash

### API Examples

#### Submit Transaction

```typescript
const request = {
  action: 'submit',
  params: {
    chain_id: '1',
    tx_hash: '0x123',
  },
}  satisfies IntentRelayRequest<'submit'>;

const response: SubmitTxResponse = await submitTransaction(request, 'https://api.example.com/relay');
// Response:
{
  "success": true,
  "message": "Transaction registered"
}
```

#### Get Transaction Packets

```typescript
const request = {
  action: 'get_transaction_packets',
  params: {
    chain_id: '1',
    tx_hash: '0x123',
  },
} satisfies IntentRelayRequest<'get_transaction_packets'>;

const response: GetTransactionPacketsResponse = await getTransactionPackets(request, 'https://api.example.com/relay');

// Response:
{
    "success": true,
    "data": [
        {
            "src_chain_id": 6,
            "src_tx_hash": "0x23a7eae34f6acf5cfadc43e714a4d188b0d6526b95c82c9b969e69d7222df5de",
            "src_address": "a8e168789b1fa96de2fb816df56757ad950438a4",
            "status": "executed",
            "dst_chain_id": 146,
            "conn_sn": 54,
            "dst_address": "67a8cf2543a30b292a443430df213983951dca08",
            "dst_tx_hash": "0xd7f1cf40154d3123eda3a94622bae13d879307fd3526cb45dd50951fee9cd244",
            "signatures": [
                "c172723dba3aec0f98d6602fcfbbcae9873ce3f4fc0eded70d64b6ad3f7806aa0b22d0fa3ea57679ec05f8c51a8562c9c979d247330966e9aaaf34a4dfae64e001"
            ],
            "payload": "cafebabe"
        }
    ]
}
```

#### Get Packet

```typescript
const request = {
  action: 'get_packet',
  params: {
    chain_id: '1',
    tx_hash: '0x123...abc',
    conn_sn: '1'
  }
} satisfies IntentRelayRequest<'get_packet'>;

const response: GetPacketResponse = await getPacket(request, 'https://api.example.com/relay');
// Response:
{
    "success": true,
    "data": {
        "src_chain_id": 6,
        "src_tx_hash": "0x781554a94bbd2ebd79ebaa01c645781ddf46610e5f1af8e5735d58b95ca6fbd6",
        "src_address": "1d790ac96a0da4c249fd8838a7cc46b91fee3c5a",
        "status": "executing",
        "dst_chain_id": 21,
        "dst_address": "0x26f83c5996f79229ef16cf7ca49eeb8682535e81ab59c30e561cc317bcc96a4a::sampledapp::0xde956ead1ac2c8fa99cb9851cb10003d6a08b1fa3120a3f073d576389dbb44fc",
        "conn_sn": 14,
        "signatures": [
                "c172723dba3aec0f98d6602fcfbbcae9873ce3f4fc0eded70d64b6ad3f7806aa0b22d0fa3ea57679ec05f8c51a8562c9c979d247330966e9aaaf34a4dfae64e001"
            ],
        "payload": "cafebabe"
    }
}
```

### Type Definitions

For detailed type definitions, refer to the source code in `packages/sdk/src/services/intentRelay/IntentRelayApiService.ts`.