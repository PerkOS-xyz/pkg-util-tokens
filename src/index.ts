/**
 * @perkos/token-detection
 * ERC20 token detection utilities for reading on-chain token metadata
 */

import { createPublicClient, http, type Address, type PublicClient } from "viem";
import {
  avalanche,
  avalancheFuji,
  base,
  baseSepolia,
  celo,
  celoAlfajores,
} from "viem/chains";

/**
 * Token information returned from detection
 */
export interface TokenInfo {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  chainId: number;
}

/**
 * Supported network names
 */
export type NetworkName =
  | "avalanche"
  | "avalanche-fuji"
  | "base"
  | "base-sepolia"
  | "celo"
  | "celo-sepolia";

/**
 * Network configuration options
 */
export interface NetworkConfig {
  rpcUrl?: string;
}

/**
 * Standard ERC20 ABI (minimal - just what we need)
 */
const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
] as const;

/**
 * Chain ID mappings
 */
const CHAIN_IDS: Record<string, number> = {
  avalanche: 43114,
  "avalanche-fuji": 43113,
  base: 8453,
  "base-sepolia": 84532,
  celo: 42220,
  "celo-sepolia": 11142220,
  // CAIP-2 format support
  "eip155:43114": 43114,
  "eip155:43113": 43113,
  "eip155:8453": 8453,
  "eip155:84532": 84532,
  "eip155:42220": 42220,
  "eip155:11142220": 11142220,
};

/**
 * Default RPC URLs
 */
const DEFAULT_RPC_URLS: Record<NetworkName, string> = {
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  "avalanche-fuji": "https://api.avax-test.network/ext/bc/C/rpc",
  base: "https://mainnet.base.org",
  "base-sepolia": "https://sepolia.base.org",
  celo: "https://forno.celo.org",
  "celo-sepolia": "https://forno.celo-sepolia.celo-testnet.org",
};

/**
 * Chain definitions
 */
const CHAINS: Record<NetworkName, any> = {
  avalanche,
  "avalanche-fuji": avalancheFuji,
  base,
  "base-sepolia": baseSepolia,
  celo,
  "celo-sepolia": celoAlfajores,
};

/**
 * CAIP-2 to legacy network mapping
 */
const CAIP2_TO_LEGACY: Record<string, NetworkName> = {
  "eip155:43114": "avalanche",
  "eip155:43113": "avalanche-fuji",
  "eip155:8453": "base",
  "eip155:84532": "base-sepolia",
  "eip155:42220": "celo",
  "eip155:11142220": "celo-sepolia",
};

// Token info cache to avoid repeated RPC calls
const tokenInfoCache = new Map<string, TokenInfo>();

/**
 * Convert CAIP-2 network format to legacy format
 * e.g., "eip155:43114" → "avalanche"
 */
export function toLegacyNetwork(network: string): NetworkName {
  if (!network.includes(":")) {
    return network as NetworkName;
  }
  return CAIP2_TO_LEGACY[network] || "avalanche";
}

/**
 * Get chain ID for a network
 */
export function getChainId(network: string): number {
  return CHAIN_IDS[network] || CHAIN_IDS.avalanche;
}

/**
 * Get RPC URL for a network
 */
export function getRpcUrl(network: string, customUrl?: string): string {
  if (customUrl) return customUrl;
  const legacyNetwork = toLegacyNetwork(network);
  return DEFAULT_RPC_URLS[legacyNetwork] || DEFAULT_RPC_URLS.avalanche;
}

/**
 * Get public client for a network
 */
export function getPublicClient(
  network: string,
  config?: NetworkConfig
): PublicClient {
  const legacyNetwork = toLegacyNetwork(network);
  const rpcUrl = getRpcUrl(network, config?.rpcUrl);
  const chain = CHAINS[legacyNetwork] || {
    id: getChainId(legacyNetwork),
    name: legacyNetwork,
    network: legacyNetwork,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  };

  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

/**
 * Detect token information from contract address
 * Results are cached to avoid repeated RPC calls
 *
 * @param tokenAddress - The ERC20 token contract address
 * @param network - Network name or CAIP-2 identifier
 * @param config - Optional network configuration
 * @returns Token information or null if detection fails
 *
 * @example
 * ```typescript
 * const tokenInfo = await detectTokenInfo(
 *   "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
 *   "avalanche"
 * );
 * // => { name: "USD Coin", symbol: "USDC", decimals: 6, ... }
 * ```
 */
export async function detectTokenInfo(
  tokenAddress: Address,
  network: string,
  config?: NetworkConfig
): Promise<TokenInfo | null> {
  const legacyNetwork = toLegacyNetwork(network);
  const cacheKey = `${tokenAddress.toLowerCase()}-${legacyNetwork}`;

  // Check cache first
  if (tokenInfoCache.has(cacheKey)) {
    return tokenInfoCache.get(cacheKey)!;
  }

  try {
    const client = getPublicClient(legacyNetwork, config);
    const chainId = getChainId(legacyNetwork);

    // Read token info in parallel
    const [name, symbol, decimals] = await Promise.all([
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "name",
      }) as Promise<string>,
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "symbol",
      }) as Promise<string>,
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      }) as Promise<number>,
    ]);

    const tokenInfo: TokenInfo = {
      address: tokenAddress,
      name: name || "Unknown Token",
      symbol: symbol || "UNKNOWN",
      decimals: decimals || 18,
      chainId,
    };

    // Cache the result
    tokenInfoCache.set(cacheKey, tokenInfo);

    return tokenInfo;
  } catch (error) {
    console.error("Failed to detect token info:", error);
    return null;
  }
}

/**
 * Clear the token info cache
 */
export function clearTokenCache(): void {
  tokenInfoCache.clear();
}

/**
 * Get cached token info without RPC call
 */
export function getCachedTokenInfo(
  tokenAddress: Address,
  network: string
): TokenInfo | undefined {
  const legacyNetwork = toLegacyNetwork(network);
  const cacheKey = `${tokenAddress.toLowerCase()}-${legacyNetwork}`;
  return tokenInfoCache.get(cacheKey);
}

/**
 * Check if a network is valid
 */
export function isValidNetwork(network: string): boolean {
  const legacyNetwork = toLegacyNetwork(network);
  return legacyNetwork in CHAINS;
}

/**
 * Get all supported networks
 */
export function getSupportedNetworks(): NetworkName[] {
  return Object.keys(CHAINS) as NetworkName[];
}
