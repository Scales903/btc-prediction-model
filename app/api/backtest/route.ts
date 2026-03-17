import { NextResponse } from 'next/server';

function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = new Array(prices.length).fill(null);
  if (prices.length < period + 1) return rsi;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change; else losses += Math.abs(change);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = new Array(prices.length).fill(null);
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += prices[j];
    sma[i] = sum / period;
  }
  return sma;
}

function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = new Array(prices.length).fill(null);
  if (prices.length === 0) return ema;
  const multiplier = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < Math.min(period, prices.length); i++) sum += prices[i];
  ema[Math.min(period, prices.length) - 1] = sum / Math.min(period, prices.length);
  for (let i = period; i < prices.length; i++) {
    ema[i] = (prices[i] - ema[i - 1]!) * multiplier + ema[i - 1]!;
  }
  return ema;
}

interface Signal {
  type: string;
  direction: 'bullish' | 'bearish';
  strength: 'strong' | 'moderate' | 'weak';
  dayIndex: number;
  date: string;
  priceAtSignal: number;
  return7d: number | null;
  return14d: number | null;
  return30d: number | null;
  hit7d: boolean | null;
  hit14d: boolean | null;
  hit30d: boolean | null;
}

function detectSignals(
  prices: number[],
  dates: string[],
  rsi: number[],
  sma20: number[],
  sma50: number[],
  macd: number[],
  signal: number[],
  histogram: number[]
): Signal[] {
  const signals: Signal[] = [];

  for (let i = 1; i < prices.length; i++) {
    const prev = i - 1;

    // Price crosses SMA 50
    if (prices[prev] && prices[i] && sma50[prev] && sma50[i]) {
      if (prices[prev] < sma50[prev] && prices[i] > sma50[i]) {
        signals.push(makeSignal('Price × SMA 50', 'bullish', 'strong', i, dates[i], prices, prices[i]));
      }
      if (prices[prev] > sma50[prev] && prices[i] < sma50[i]) {
        signals.push(makeSignal('Price × SMA 50', 'bearish', 'strong', i, dates[i], prices, prices[i]));
      }
    }

    // Price crosses SMA 20
    if (prices[prev] && prices[i] && sma20[prev] && sma20[i]) {
      if (prices[prev] < sma20[prev] && prices[i] > sma20[i]) {
        signals.push(makeSignal('Price × SMA 20', 'bullish', 'moderate', i, dates[i], prices, prices[i]));
      }
      if (prices[prev] > sma20[prev] && prices[i] < sma20[i]) {
        signals.push(makeSignal('Price × SMA 20', 'bearish', 'moderate', i, dates[i], prices, prices[i]));
      }
    }

    // SMA 20 crosses SMA 50
    if (sma20[prev] && sma20[i] && sma50[prev] && sma50[i]) {
      if (sma20[prev] < sma50[prev] && sma20[i] > sma50[i]) {
        signals.push(makeSignal('SMA 20 × SMA 50', 'bullish', 'strong', i, dates[i], prices, prices[i]));
      }
      if (sma20[prev] > sma50[prev] && sma20[i] < sma50[i]) {
        signals.push(makeSignal('SMA 20 × SMA 50', 'bearish', 'strong', i, dates[i], prices, prices[i]));
      }
    }

    // RSI crosses 30 (oversold recovery)
    if (rsi[prev] != null && rsi[i] != null) {
      if (rsi[prev]! < 30 && rsi[i]! >= 30) {
        signals.push(makeSignal('RSI Oversold Recovery', 'bullish', 'strong', i, dates[i], prices, prices[i]));
      }
      if (rsi[prev]! > 70 && rsi[i]! <= 70) {
        signals.push(makeSignal('RSI Overbought Exit', 'bearish', 'moderate', i, dates[i], prices, prices[i]));
      }
      if (rsi[prev]! < 50 && rsi[i]! >= 50) {
        signals.push(makeSignal('RSI × 50 (Momentum)', 'bullish', 'moderate', i, dates[i], prices, prices[i]));
      }
      if (rsi[prev]! > 50 && rsi[i]! <= 50) {
        signals.push(makeSignal('RSI × 50 (Momentum)', 'bearish', 'moderate', i, dates[i], prices, prices[i]));
      }
    }

    // MACD crosses signal
    if (macd[prev] != null && macd[i] != null && signal[prev] != null && signal[i] != null) {
      if (macd[prev]! < signal[prev]! && macd[i]! > signal[i]!) {
        signals.push(makeSignal('MACD Crossover', 'bullish', macd[i]! < 0 ? 'strong' : 'moderate', i, dates[i], prices, prices[i]));
      }
      if (macd[prev]! > signal[prev]! && macd[i]! < signal[i]!) {
        signals.push(makeSignal('MACD Crossover', 'bearish', macd[i]! > 0 ? 'strong' : 'moderate', i, dates[i], prices, prices[i]));
      }
    }

    // MACD histogram flip
    if (histogram[prev] != null && histogram[i] != null) {
      if (histogram[prev]! < 0 && histogram[i]! > 0) {
        signals.push(makeSignal('MACD Histogram Flip', 'bullish', 'weak', i, dates[i], prices, prices[i]));
      }
      if (histogram[prev]! > 0 && histogram[i]! < 0) {
        signals.push(makeSignal('MACD Histogram Flip', 'bearish', 'weak', i, dates[i], prices, prices[i]));
      }
    }
  }

  return signals;
}

