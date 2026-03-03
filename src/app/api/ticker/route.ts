import { NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════
 * /api/ticker — Real-time market data endpoint
 *
 * Fetches live quotes from Yahoo Finance for Indian & global indices.
 * Server-side cached for 3 minutes via in-memory TTL cache.
 *
 * Symbols:
 *   ^NSEI (NIFTY 50), ^BSESN (SENSEX), ^NSEBANK (BANKNIFTY),
 *   RELIANCE.NS, TCS.NS, INFY.NS, HDFCBANK.NS, ITC.NS,
 *   GC=F (Gold Futures), BTC-USD, USDINR=X, CL=F (Crude Oil)
 *
 * Response shape: { items: TickerItem[], updatedAt: string }
 * ═══════════════════════════════════════════════════════════════════ */

interface TickerItem {
  symbol: string;
  price: string;
  change: number;
}

/* ── Symbol config ────────────────────────────────────────────── */
const SYMBOLS = [
  { yahoo: "^NSEI", display: "NIFTY 50", prefix: "" },
  { yahoo: "^BSESN", display: "SENSEX", prefix: "" },
  { yahoo: "^NSEBANK", display: "BANKNIFTY", prefix: "" },
  { yahoo: "RELIANCE.NS", display: "RELIANCE", prefix: "₹" },
  { yahoo: "TCS.NS", display: "TCS", prefix: "₹" },
  { yahoo: "INFY.NS", display: "INFY", prefix: "₹" },
  { yahoo: "HDFCBANK.NS", display: "HDFCBANK", prefix: "₹" },
  { yahoo: "ITC.NS", display: "ITC", prefix: "₹" },
  { yahoo: "GC=F", display: "GOLD", prefix: "$" },
  { yahoo: "BTC-USD", display: "BTC/USD", prefix: "$" },
  { yahoo: "USDINR=X", display: "USD/INR", prefix: "" },
  { yahoo: "CL=F", display: "CRUDE OIL", prefix: "$" },
];

/* ── In-memory cache (3 min TTL) ──────────────────────────────── */
let cachedData: { items: TickerItem[]; updatedAt: string } | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

/* ── Fallback data ─────────────────────────────────────────────── */
const FALLBACK: TickerItem[] = [
  { symbol: "NIFTY 50", price: "24,850.30", change: 0.82 },
  { symbol: "SENSEX", price: "81,340.15", change: 0.75 },
  { symbol: "BANKNIFTY", price: "52,120.45", change: -0.35 },
  { symbol: "RELIANCE", price: "₹2,945.60", change: 1.2 },
  { symbol: "TCS", price: "₹3,820.10", change: -0.41 },
  { symbol: "INFY", price: "₹1,892.75", change: 0.65 },
  { symbol: "HDFCBANK", price: "₹1,680.30", change: -0.22 },
  { symbol: "ITC", price: "₹468.25", change: 0.38 },
  { symbol: "GOLD", price: "$2,650.40", change: 0.31 },
  { symbol: "BTC/USD", price: "$67,200.00", change: 2.14 },
  { symbol: "USD/INR", price: "83.42", change: -0.08 },
  { symbol: "CRUDE OIL", price: "$78.65", change: -1.12 },
];

/**
 * Format a number as a price string with appropriate decimals
 */
function formatPrice(value: number, prefix: string): string {
  if (value >= 10000) {
    return `${prefix}${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${prefix}${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function fetchLiveData(): Promise<TickerItem[]> {
  try {
    // yahoo-finance2 v3 requires instance creation
    const YahooFinance = (await import("yahoo-finance2")).default;
    const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

    const symbolKeys = SYMBOLS.map((s) => s.yahoo);

    // Fetch all quotes in parallel
    const quotes = await Promise.allSettled(
      symbolKeys.map((sym) => yahooFinance.quote(sym))
    );

    const items: TickerItem[] = [];

    for (let i = 0; i < SYMBOLS.length; i++) {
      const result = quotes[i];
      const config = SYMBOLS[i];

      if (result.status === "fulfilled" && result.value) {
        const q = result.value as Record<string, unknown>;
        const price = (typeof q.regularMarketPrice === "number" ? q.regularMarketPrice : 0);
        const changePct = (typeof q.regularMarketChangePercent === "number" ? q.regularMarketChangePercent : 0);

        items.push({
          symbol: config.display,
          price: formatPrice(price, config.prefix),
          change: parseFloat(changePct.toFixed(2)),
        });
      } else {
        // Use fallback for this specific symbol
        const fallbackItem = FALLBACK.find((f) => f.symbol === config.display);
        if (fallbackItem) items.push(fallbackItem);
      }
    }

    return items.length > 0 ? items : FALLBACK;
  } catch (error) {
    console.error("[ticker] Yahoo Finance fetch failed:", error);
    return FALLBACK;
  }
}

export async function GET() {
  try {
    const now = Date.now();

    // Return cached data if still fresh
    if (cachedData && cacheExpiry > now) {
      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control": "public, s-maxage=180, stale-while-revalidate=60",
        },
      });
    }

    // Fetch fresh data
    const items = await fetchLiveData();
    const updatedAt = new Date().toISOString();

    cachedData = { items, updatedAt };
    cacheExpiry = now + CACHE_TTL;

    return NextResponse.json(cachedData, {
      headers: {
        "Cache-Control": "public, s-maxage=180, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("[ticker] API error:", error);
    return NextResponse.json(
      { items: FALLBACK, updatedAt: new Date().toISOString() },
      { status: 200 }
    );
  }
}
