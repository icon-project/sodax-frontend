# Relayer API endpoints

## Mainnet

URL: `https://xcall-relay.nw.iconblockchain.xyz/`

Example usage:

```
curl --location 'https://xcall-relay.nw.iconblockchain.xyz/' \
--header 'Content-Type: application/json' \
--data '{
    "action": "get_packet",
    "params":{
        "chain_id": "6",
        "tx_hash": "0x882370113410cf4db551d89f2a8dc1819a2e4d9e1d5efe19068156d3ff1b91b7",
        "conn_sn": "169"
    }
}'
```

# Testnet

URL: `https://testnet-xcall-relay.nw.iconblockchain.xyz`

Example usage:

```
curl --location 'https://testnet-xcall-relay.nw.iconblockchain.xyz' \
--header 'Content-Type: application/json' \
--data '{
    "action": "get_packet",
    "params":{
        "chain_id": "6",
        "tx_hash": "0x882370113410cf4db551d89f2a8dc1819a2e4d9e1d5efe19068156d3ff1b91b7",
        "conn_sn": "169"
    }
}'
```