function makeSignal(
  type: string, direction: 'bullish' | 'bearish', strength: 'strong' | 'moderate' | 'weak',
  dayIndex: number, date: string, prices: number[], priceAtSignal: number
): Signal {
  const len = prices.length;
  const price7d = dayIndex + 7 < len ? prices[dayIndex + 7] : null;
  const price14d = dayIndex + 14 < len ? prices[dayIndex + 14] : null;
  const price30d = dayIndex + 30 < len ? prices[dayIndex + 30] : null;

  const return7d = price7d ? Math.round(((price7d - priceAtSignal) / priceAtSignal) * 10000) / 100 : null;
  const return14d = price14d ? Math.round(((price14d - priceAtSignal) / priceAtSignal) * 10000) / 100 : null;
  const return30d = price30d ? Math.round(((price30d - priceAtSignal) / priceAtSignal) * 10000) / 100 : null;

  const isCorrect = (ret: number | null) => {
    if (ret === null) return null;
    if (direction === 'bullish') return ret > 0;
    return ret < 0;
  };

  return {
    type, direction, strength, dayIndex, date, priceAtSignal,
    return7d, return14d, return30d,
    hit7d: isCorrect(return7d),
    hit14d: isCorrect(return14d),
    hit30d: isCorrect(return30d),
  };
}

interface SignalStats {
  type: string;
  direction: string;
  count: number;
  winRate7d: number;
  winRate14d: number;
  winRate30d: number;
  avgReturn7d: number;
  avgReturn14d: number;
  avgReturn30d: number;
  bestReturn30d: number;
  worstReturn30d: number;
  profitFactor: number;
  signals: Signal[];
}

