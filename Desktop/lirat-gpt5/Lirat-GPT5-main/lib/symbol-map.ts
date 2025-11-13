// Normalization map for display symbols to EODHD symbols
export const SYMBOL_MAP: Record<string, string> = {
  // Forex
  EURUSD: "EURUSD.FOREX",
  GBPUSD: "GBPUSD.FOREX",
  USDJPY: "USDJPY.FOREX",
  USDCHF: "USDCHF.FOREX",
  USDCAD: "USDCAD.FOREX",
  AUDUSD: "AUDUSD.FOREX",
  NZDUSD: "NZDUSD.FOREX",

  // Metals & Energy
  XAUUSD: "XAUUSD.FOREX",
  XAGUSD: "XAGUSD.FOREX",
  USOIL: "CL.COMM",

  // Crypto
  BTCUSD: "BTC-USD.CC",
  ETHUSD: "ETH-USD.CC",

  // Indices (if needed later)
  DXY: "DX.COMM",
  SPX: "SPX.INDX",
}

export function normalizeSymbol(displaySymbol: string): string {
  return SYMBOL_MAP[displaySymbol] || `${displaySymbol}.US`
}

export function getDisplaySymbol(normalizedSymbol: string): string {
  const entry = Object.entries(SYMBOL_MAP).find(([_, normalized]) => normalized === normalizedSymbol)
  return entry ? entry[0] : normalizedSymbol.split(".")[0]
}
