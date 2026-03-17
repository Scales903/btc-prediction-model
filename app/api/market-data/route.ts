import { NextResponse } from 'next/server';

// ── TECHNICAL INDICATOR CALCULATIONS ──────────────────────────────────────

function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  if (prices.length < period + 1) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }

  return rsi;
}

function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  if (prices.length === 0) return ema;

  const multiplier = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < Math.min(period, prices.length); i++) {
    sum += prices[i];
  }
  ema.push(sum / Math.min(period, prices.length));

  for (let i = period; i < prices.length; i++) {
    ema.push((prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
  }

  return ema;
}

function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += prices[j];
    }
    sma.push(sum / period);
  }
  return sma;
}

function calculateMACD(prices: number[]): { macd: number[]; signal: number[]; histogram: number[] } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  const macdLine: number[] = [];
  const offset = ema12.length - ema26.length;
  for (let i = 0; i < ema26.length; i++) {
    macdLine.push(ema12[i + offset] - ema26[i]);
  }

  const signalLine = calculateEMA(macdLine, 9);
  const histogram: number[] = [];
  const sigOffset = macdLine.length - signalLine.length;
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + sigOffset] - signalLine[i]);
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
  const bands: { upper: number; middle: number; lower: number }[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += prices[j];
    const mean = sum / period;

    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) variance += Math.pow(prices[j] - mean, 2);
    const std = Math.sqrt(variance / period);

    bands.push({ upper: mean + stdDev * std, middle: mean, lower: mean - stdDev * std });
  }
  return bands;
}

// ── ICHIMOKU CALCULATION ──────────────────────────────────────────────────

