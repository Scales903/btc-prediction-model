import { NextResponse } from 'next/server';

const HALVINGS = [
  {
    number: 1, date: '2012-11-28', block: 210000, reward: 25,
    priceAtHalving: 12.35, cyclePeak: 1177, cyclePeakDate: '2013-12-04',
    daysToPeak: 371, peakMultiple: 95.3, cycleBottom: 152,
    cycleBottomDate: '2015-01-14', drawdownFromPeak: -87.1,
  },
  {
    number: 2, date: '2016-07-09', block: 420000, reward: 12.5,
    priceAtHalving: 650, cyclePeak: 19783, cyclePeakDate: '2017-12-17',
    daysToPeak: 526, peakMultiple: 30.4, cycleBottom: 3122,
    cycleBottomDate: '2018-12-15', drawdownFromPeak: -84.2,
  },
  {
    number: 3, date: '2020-05-11', block: 630000, reward: 6.25,
    priceAtHalving: 8821, cyclePeak: 69045, cyclePeakDate: '2021-11-10',
    daysToPeak: 548, peakMultiple: 7.8, cycleBottom: 15460,
    cycleBottomDate: '2022-11-21', drawdownFromPeak: -77.6,
  },
  {
    number: 4, date: '2024-04-19', block: 840000, reward: 3.125,
    priceAtHalving: 63800, cyclePeak: null, cyclePeakDate: null,
    daysToPeak: null, peakMultiple: null, cycleBottom: null,
    cycleBottomDate: null, drawdownFromPeak: null,
  },
];

function buildCycleComparisons() {
  const cycle2 = [
    { day: 0, price: 1.0 }, { day: 30, price: 1.12 }, { day: 60, price: 1.18 },
    { day: 90, price: 1.05 }, { day: 120, price: 1.15 }, { day: 150, price: 1.35 },
    { day: 180, price: 1.52 }, { day: 210, price: 2.1 }, { day: 240, price: 2.8 },
    { day: 270, price: 3.5 }, { day: 300, price: 5.2 }, { day: 330, price: 7.8 },
    { day: 360, price: 12.5 }, { day: 390, price: 18.2 }, { day: 420, price: 22.5 },
    { day: 450, price: 26.8 }, { day: 480, price: 28.5 }, { day: 510, price: 30.0 },
    { day: 526, price: 30.4 }, { day: 540, price: 25.2 }, { day: 570, price: 18.5 },
    { day: 600, price: 12.1 }, { day: 630, price: 8.2 }, { day: 660, price: 6.5 },
    { day: 690, price: 5.1 }, { day: 720, price: 4.8 },
  ];
  const cycle3 = [
    { day: 0, price: 1.0 }, { day: 30, price: 1.08 }, { day: 60, price: 1.05 },
    { day: 90, price: 1.12 }, { day: 120, price: 1.35 }, { day: 150, price: 1.58 },
    { day: 180, price: 2.15 }, { day: 210, price: 2.4 }, { day: 240, price: 3.8 },
    { day: 270, price: 3.35 }, { day: 300, price: 4.2 }, { day: 330, price: 5.5 },
    { day: 360, price: 6.65 }, { day: 390, price: 6.8 }, { day: 420, price: 5.2 },
    { day: 450, price: 4.4 }, { day: 480, price: 5.1 }, { day: 510, price: 5.5 },
    { day: 540, price: 7.1 }, { day: 548, price: 7.8 }, { day: 570, price: 6.9 },
    { day: 600, price: 5.4 }, { day: 630, price: 4.2 }, { day: 660, price: 3.1 },
    { day: 690, price: 2.4 }, { day: 720, price: 1.75 },
  ];
  return { cycle2, cycle3 };
}

function calculateStockToFlow() {
  const currentSupply = 19850000;
  const currentReward = 3.125;
  const blocksPerYear = 52560;
  const annualProduction = currentReward * blocksPerYear;
  const s2fRatio = currentSupply / annualProduction;
  const modelPrice = Math.exp(3.21 * Math.log(s2fRatio) - 1.02);
  return {
    ratio: Math.round(s2fRatio * 10) / 10,
    annualProduction: Math.round(annualProduction),
    dailyProduction: Math.round(currentReward * 144 * 100) / 100,
    modelPrice: Math.round(modelPrice),
    currentSupply,
    maxSupply: 21000000,
    percentMined: Math.round((currentSupply / 21000000) * 10000) / 100,
  };
}