function calculateStats(signals: Signal[]): SignalStats[] {
  const grouped: Record<string, Signal[]> = {};
  for (const sig of signals) {
    const key = `${sig.type}|${sig.direction}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(sig);
  }

  const stats: SignalStats[] = [];
  for (const [key, sigs] of Object.entries(grouped)) {
    const [type, direction] = key.split('|');

    const with7d = sigs.filter(s => s.hit7d !== null);
    const with14d = sigs.filter(s => s.hit14d !== null);
    const with30d = sigs.filter(s => s.hit30d !== null);

    const wins7d = with7d.filter(s => s.hit7d === true).length;
    const wins14d = with14d.filter(s => s.hit14d === true).length;
    const wins30d = with30d.filter(s => s.hit30d === true).length;

    const returns7d = sigs.filter(s => s.return7d !== null).map(s => s.return7d!);
    const returns14d = sigs.filter(s => s.return14d !== null).map(s => s.return14d!);
    const returns30d = sigs.filter(s => s.return30d !== null).map(s => s.return30d!);

    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 100) / 100 : 0;

    const totalGains = returns30d.filter(r => (direction === 'bullish' ? r > 0 : r < 0)).reduce((sum, r) => sum + Math.abs(r), 0);
    const totalLosses = returns30d.filter(r => (direction === 'bullish' ? r < 0 : r > 0)).reduce((sum, r) => sum + Math.abs(r), 0);
    const profitFactor = totalLosses > 0 ? Math.round((totalGains / totalLosses) * 100) / 100 : totalGains > 0 ? 99 : 0;

    stats.push({
      type, direction, count: sigs.length,
      winRate7d: with7d.length > 0 ? Math.round((wins7d / with7d.length) * 10000) / 100 : 0,
      winRate14d: with14d.length > 0 ? Math.round((wins14d / with14d.length) * 10000) / 100 : 0,
      winRate30d: with30d.length > 0 ? Math.round((wins30d / with30d.length) * 10000) / 100 : 0,
      avgReturn7d: avg(returns7d),
      avgReturn14d: avg(returns14d),
      avgReturn30d: avg(returns30d),
      bestReturn30d: returns30d.length > 0 ? Math.max(...returns30d) : 0,
      worstReturn30d: returns30d.length > 0 ? Math.min(...returns30d) : 0,
      profitFactor,
      signals: sigs.sort((a, b) => b.dayIndex - a.dayIndex),
    });
  }

  return stats.sort((a, b) => b.winRate30d - a.winRate30d);
}

export async function GET() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily',
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'CoinGecko rate limited. Try again in 60 seconds.' }, { status: 429 });
    }

    const data = await res.json();
    const prices: number[] = data.prices.map((p: number[]) => p[1]);
    const timestamps: number[] = data.prices.map((p: number[]) => p[0]);
    const dates = timestamps.map(t => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

    // Calculate indicators
    const rsi = calculateRSI(prices, 14);
    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);

    // MACD
    const macdLine: number[] = new Array(prices.length).fill(null);
    const signalLine: number[] = new Array(prices.length).fill(null);
    const histogram: number[] = new Array(prices.length).fill(null);

    for (let i = 0; i < prices.length; i++) {
      if (ema12[i] != null && ema26[i] != null) {
        macdLine[i] = ema12[i]! - ema26[i]!;
      }
    }

    const macdValues = macdLine.filter(v => v !== null) as number[];
    const macdEma9 = calculateEMA(macdValues, 9);
    const offset = prices.length - macdValues.length;
    const sigOffset = macdValues.length - macdEma9.length;

    for (let i = 0; i < macdEma9.length; i++) {
      const idx = offset + sigOffset + i;
      if (idx < prices.length) {
        signalLine[idx] = macdEma9[i];
        if (macdLine[idx] != null) {
          histogram[idx] = macdLine[idx]! - macdEma9[i]!;
        }
      }
    }

    // Detect all signals
    const signals = detectSignals(prices, dates, rsi, sma20, sma50, macdLine, signalLine, histogram);

    // Calculate statistics
    const stats = calculateStats(signals);

    // Overall summary
    const allWithResults = signals.filter(s => s.hit30d !== null);
    const totalWins = allWithResults.filter(s => s.hit30d === true).length;
    const overallWinRate = allWithResults.length > 0 ? Math.round((totalWins / allWithResults.length) * 10000) / 100 : 0;

    const bullishSignals = signals.filter(s => s.direction === 'bullish');
    const bearishSignals = signals.filter(s => s.direction === 'bearish');
    const bullishWins = bullishSignals.filter(s => s.hit30d === true).length;
    const bearishWins = bearishSignals.filter(s => s.hit30d === true).length;
    const bullishWithResults = bullishSignals.filter(s => s.hit30d !== null);
    const bearishWithResults = bearishSignals.filter(s => s.hit30d !== null);

    // Equity curve (simulated)
    const equityCurve: { date: string; equity: number; signal?: string }[] = [];
    let equity = 10000;
    const sortedSignals = [...signals].sort((a, b) => a.dayIndex - b.dayIndex);
    let lastSignalDay = -31;

    for (const sig of sortedSignals) {
      if (sig.dayIndex - lastSignalDay < 7) continue; // Min 7 days between trades
      if (sig.return7d === null) continue;

      const returnUsed = sig.return7d / 100;
      const positionSize = sig.strength === 'strong' ? 0.1 : sig.strength === 'moderate' ? 0.05 : 0.025;
      const pnl = equity * positionSize * (sig.direction === 'bullish' ? returnUsed : -returnUsed);
      equity += pnl;

      equityCurve.push({
        date: sig.date,
        equity: Math.round(equity),
        signal: `${sig.direction} ${sig.type}`,
      });

      lastSignalDay = sig.dayIndex;
    }

    // Price chart with signal markers
    const step = Math.max(1, Math.floor(prices.length / 90));
    const priceChart = [];
    for (let i = 0; i < prices.length; i += step) {
      priceChart.push({
        date: dates[i],
        price: Math.round(prices[i]),
        dayIndex: i,
      });
    }

    return NextResponse.json({
      summary: {
        totalSignals: signals.length,
        signalsWithResults: allWithResults.length,
        overallWinRate,
        bullishCount: bullishSignals.length,
        bearishCount: bearishSignals.length,
        bullishWinRate: bullishWithResults.length > 0 ? Math.round((bullishWins / bullishWithResults.length) * 10000) / 100 : 0,
        bearishWinRate: bearishWithResults.length > 0 ? Math.round((bearishWins / bearishWithResults.length) * 10000) / 100 : 0,
        dataRange: `${dates[0]} – ${dates[dates.length - 1]}`,
        dataPoints: prices.length,
      },
      stats,
      equityCurve,
      priceChart,
      recentSignals: signals.filter(s => s.return30d !== null).slice(-20).reverse(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Backtest failed: ' + error.message },
      { status: 500 }
    );
  }
}