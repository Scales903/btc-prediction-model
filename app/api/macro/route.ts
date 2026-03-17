import { NextResponse } from 'next/server';

const MACRO_MONTHLY = [
  { date: 'Jan 23', btc: 23100, sp500: 4077, dxy: 101.9, m2: 21.21, fed: 4.50, us10y: 3.50, gold: 1928 },
  { date: 'Feb 23', btc: 23500, sp500: 3970, dxy: 104.9, m2: 21.06, fed: 4.75, us10y: 3.92, gold: 1827 },
  { date: 'Mar 23', btc: 28500, sp500: 4109, dxy: 102.1, m2: 20.84, fed: 5.00, us10y: 3.47, gold: 1969 },
  { date: 'Apr 23', btc: 29300, sp500: 4169, dxy: 101.3, m2: 20.67, fed: 5.25, us10y: 3.42, gold: 1990 },
  { date: 'May 23', btc: 27200, sp500: 4205, dxy: 104.2, m2: 20.60, fed: 5.25, us10y: 3.64, gold: 1963 },
  { date: 'Jun 23', btc: 30500, sp500: 4450, dxy: 102.9, m2: 20.59, fed: 5.25, us10y: 3.81, gold: 1921 },
  { date: 'Jul 23', btc: 29200, sp500: 4589, dxy: 101.8, m2: 20.57, fed: 5.50, us10y: 3.96, gold: 1965 },
  { date: 'Aug 23', btc: 26100, sp500: 4508, dxy: 104.2, m2: 20.54, fed: 5.50, us10y: 4.09, gold: 1942 },
  { date: 'Sep 23', btc: 27000, sp500: 4288, dxy: 106.2, m2: 20.52, fed: 5.50, us10y: 4.57, gold: 1849 },
  { date: 'Oct 23', btc: 34500, sp500: 4194, dxy: 106.7, m2: 20.55, fed: 5.50, us10y: 4.88, gold: 1997 },
  { date: 'Nov 23', btc: 37800, sp500: 4568, dxy: 103.4, m2: 20.59, fed: 5.50, us10y: 4.33, gold: 2038 },
  { date: 'Dec 23', btc: 42200, sp500: 4770, dxy: 101.4, m2: 20.76, fed: 5.50, us10y: 3.88, gold: 2063 },
  { date: 'Jan 24', btc: 42800, sp500: 4846, dxy: 103.5, m2: 20.78, fed: 5.50, us10y: 3.91, gold: 2039 },
  { date: 'Feb 24', btc: 43000, sp500: 5096, dxy: 104.1, m2: 20.79, fed: 5.50, us10y: 4.25, gold: 2044 },
  { date: 'Mar 24', btc: 51000, sp500: 5254, dxy: 104.5, m2: 20.84, fed: 5.50, us10y: 4.20, gold: 2214 },
  { date: 'Apr 24', btc: 64000, sp500: 5036, dxy: 106.2, m2: 20.87, fed: 5.50, us10y: 4.68, gold: 2330 },
  { date: 'May 24', btc: 67500, sp500: 5277, dxy: 104.6, m2: 20.93, fed: 5.50, us10y: 4.50, gold: 2348 },
  { date: 'Jun 24', btc: 62000, sp500: 5460, dxy: 105.8, m2: 21.02, fed: 5.50, us10y: 4.36, gold: 2327 },
  { date: 'Jul 24', btc: 58500, sp500: 5522, dxy: 104.1, m2: 21.05, fed: 5.50, us10y: 4.09, gold: 2448 },
  { date: 'Aug 24', btc: 63000, sp500: 5648, dxy: 101.7, m2: 21.12, fed: 5.50, us10y: 3.91, gold: 2503 },
  { date: 'Sep 24', btc: 65800, sp500: 5762, dxy: 100.4, m2: 21.22, fed: 5.00, us10y: 3.78, gold: 2634 },
  { date: 'Oct 24', btc: 72000, sp500: 5705, dxy: 104.0, m2: 21.31, fed: 4.75, us10y: 4.28, gold: 2744 },
  { date: 'Nov 24', btc: 91000, sp500: 6032, dxy: 106.1, m2: 21.45, fed: 4.75, us10y: 4.17, gold: 2672 },
  { date: 'Dec 24', btc: 96800, sp500: 5881, dxy: 108.0, m2: 21.54, fed: 4.50, us10y: 4.58, gold: 2624 },
  { date: 'Jan 25', btc: 102000, sp500: 6040, dxy: 107.5, m2: 21.60, fed: 4.50, us10y: 4.54, gold: 2798 },
  { date: 'Feb 25', btc: 103500, sp500: 5986, dxy: 106.8, m2: 21.67, fed: 4.50, us10y: 4.21, gold: 2858 },
];

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i]; sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 1000;
}

function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