export async function GET() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false',
      { next: { revalidate: 300 } }
    );

    let currentPrice = 0;
    let marketCap = 0;
    let circulatingSupply = 19850000;

    if (response.ok) {
      const data = await response.json();
      currentPrice = data.market_data?.current_price?.usd || 0;
      marketCap = data.market_data?.market_cap?.usd || 0;
      circulatingSupply = data.market_data?.circulating_supply || 19850000;
    }

    const lastHalving = new Date('2024-04-19');
    const now = new Date();
    const daysSinceHalving = Math.floor((now.getTime() - lastHalving.getTime()) / (1000 * 60 * 60 * 24));
    const estimatedNextHalving = new Date('2028-03-15');
    const daysToNextHalving = Math.floor((estimatedNextHalving.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalCycleDays = Math.floor((estimatedNextHalving.getTime() - lastHalving.getTime()) / (1000 * 60 * 60 * 24));
    const cycleProgress = Math.round((daysSinceHalving / totalCycleDays) * 10000) / 100;

    const halvingPrice = 63800;
    const currentMultiple = Math.round((currentPrice / halvingPrice) * 100) / 100;

    const estimatedRealizedPrice = Math.round(currentPrice * 0.55);
    const mvrvRatio = Math.round((currentPrice / estimatedRealizedPrice) * 100) / 100;
    const estimatedRealizedCap = estimatedRealizedPrice * circulatingSupply;
    const nupl = Math.round(((marketCap - estimatedRealizedCap) / marketCap) * 1000) / 1000;
    const totalMinedRevenue = 19850000 * 30000;
    const thermocapMultiple = Math.round((marketCap / totalMinedRevenue) * 100) / 100;

    const cycles = buildCycleComparisons();
    const priceMultiple = currentPrice / halvingPrice;
    const monthlyPrices = [
      { day: 0, price: 1.0 },
      { day: 30, price: 1.02 },
      { day: 60, price: 1.06 },
      { day: 90, price: 0.92 },
      { day: 120, price: 0.99 },
      { day: 150, price: 1.03 },
      { day: 180, price: 1.13 },
      { day: 210, price: 1.43 },
      { day: 240, price: 1.52 },
      { day: 270, price: 1.60 },
      { day: 300, price: 1.62 },
      { day: daysSinceHalving, price: Math.round(priceMultiple * 100) / 100 },
    ];

    const s2f = calculateStockToFlow();

    return NextResponse.json({
      halvings: HALVINGS,
      currentCycle: {
        number: 4,
        daysSinceHalving,
        daysToNextHalving,
        cycleProgress,
        halvingPrice,
        currentPrice: Math.round(currentPrice),
        currentMultiple,
        projectedPeakWindow: {
          earliest: new Date(lastHalving.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          latest: new Date(lastHalving.getTime() + 600 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          daysFromNow: {
            earliest: Math.max(0, 365 - daysSinceHalving),
            latest: Math.max(0, 600 - daysSinceHalving),
          },
        },
      },
      cycleComparison: {
        cycle2: cycles.cycle2,
        cycle3: cycles.cycle3,
        cycle4: monthlyPrices,
      },
      onchain: {
        mvrv: mvrvRatio,
        mvrvSignal: mvrvRatio > 3.5 ? 'Extreme overvaluation' :
          mvrvRatio > 2.5 ? 'Overvalued — approaching cycle top territory' :
          mvrvRatio > 1.5 ? 'Fair value — mid-cycle territory' :
          mvrvRatio > 1.0 ? 'Undervalued — accumulation zone' :
          'Deep undervaluation — generational buy zone',
        nupl,
        nuplSignal: nupl > 0.7 ? 'Euphoria — extreme greed' :
          nupl > 0.5 ? 'Belief — bull market' :
          nupl > 0.25 ? 'Optimism — healthy bull trend' :
          nupl > 0 ? 'Hope — early recovery' :
          'Capitulation — maximum pain',
        estimatedRealizedPrice,
        thermocapMultiple,
      },
      stockToFlow: s2f,
      supply: {
        circulating: circulatingSupply,
        max: 21000000,
        percentMined: s2f.percentMined,
        remainingBTC: 21000000 - circulatingSupply,
        dailyIssuance: s2f.dailyProduction,
        annualInflation: Math.round((s2f.annualProduction / circulatingSupply) * 10000) / 100,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch on-chain data: ' + error.message },
      { status: 500 }
    );
  }
}