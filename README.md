# @perkos/util-tokens

ERC20 token detection utilities for reading on-chain token metadata. Essential for EIP-712 domain construction in payment signatures.

## Installation

```bash
npm install @perkos/util-tokens
```

## Usage

```typescript
import { detectTokenInfo, getChainId, getRpcUrl } from "@perkos/util-tokens";

// Detect token information from contract
const tokenInfo = await detectTokenInfo(
  "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  "avalanche"
);

console.log(tokenInfo);
// {
//   address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
//   name: "USD Coin",
//   symbol: "USDC",
//   decimals: 6,
//   chainId: 43114
// }

// Get chain ID for a network
const chainId = getChainId("base-sepolia"); // 84532

// Get RPC URL
const rpcUrl = getRpcUrl("avalanche");
```

## Features

- **Automatic Caching**: Token info is cached to avoid repeated RPC calls
- **Multi-Network Support**: Avalanche, Base, Celo (mainnet and testnets)
- **CAIP-2 Support**: Accepts both legacy and CAIP-2 network identifiers
- **TypeScript**: Full type definitions included

## API

### `detectTokenInfo(tokenAddress, network, config?)`

Detect token information from a contract address.

- `tokenAddress`: ERC20 token contract address
- `network`: Network name or CAIP-2 identifier
- `config`: Optional configuration with custom RPC URL

Returns `TokenInfo | null`

### `getChainId(network)`

Get chain ID for a network name.

### `getRpcUrl(network, customUrl?)`

Get RPC URL for a network.

### `clearTokenCache()`

Clear the token info cache.

## Supported Networks

- Avalanche (43114)
- Avalanche Fuji (43113)
- Base (8453)
- Base Sepolia (84532)
- Celo (42220)
- Celo Sepolia (11142220)

## License

MIT