export async function GET() {
  try {
    const btcRes = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      { next: { revalidate: 120 } }
    );
    let currentBTC = 0;
    if (btcRes.ok) {
      const btcData = await btcRes.json();
      currentBTC = btcData.bitcoin?.usd || 0;
    }

    const data = MACRO_MONTHLY;
    const btcPrices = data.map(d => d.btc);
    const sp500Prices = data.map(d => d.sp500);
    const dxyPrices = data.map(d => d.dxy);
    const m2Values = data.map(d => d.m2);
    const goldPrices = data.map(d => d.gold);
    const yields = data.map(d => d.us10y);

    const priceLevelCorrelations = {
      btc_sp500: pearsonCorrelation(btcPrices, sp500Prices),
      btc_dxy: pearsonCorrelation(btcPrices, dxyPrices),
      btc_m2: pearsonCorrelation(btcPrices, m2Values),
      btc_gold: pearsonCorrelation(btcPrices, goldPrices),
      btc_us10y: pearsonCorrelation(btcPrices, yields),
    };

    const btcReturns = calculateReturns(btcPrices);
    const sp500Returns = calculateReturns(sp500Prices);
    const dxyReturns = calculateReturns(dxyPrices);
    const m2Returns = calculateReturns(m2Values);
    const goldReturns = calculateReturns(goldPrices);

    const returnCorrelations = {
      btc_sp500: pearsonCorrelation(btcReturns, sp500Returns),
      btc_dxy: pearsonCorrelation(btcReturns, dxyReturns),
      btc_m2: pearsonCorrelation(btcReturns, m2Returns),
      btc_gold: pearsonCorrelation(btcReturns, goldReturns),
    };

    const rolling: any[] = [];
    for (let i = 5; i < data.length; i++) {
      const windowBTC = btcPrices.slice(i - 5, i + 1);
      const windowSP = sp500Prices.slice(i - 5, i + 1);
      const windowDXY = dxyPrices.slice(i - 5, i + 1);
      const windowM2 = m2Values.slice(i - 5, i + 1);
      const windowGold = goldPrices.slice(i - 5, i + 1);
      rolling.push({
        date: data[i].date,
        btc_sp500: pearsonCorrelation(windowBTC, windowSP),
        btc_dxy: pearsonCorrelation(windowBTC, windowDXY),
        btc_m2: pearsonCorrelation(windowBTC, windowM2),
        btc_gold: pearsonCorrelation(windowBTC, windowGold),
      });
    }

    const normalized = data.map(d => ({
      date: d.date,
      btc: Math.round((d.btc / data[0].btc) * 10000) / 100,
      sp500: Math.round((d.sp500 / data[0].sp500) * 10000) / 100,
      dxy: Math.round((d.dxy / data[0].dxy) * 10000) / 100,
      m2: Math.round((d.m2 / data[0].m2) * 10000) / 100,
      gold: Math.round((d.gold / data[0].gold) * 10000) / 100,
    }));

    const latestData = data[data.length - 1];
    const prevData = data[data.length - 2];
    const regimes = {
      dxyTrend: latestData.dxy > prevData.dxy ? 'Strengthening' : 'Weakening',
      m2Trend: latestData.m2 > prevData.m2 ? 'Expanding' : 'Contracting',
      fedPolicy: latestData.fed > prevData.fed ? 'Tightening' : latestData.fed < prevData.fed ? 'Easing' : 'Holding',
      yieldTrend: latestData.us10y > prevData.us10y ? 'Rising' : 'Falling',
      riskAppetite: latestData.sp500 > prevData.sp500 ? 'Risk-On' : 'Risk-Off',
    };

    let bullishFactors = 0;
    let bearishFactors = 0;
    const signals: string[] = [];

    if (regimes.dxyTrend === 'Weakening') { bullishFactors++; signals.push('DXY weakening — historically bullish for BTC'); }
    else { bearishFactors++; signals.push('DXY strengthening — headwind for BTC'); }
    if (regimes.m2Trend === 'Expanding') { bullishFactors++; signals.push('M2 expanding — more liquidity supports risk assets'); }
    else { bearishFactors++; signals.push('M2 contracting — liquidity drain hurts risk assets'); }
    if (regimes.fedPolicy === 'Easing') { bullishFactors++; signals.push('Fed easing — lower rates favor BTC'); }
    else if (regimes.fedPolicy === 'Tightening') { bearishFactors++; signals.push('Fed tightening — higher rates pressure BTC'); }
    else { signals.push('Fed holding — neutral for BTC, watch for pivot signals'); }
    if (regimes.yieldTrend === 'Falling') { bullishFactors++; signals.push('Yields falling — reduces opportunity cost of holding BTC'); }
    else { bearishFactors++; signals.push('Yields rising — increases opportunity cost vs bonds'); }
    if (regimes.riskAppetite === 'Risk-On') { bullishFactors++; signals.push('Equities rising — risk-on environment supports BTC'); }
    else { bearishFactors++; signals.push('Equities falling — risk-off pressure on BTC'); }

    const macroBias = bullishFactors > bearishFactors ? 'Bullish' : bearishFactors > bullishFactors ? 'Bearish' : 'Neutral';
    const macroScore = Math.round(((bullishFactors - bearishFactors) / 5 + 1) / 2 * 100);

    return NextResponse.json({
      timeSeries: data,
      normalized,
      correlations: { priceLevel: priceLevelCorrelations, returns: returnCorrelations, rolling },
      regimes,
      macroAnalysis: { bias: macroBias, score: macroScore, bullishFactors, bearishFactors, signals },
      current: {
        btc: currentBTC || latestData.btc,
        sp500: latestData.sp500,
        dxy: latestData.dxy,
        m2: latestData.m2,
        fed: latestData.fed,
        us10y: latestData.us10y,
        gold: latestData.gold,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch macro data: ' + error.message },
      { status: 500 }
    );
  }
}