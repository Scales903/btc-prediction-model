import { NextResponse } from 'next/server';

// Deribit public API — no key needed for market data

async function fetchDeribitData() {
  const baseUrl = 'https://www.deribit.com/api/v2/public';

  try {
    // Get BTC index price
    const indexRes = await fetch(`${baseUrl}/get_index_price?index_name=btc_usd`);
    const indexData = await indexRes.json();
    const btcPrice = indexData.result?.index_price || 0;

    // Get all BTC option instruments
    const instrumentsRes = await fetch(`${baseUrl}/get_instruments?currency=BTC&kind=option&expired=false`);
    const instrumentsData = await instrumentsRes.json();
    const instruments = instrumentsData.result || [];

    // Get BTC futures for term structure
    const futuresRes = await fetch(`${baseUrl}/get_instruments?currency=BTC&kind=future&expired=false`);
    const futuresData = await futuresRes.json();
    const futures = futuresData.result || [];

    // Get book summary for options
    const bookRes = await fetch(`${baseUrl}/get_book_summary_by_currency?currency=BTC&kind=option`);
    const bookData = await bookRes.json();
    const bookSummary = bookData.result || [];

    // Get historical volatility
    const volRes = await fetch(`${baseUrl}/get_historical_volatility?currency=BTC`);
    const volData = await volRes.json();
    const historicalVol = volData.result || [];

    return { btcPrice, instruments, futures, bookSummary, historicalVol };
  } catch (error: any) {
    throw new Error('Deribit API error: ' + error.message);
  }
}

function calculateMaxPain(instruments: any[], bookSummary: any[], btcPrice: number) {
  // Group by expiry
  const expiryMap: Record<string, any[]> = {};

  for (const inst of instruments) {
    const expiry = inst.expiration_timestamp;
    const expiryDate = new Date(expiry).toISOString().split('T')[0];
    if (!expiryMap[expiryDate]) expiryMap[expiryDate] = [];
    expiryMap[expiryDate].push(inst);
  }

  // Get open interest from book summary
  const oiMap: Record<string, { oi: number; type: string; strike: number }> = {};
  for (const book of bookSummary) {
    oiMap[book.instrument_name] = {
      oi: book.open_interest || 0,
      type: book.instrument_name.includes('-C') ? 'call' : 'put',
      strike: book.mid_price ? btcPrice : 0,
    };
  }

  const results: any[] = [];

  for (const [expiryDate, insts] of Object.entries(expiryMap)) {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysToExpiry = Math.max(1, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Skip expiries more than 90 days out
    if (daysToExpiry > 90) continue;

    // Collect strikes and OI
    const strikes: number[] = [];
    let totalCallOI = 0;
    let totalPutOI = 0;
    const strikeData: Record<number, { callOI: number; putOI: number }> = {};

    for (const inst of insts) {
      const strike = inst.strike;
      const isCall = inst.instrument_name.includes('-C');
      const bookEntry = oiMap[inst.instrument_name];
      const oi = bookEntry?.oi || 0;

      if (!strikeData[strike]) {
        strikeData[strike] = { callOI: 0, putOI: 0 };
        strikes.push(strike);
      }

      if (isCall) {
        strikeData[strike].callOI += oi;
        totalCallOI += oi;
      } else {
        strikeData[strike].putOI += oi;
        totalPutOI += oi;
      }
    }

    strikes.sort((a, b) => a - b);

    // Calculate max pain — the price where total option holder losses are maximized
    let maxPainStrike = 0;
    let maxPainValue = Infinity;

    for (const testStrike of strikes) {
      let totalPain = 0;

      for (const strike of strikes) {
        const data = strikeData[strike];
        // Call holders lose if price < strike
        if (testStrike < strike) {
          totalPain += 0; // calls expire worthless, no pain for writers
        } else {
          totalPain += (testStrike - strike) * data.callOI;
        }
        // Put holders lose if price > strike
        if (testStrike > strike) {
          totalPain += 0; // puts expire worthless
        } else {
          totalPain += (strike - testStrike) * data.putOI;
        }
      }

      if (totalPain < maxPainValue) {
        maxPainValue = totalPain;
        maxPainStrike = testStrike;
      }
    }

    const pcRatio = totalCallOI > 0 ? Math.round((totalPutOI / totalCallOI) * 1000) / 1000 : 0;

    results.push({
      expiry: expiryDate,
      daysToExpiry,
      maxPain: maxPainStrike,
      maxPainDiff: btcPrice > 0 ? Math.round(((maxPainStrike - btcPrice) / btcPrice) * 10000) / 100 : 0,
      totalCallOI: Math.round(totalCallOI * 100) / 100,
      totalPutOI: Math.round(totalPutOI * 100) / 100,
      pcRatio,
      pcSignal: pcRatio > 1.0 ? 'Bearish (more puts than calls)' :
        pcRatio > 0.7 ? 'Neutral-Bearish' :
        pcRatio > 0.5 ? 'Neutral' :
        pcRatio > 0.3 ? 'Neutral-Bullish' : 'Bullish (heavy call positioning)',
      strikeCount: strikes.length,
      topStrikes: strikes
        .map(s => ({ strike: s, callOI: strikeData[s].callOI, putOI: strikeData[s].putOI, total: strikeData[s].callOI + strikeData[s].putOI }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10),
    });
  }

  return results.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
}

function parseFutures(futures: any[], btcPrice: number) {
  return futures
    .filter(f => f.settlement_period !== 'perpetual')
    .map(f => {
      const expiry = new Date(f.expiration_timestamp);
      const now = new Date();
      const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        name: f.instrument_name,
        expiry: expiry.toISOString().split('T')[0],
        daysToExpiry,
      };
    })
    .filter(f => f.daysToExpiry > 0 && f.daysToExpiry < 365)
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry);
}

