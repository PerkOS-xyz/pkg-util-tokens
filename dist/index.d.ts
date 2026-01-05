import { Address, PublicClient } from 'viem';

/**
 * @perkos/token-detection
 * ERC20 token detection utilities for reading on-chain token metadata
 */

/**
 * Token information returned from detection
 */
interface TokenInfo {
    address: Address;
    name: string;
    symbol: string;
    decimals: number;
    chainId: number;
}
/**
 * Supported network names
 */
type NetworkName = "avalanche" | "avalanche-fuji" | "base" | "base-sepolia" | "celo" | "celo-sepolia";
/**
 * Network configuration options
 */
interface NetworkConfig {
    rpcUrl?: string;
}
/**
 * Convert CAIP-2 network format to legacy format
 * e.g., "eip155:43114" → "avalanche"
 */
declare function toLegacyNetwork(network: string): NetworkName;
/**
 * Get chain ID for a network
 */
declare function getChainId(network: string): number;
/**
 * Get RPC URL for a network
 */
declare function getRpcUrl(network: string, customUrl?: string): string;
/**
 * Get public client for a network
 */
declare function getPublicClient(network: string, config?: NetworkConfig): PublicClient;
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
declare function detectTokenInfo(tokenAddress: Address, network: string, config?: NetworkConfig): Promise<TokenInfo | null>;
/**
 * Clear the token info cache
 */
declare function clearTokenCache(): void;
/**
 * Get cached token info without RPC call
 */
declare function getCachedTokenInfo(tokenAddress: Address, network: string): TokenInfo | undefined;
/**
 * Check if a network is valid
 */
declare function isValidNetwork(network: string): boolean;
/**
 * Get all supported networks
 */
declare function getSupportedNetworks(): NetworkName[];

export { type NetworkConfig, type NetworkName, type TokenInfo, clearTokenCache, detectTokenInfo, getCachedTokenInfo, getChainId, getPublicClient, getRpcUrl, getSupportedNetworks, isValidNetwork, toLegacyNetwork };