function calculateIchimoku(highs: number[], lows: number[], closes: number[]) {
  const len = closes.length;
  const tenkan: (number | null)[] = [];
  const kijun: (number | null)[] = [];
  const senkouA: (number | null)[] = [];
  const senkouB: (number | null)[] = [];

  for (let i = 0; i < len; i++) {
    // Tenkan-sen (9 periods)
    if (i >= 8) {
      let high9 = -Infinity, low9 = Infinity;
      for (let j = i - 8; j <= i; j++) { high9 = Math.max(high9, highs[j]); low9 = Math.min(low9, lows[j]); }
      tenkan.push((high9 + low9) / 2);
    } else { tenkan.push(null); }

    // Kijun-sen (26 periods)
    if (i >= 25) {
      let high26 = -Infinity, low26 = Infinity;
      for (let j = i - 25; j <= i; j++) { high26 = Math.max(high26, highs[j]); low26 = Math.min(low26, lows[j]); }
      kijun.push((high26 + low26) / 2);
    } else { kijun.push(null); }

    // Senkou A (midpoint of tenkan + kijun, displaced 26 ahead)
    if (tenkan[i] !== null && kijun[i] !== null) {
      senkouA.push((tenkan[i]! + kijun[i]!) / 2);
    } else { senkouA.push(null); }

    // Senkou B (52 periods)
    if (i >= 51) {
      let high52 = -Infinity, low52 = Infinity;
      for (let j = i - 51; j <= i; j++) { high52 = Math.max(high52, highs[j]); low52 = Math.min(low52, lows[j]); }
      senkouB.push((high52 + low52) / 2);
    } else { senkouB.push(null); }
  }

  return { tenkan, kijun, senkouA, senkouB };
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '90');

  try {
    // Fetch historical price data from CoinGecko
    const [chartRes, tickerRes] = await Promise.all([
      fetch(
        `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=${days <= 7 ? 'hourly' : 'daily'}`,
        { next: { revalidate: 300 } }
      ),
      fetch(
        'https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false',
        { next: { revalidate: 120 } }
      ),
    ]);

    if (!chartRes.ok || !tickerRes.ok) {
      return NextResponse.json(
        { error: 'CoinGecko API rate limited or unavailable. Try again in 60 seconds.' },
        { status: 429 }
      );
    }

    const chartData = await chartRes.json();
    const tickerData = await tickerRes.json();

    // Parse price data
    const prices: number[] = chartData.prices.map((p: number[]) => p[1]);
    const volumes: number[] = chartData.total_volumes.map((v: number[]) => v[1]);
    const timestamps: number[] = chartData.prices.map((p: number[]) => p[0]);

    // Build daily OHLC-like data from closes
    const highs: number[] = [];
    const lows: number[] = [];
    const chunkSize = days <= 7 ? 1 : 1;
    for (let i = 0; i < prices.length; i++) {
      // Approximate high/low as ±1.5% of close for daily data
      highs.push(prices[i] * 1.015);
      lows.push(prices[i] * 0.985);
    }

    // Calculate all technical indicators
    const rsiValues = calculateRSI(prices, 14);
    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, Math.min(50, Math.floor(prices.length / 2)));
    const sma200 = prices.length >= 200 ? calculateSMA(prices, 200) : [];
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macdResult = calculateMACD(prices);
    const bollinger = calculateBollingerBands(prices, 20);
    const ichimoku = calculateIchimoku(highs, lows, prices);

    // Build time series for frontend
    const technicalTimeSeries = [];
    const len = prices.length;
    const step = Math.max(1, Math.floor(len / 60)); // Max ~60 data points

    for (let i = 0; i < len; i += step) {
      const date = new Date(timestamps[i]);
      const dateStr = days <= 7
        ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const rsiIdx = i - (len - rsiValues.length);
      const sma20Idx = i - (len - sma20.length);
      const sma50Idx = i - (len - sma50.length);
      const macdIdx = i - (len - macdResult.macd.length);
      const sigIdx = i - (len - macdResult.signal.length);
      const histIdx = i - (len - macdResult.histogram.length);
      const bbIdx = i - (len - bollinger.length);

      technicalTimeSeries.push({
        date: dateStr,
        timestamp: timestamps[i],
        price: Math.round(prices[i]),
        volume: Math.round(volumes[i] / 1e9 * 100) / 100,
        rsi: rsiIdx >= 0 ? Math.round(rsiValues[rsiIdx] * 10) / 10 : null,
        sma20: sma20Idx >= 0 ? Math.round(sma20[sma20Idx]) : null,
        sma50: sma50Idx >= 0 ? Math.round(sma50[sma50Idx]) : null,
        ema12: i < ema12.length ? Math.round(ema12[i]) : null,
        ema26: i < ema26.length ? Math.round(ema26[i]) : null,
        macd: macdIdx >= 0 ? Math.round(macdResult.macd[macdIdx]) : null,
        signal: sigIdx >= 0 ? Math.round(macdResult.signal[sigIdx]) : null,
        histogram: histIdx >= 0 ? Math.round(macdResult.histogram[histIdx]) : null,
        bbUpper: bbIdx >= 0 ? Math.round(bollinger[bbIdx].upper) : null,
        bbMiddle: bbIdx >= 0 ? Math.round(bollinger[bbIdx].middle) : null,
        bbLower: bbIdx >= 0 ? Math.round(bollinger[bbIdx].lower) : null,
        tenkan: ichimoku.tenkan[i] ? Math.round(ichimoku.tenkan[i]!) : null,
        kijun: ichimoku.kijun[i] ? Math.round(ichimoku.kijun[i]!) : null,
        senkouA: ichimoku.senkouA[i] ? Math.round(ichimoku.senkouA[i]!) : null,
        senkouB: ichimoku.senkouB[i] ? Math.round(ichimoku.senkouB[i]!) : null,
      });
    }

    // Current snapshot
    const latestPrice = prices[prices.length - 1];
    const latestRSI = rsiValues[rsiValues.length - 1];
    const latestMACD = macdResult.macd[macdResult.macd.length - 1];
    const latestSignal = macdResult.signal[macdResult.signal.length - 1];
    const latestHistogram = macdResult.histogram[macdResult.histogram.length - 1];
    const latestSMA50 = sma50[sma50.length - 1];
    const latestBB = bollinger[bollinger.length - 1];

    const snapshot = {
      price: Math.round(latestPrice),
      rsi: Math.round(latestRSI * 10) / 10,
      macd: Math.round(latestMACD),
      macdSignal: Math.round(latestSignal),
      histogram: Math.round(latestHistogram),
      sma20: Math.round(sma20[sma20.length - 1]),
      sma50: Math.round(latestSMA50),
      sma200: sma200.length > 0 ? Math.round(sma200[sma200.length - 1]) : null,
      ema12: Math.round(ema12[ema12.length - 1]),
      ema26: Math.round(ema26[ema26.length - 1]),
      bbUpper: Math.round(latestBB.upper),
      bbLower: Math.round(latestBB.lower),
      volume24h: Math.round(tickerData.market_data?.total_volume?.usd / 1e9 * 100) / 100,
      marketCap: Math.round(tickerData.market_data?.market_cap?.usd / 1e9),
      change24h: Math.round(tickerData.market_data?.price_change_percentage_24h * 100) / 100,
      change7d: Math.round(tickerData.market_data?.price_change_percentage_7d * 100) / 100,
      change30d: Math.round(tickerData.market_data?.price_change_percentage_30d * 100) / 100,
      ath: tickerData.market_data?.ath?.usd,
      athDate: tickerData.market_data?.ath_date?.usd,
      athChangePercent: Math.round(tickerData.market_data?.ath_change_percentage?.usd * 100) / 100,
    };

    return NextResponse.json({
      snapshot,
      timeSeries: technicalTimeSeries,
      meta: {
        days,
        dataPoints: technicalTimeSeries.length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to fetch market data: ${error.message}` },
      { status: 500 }
    );
  }
}