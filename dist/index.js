"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  clearTokenCache: () => clearTokenCache,
  detectTokenInfo: () => detectTokenInfo,
  getCachedTokenInfo: () => getCachedTokenInfo,
  getChainId: () => getChainId,
  getPublicClient: () => getPublicClient,
  getRpcUrl: () => getRpcUrl,
  getSupportedNetworks: () => getSupportedNetworks,
  isValidNetwork: () => isValidNetwork,
  toLegacyNetwork: () => toLegacyNetwork
});
module.exports = __toCommonJS(index_exports);
var import_viem = require("viem");
var import_chains = require("viem/chains");
var ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function"
  }
];
var CHAIN_IDS = {
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
  "eip155:11142220": 11142220
};
var DEFAULT_RPC_URLS = {
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  "avalanche-fuji": "https://api.avax-test.network/ext/bc/C/rpc",
  base: "https://mainnet.base.org",
  "base-sepolia": "https://sepolia.base.org",
  celo: "https://forno.celo.org",
  "celo-sepolia": "https://forno.celo-sepolia.celo-testnet.org"
};
var CHAINS = {
  avalanche: import_chains.avalanche,
  "avalanche-fuji": import_chains.avalancheFuji,
  base: import_chains.base,
  "base-sepolia": import_chains.baseSepolia,
  celo: import_chains.celo,
  "celo-sepolia": import_chains.celoAlfajores
};
var CAIP2_TO_LEGACY = {
  "eip155:43114": "avalanche",
  "eip155:43113": "avalanche-fuji",
  "eip155:8453": "base",
  "eip155:84532": "base-sepolia",
  "eip155:42220": "celo",
  "eip155:11142220": "celo-sepolia"
};
var tokenInfoCache = /* @__PURE__ */ new Map();
function toLegacyNetwork(network) {
  if (!network.includes(":")) {
    return network;
  }
  return CAIP2_TO_LEGACY[network] || "avalanche";
}
function getChainId(network) {
  return CHAIN_IDS[network] || CHAIN_IDS.avalanche;
}
function getRpcUrl(network, customUrl) {
  if (customUrl) return customUrl;
  const legacyNetwork = toLegacyNetwork(network);
  return DEFAULT_RPC_URLS[legacyNetwork] || DEFAULT_RPC_URLS.avalanche;
}
function getPublicClient(network, config) {
  const legacyNetwork = toLegacyNetwork(network);
  const rpcUrl = getRpcUrl(network, config?.rpcUrl);
  const chain = CHAINS[legacyNetwork] || {
    id: getChainId(legacyNetwork),
    name: legacyNetwork,
    network: legacyNetwork,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } }
  };
  return (0, import_viem.createPublicClient)({
    chain,
    transport: (0, import_viem.http)(rpcUrl)
  });
}
async function detectTokenInfo(tokenAddress, network, config) {
  const legacyNetwork = toLegacyNetwork(network);
  const cacheKey = `${tokenAddress.toLowerCase()}-${legacyNetwork}`;
  if (tokenInfoCache.has(cacheKey)) {
    return tokenInfoCache.get(cacheKey);
  }
  try {
    const client = getPublicClient(legacyNetwork, config);
    const chainId = getChainId(legacyNetwork);
    const [name, symbol, decimals] = await Promise.all([
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "name"
      }),
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "symbol"
      }),
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "decimals"
      })
    ]);
    const tokenInfo = {
      address: tokenAddress,
      name: name || "Unknown Token",
      symbol: symbol || "UNKNOWN",
      decimals: decimals || 18,
      chainId
    };
    tokenInfoCache.set(cacheKey, tokenInfo);
    return tokenInfo;
  } catch (error) {
    console.error("Failed to detect token info:", error);
    return null;
  }
}
function clearTokenCache() {
  tokenInfoCache.clear();
}
function getCachedTokenInfo(tokenAddress, network) {
  const legacyNetwork = toLegacyNetwork(network);
  const cacheKey = `${tokenAddress.toLowerCase()}-${legacyNetwork}`;
  return tokenInfoCache.get(cacheKey);
}
function isValidNetwork(network) {
  const legacyNetwork = toLegacyNetwork(network);
  return legacyNetwork in CHAINS;
}
function getSupportedNetworks() {
  return Object.keys(CHAINS);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  clearTokenCache,
  detectTokenInfo,
  getCachedTokenInfo,
  getChainId,
  getPublicClient,
  getRpcUrl,
  getSupportedNetworks,
  isValidNetwork,
  toLegacyNetwork
});
//# sourceMappingURL=index.js.map