export async function GET() {
  try {
    const { btcPrice, instruments, futures, bookSummary, historicalVol } = await fetchDeribitData();

    const expiryAnalysis = calculateMaxPain(instruments, bookSummary, btcPrice);
    const futuresList = parseFutures(futures, btcPrice);

    // Aggregate put/call ratio across all expiries
    const totalCalls = expiryAnalysis.reduce((sum, e) => sum + e.totalCallOI, 0);
    const totalPuts = expiryAnalysis.reduce((sum, e) => sum + e.totalPutOI, 0);
    const aggregatePCR = totalCalls > 0 ? Math.round((totalPuts / totalCalls) * 1000) / 1000 : 0;

    // Historical volatility (last few entries)
    const recentVol = historicalVol.slice(-30).map((v: any) => ({
      timestamp: v[0],
      date: new Date(v[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volatility: Math.round(v[1] * 100) / 100,
    }));

    const currentIV = recentVol.length > 0 ? recentVol[recentVol.length - 1].volatility : 0;

    // Nearest expiry max pain
    const nearestExpiry = expiryAnalysis.length > 0 ? expiryAnalysis[0] : null;

    // IV signal
    const ivSignal = currentIV > 80 ? 'Extreme volatility — large moves expected, potential capitulation' :
      currentIV > 60 ? 'High volatility — significant price swings likely' :
      currentIV > 40 ? 'Moderate volatility — normal market conditions' :
      currentIV > 25 ? 'Low volatility — compression, breakout likely approaching' :
      'Very low volatility — extreme calm before potential storm';

    return NextResponse.json({
      btcPrice: Math.round(btcPrice),
      overview: {
        aggregatePCR,
        pcrSignal: aggregatePCR > 1.0 ? 'Bearish' : aggregatePCR > 0.7 ? 'Neutral-Bearish' :
          aggregatePCR > 0.5 ? 'Neutral' : aggregatePCR > 0.3 ? 'Neutral-Bullish' : 'Bullish',
        currentIV,
        ivSignal,
        totalCallOI: Math.round(totalCalls * 100) / 100,
        totalPutOI: Math.round(totalPuts * 100) / 100,
        nearestMaxPain: nearestExpiry?.maxPain || 0,
        nearestExpiry: nearestExpiry?.expiry || '',
        nearestMaxPainDiff: nearestExpiry?.maxPainDiff || 0,
      },
      expiryAnalysis,
      historicalVolatility: recentVol,
      futures: futuresList,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch options data: ' + error.message },
      { status: 500 }
    );
  }
}