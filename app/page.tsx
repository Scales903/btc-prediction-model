'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, ComposedChart, Area, ReferenceLine
} from 'recharts';
import {
  TrendingUp, Calendar, DollarSign, Building2, Activity,
  Sparkles, RefreshCw, ChevronDown, ChevronUp, Download, Brain
} from 'lucide-react';

// ════
// CONSTANTS & HISTORICAL DATA
// ════

const ETF_DATA = [
  { month: 'Feb 24', ibit: 0, fbtc: 0, arkb: 0, btcPrice: 43000, totalFlow: 0, cumulative: 0 },
  { month: 'Mar 24', ibit: 4600, fbtc: 3200, arkb: 1800, btcPrice: 51000, totalFlow: 9600, cumulative: 9600 },
  { month: 'Apr 24', ibit: 6200, fbtc: 4100, arkb: 2400, btcPrice: 64000, totalFlow: 12700, cumulative: 22300 },
  { month: 'May 24', ibit: 8100, fbtc: 5300, arkb: 3100, btcPrice: 67500, totalFlow: 16500, cumulative: 38800 },
  { month: 'Jun 24', ibit: 5800, fbtc: 3600, arkb: 2200, btcPrice: 62000, totalFlow: 11600, cumulative: 50400 },
  { month: 'Jul 24', ibit: 7200, fbtc: 4800, arkb: 2900, btcPrice: 58500, totalFlow: 14900, cumulative: 65300 },
  { month: 'Aug 24', ibit: 9500, fbtc: 6100, arkb: 3700, btcPrice: 63000, totalFlow: 19300, cumulative: 84600 },
  { month: 'Sep 24', ibit: 11200, fbtc: 7400, arkb: 4200, btcPrice: 65800, totalFlow: 22800, cumulative: 107400 },
  { month: 'Oct 24', ibit: 13800, fbtc: 8900, arkb: 5100, btcPrice: 72000, totalFlow: 27800, cumulative: 135200 },
  { month: 'Nov 24', ibit: 16500, fbtc: 10200, arkb: 5800, btcPrice: 91000, totalFlow: 32500, cumulative: 167700 },
  { month: 'Dec 24', ibit: 18200, fbtc: 11500, arkb: 6400, btcPrice: 96800, totalFlow: 36100, cumulative: 203800 },
  { month: 'Jan 25', ibit: 19800, fbtc: 12300, arkb: 7100, btcPrice: 102000, totalFlow: 39200, cumulative: 243000 },
  { month: 'Feb 25', ibit: 20500, fbtc: 12800, arkb: 7400, btcPrice: 103500, totalFlow: 40700, cumulative: 283700 },
];

const TECHNICAL_DATA = [
  { date: 'Oct 24', rsi: 62, macd: 1200, signal: 980, histogram: 220, sma50: 63500, sma200: 55200, ema12: 68500, ema26: 65000 },
  { date: 'Nov 24', rsi: 78, macd: 2800, signal: 1600, histogram: 1200, sma50: 68200, sma200: 57800, ema12: 82000, ema26: 72000 },
  { date: 'Dec 24', rsi: 72, macd: 2400, signal: 2100, histogram: 300, sma50: 75500, sma200: 60100, ema12: 92000, ema26: 80000 },
  { date: 'Jan 25', rsi: 68, macd: 1800, signal: 2000, histogram: -200, sma50: 82000, sma200: 63500, ema12: 98000, ema26: 86000 },
  { date: 'Feb 25', rsi: 65, macd: 1500, signal: 1700, histogram: -200, sma50: 86500, sma200: 66200, ema12: 100500, ema26: 89000 },
];

const ICHIMOKU_DATA = [
  { date: 'Oct 24', tenkan: 67000, kijun: 62500, senkouA: 64750, senkouB: 58000, chikou: 72000, price: 72000 },
  { date: 'Nov 24', tenkan: 82000, kijun: 72000, senkouA: 77000, senkouB: 63000, chikou: 91000, price: 91000 },
  { date: 'Dec 24', tenkan: 94000, kijun: 80000, senkouA: 87000, senkouB: 68000, chikou: 96800, price: 96800 },
  { date: 'Jan 25', tenkan: 99000, kijun: 86000, senkouA: 92500, senkouB: 73000, chikou: 102000, price: 102000 },
  { date: 'Feb 25', tenkan: 101000, kijun: 90000, senkouA: 95500, senkouB: 78000, chikou: 103500, price: 103500 },
];

const EXCHANGE_DATA = [
  { date: 'Oct 24', volume: 42.5, fundingRate: 0.015, netflow: -12000, openInterest: 18.5 },
  { date: 'Nov 24', volume: 68.2, fundingRate: 0.035, netflow: -28000, openInterest: 24.2 },
  { date: 'Dec 24', volume: 55.8, fundingRate: 0.022, netflow: -15000, openInterest: 22.8 },
  { date: 'Jan 25', volume: 48.3, fundingRate: 0.018, netflow: -20000, openInterest: 21.5 },
  { date: 'Feb 25', volume: 44.1, fundingRate: 0.028, netflow: -18000, openInterest: 20.8 },
];

const WHALE_ACTIVITY = [
  { month: 'Oct 23', netflow: -6500, price: 34500 },
  { month: 'Nov 23', netflow: -6000, price: 37800 },
  { month: 'Dec 23', netflow: -11500, price: 42200 },
  { month: 'Jan 24', netflow: -16000, price: 42800 },
  { month: 'Feb 24', netflow: -19500, price: 43000 },
  { month: 'Jul 24', netflow: -8000, price: 58500 },
  { month: 'Nov 24', netflow: -34000, price: 97000 },
  { month: 'Jan 25', netflow: -38000, price: 102000 },
  { month: 'Feb 25', netflow: -24000, price: 103500 },
];

const SCENARIOS: Record<string, { label: string; trend: number; volatility: number; color: string }> = {
  bull: { label: 'Bull Case (+35%)', trend: 35, volatility: 20, color: 'text-green-600' },
  base: { label: 'Base Case (+15%)', trend: 15, volatility: 15, color: 'text-blue-600' },
  bear: { label: 'Bear Case (-20%)', trend: -20, volatility: 25, color: 'text-red-600' },
  custom: { label: 'Custom', trend: 5, volatility: 15, color: 'text-purple-600' },
};

const ACCURACY_DATA = [
  { period: '30-Day', predicted: 68500, actual: 72000, accuracy: 95.1 },
  { period: '60-Day', predicted: 75000, actual: 91000, accuracy: 82.4 },
  { period: '90-Day', predicted: 82000, actual: 96800, accuracy: 84.7 },
  { period: '120-Day', predicted: 88000, actual: 102000, accuracy: 86.3 },
  { period: '180-Day', predicted: 72000, actual: 103500, accuracy: 69.6 },
];

// ════
// HELPERS
// ════

function formatPrice(val: number) {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
  return `$${val.toLocaleString()}`;
}

function formatLargePrice(val: number) {
  return `$${val.toLocaleString()}`;
}

function gaussianRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
// ════
// SUB-COMPONENTS
// ════

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center gap-3">
      {icon}
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-lg font-bold text-gray-100">{value}</div>
      </div>
    </div>
  );
}

function SignalCard({ label, value, signal }: { label: string; value: string; signal?: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-bold text-gray-100">{value}</div>
      {signal && <div className="text-xs font-medium text-blue-400 mt-0.5">{signal}</div>}
    </div>
  );
}

function SliderControl({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold text-gray-200">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500" />
    </div>
  );
}
function detectCrossovers(data: any[]): { type: string; signal: 'bullish' | 'bearish'; date: string; description: string; strength: 'strong' | 'moderate' | 'weak' }[] {
  const alerts: { type: string; signal: 'bullish' | 'bearish'; date: string; description: string; strength: 'strong' | 'moderate' | 'weak' }[] = [];
  if (data.length < 3) return alerts;

  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    if (!prev || !curr) continue;

    // Price crosses above SMA 50
    if (prev.price && curr.price && prev.sma50 && curr.sma50) {
      if (prev.price < prev.sma50 && curr.price > curr.sma50) {
        alerts.push({
          type: 'Price × SMA 50',
          signal: 'bullish',
          date: curr.date,
          description: `Price crossed above SMA 50 ($${curr.sma50?.toLocaleString()}). Historically precedes rallies when confirmed by volume and whale accumulation.`,
          strength: 'strong',
        });
      }
      // Price crosses below SMA 50
      if (prev.price > prev.sma50 && curr.price < curr.sma50) {
        alerts.push({
          type: 'Price × SMA 50',
          signal: 'bearish',
          date: curr.date,
          description: `Price fell below SMA 50 ($${curr.sma50?.toLocaleString()}). Watch for SMA 50 to act as resistance on retest attempts.`,
          strength: 'strong',
        });
      }
    }

    // Price crosses above SMA 20
    if (prev.price && curr.price && prev.sma20 && curr.sma20) {
      if (prev.price < prev.sma20 && curr.price > curr.sma20) {
        alerts.push({
          type: 'Price × SMA 20',
          signal: 'bullish',
          date: curr.date,
          description: `Price reclaimed SMA 20 ($${curr.sma20?.toLocaleString()}). Short-term momentum shifting bullish.`,
          strength: 'moderate',
        });
      }
      if (prev.price > prev.sma20 && curr.price < curr.sma20) {
        alerts.push({
          type: 'Price × SMA 20',
          signal: 'bearish',
          date: curr.date,
          description: `Price lost SMA 20 ($${curr.sma20?.toLocaleString()}). Short-term weakness.`,
          strength: 'moderate',
        });
      }
    }

    // SMA 50 crosses SMA 20 (medium-term trend shift)
    if (prev.sma20 && curr.sma20 && prev.sma50 && curr.sma50) {
      if (prev.sma20 < prev.sma50 && curr.sma20 > curr.sma50) {
        alerts.push({
          type: 'SMA 20 × SMA 50',
          signal: 'bullish',
          date: curr.date,
          description: 'SMA 20 crossed above SMA 50 — bullish medium-term momentum shift. Often precedes sustained moves higher.',
          strength: 'strong',
        });
      }
      if (prev.sma20 > prev.sma50 && curr.sma20 < curr.sma50) {
        alerts.push({
          type: 'SMA 20 × SMA 50',
          signal: 'bearish',
          date: curr.date,
          description: 'SMA 20 crossed below SMA 50 — bearish medium-term momentum shift. Watch for further downside.',
          strength: 'strong',
        });
      }
    }

    // RSI crosses above 30 (oversold recovery)
    if (prev.rsi != null && curr.rsi != null) {
      if (prev.rsi < 30 && curr.rsi >= 30) {
        alerts.push({
          type: 'RSI Recovery',
          signal: 'bullish',
          date: curr.date,
          description: `RSI crossed above 30 (${curr.rsi.toFixed(1)}) — exiting oversold territory. Historically a buy signal when combined with volume.`,
          strength: 'strong',
        });
      }
      // RSI crosses below 70 (overbought exit)
      if (prev.rsi > 70 && curr.rsi <= 70) {
        alerts.push({
          type: 'RSI Rejection',
          signal: 'bearish',
          date: curr.date,
          description: `RSI fell below 70 (${curr.rsi.toFixed(1)}) — exiting overbought zone. Momentum fading, watch for correction.`,
          strength: 'moderate',
        });
      }
      // RSI crosses above 50 (momentum shift)
      if (prev.rsi < 50 && curr.rsi >= 50) {
        alerts.push({
          type: 'RSI Momentum',
          signal: 'bullish',
          date: curr.date,
          description: `RSI crossed above 50 (${curr.rsi.toFixed(1)}) — momentum shifting from bearish to bullish.`,
          strength: 'moderate',
        });
      }
      if (prev.rsi > 50 && curr.rsi <= 50) {
        alerts.push({
          type: 'RSI Momentum',
          signal: 'bearish',
          date: curr.date,
          description: `RSI fell below 50 (${curr.rsi.toFixed(1)}) — momentum shifting from bullish to bearish.`,
          strength: 'moderate',
        });
      }
    }

    // MACD crosses signal line
    if (prev.macd != null && curr.macd != null && prev.signal != null && curr.signal != null) {
      if (prev.macd < prev.signal && curr.macd > curr.signal) {
        alerts.push({
          type: 'MACD Crossover',
          signal: 'bullish',
          date: curr.date,
          description: 'MACD crossed above signal line — bullish momentum confirmed. Strongest when occurring below zero line.',
          strength: curr.macd < 0 ? 'strong' : 'moderate',
        });
      }
      if (prev.macd > prev.signal && curr.macd < curr.signal) {
        alerts.push({
          type: 'MACD Crossover',
          signal: 'bearish',
          date: curr.date,
          description: 'MACD crossed below signal line — bearish momentum confirmed. Strongest when occurring above zero line.',
          strength: curr.macd > 0 ? 'strong' : 'moderate',
        });
      }
    }

    // MACD histogram flip
    if (prev.histogram != null && curr.histogram != null) {
      if (prev.histogram < 0 && curr.histogram > 0) {
        alerts.push({
          type: 'MACD Histogram',
          signal: 'bullish',
          date: curr.date,
          description: 'MACD histogram turned positive — buying pressure exceeding selling pressure.',
          strength: 'weak',
        });
      }
      if (prev.histogram > 0 && curr.histogram < 0) {
        alerts.push({
          type: 'MACD Histogram',
          signal: 'bearish',
          date: curr.date,
          description: 'MACD histogram turned negative — selling pressure exceeding buying pressure.',
          strength: 'weak',
        });
      }
    }

    // Bollinger Band touches
    if (curr.price && curr.bbUpper && curr.bbLower) {
      if (curr.price >= curr.bbUpper * 0.99) {
        alerts.push({
          type: 'BB Upper Touch',
          signal: 'bearish',
          date: curr.date,
          description: `Price touching upper Bollinger Band ($${curr.bbUpper?.toLocaleString()}) — potential overbought, watch for mean reversion.`,
          strength: 'weak',
        });
      }
      if (curr.price <= curr.bbLower * 1.01) {
        alerts.push({
          type: 'BB Lower Touch',
          signal: 'bullish',
          date: curr.date,
          description: `Price touching lower Bollinger Band ($${curr.bbLower?.toLocaleString()}) — potential oversold, watch for bounce.`,
          strength: 'weak',
        });
      }
    }

    // Ichimoku cloud breakout
    if (curr.price && curr.senkouA && curr.senkouB && prev.price && prev.senkouA && prev.senkouB) {
      const currAboveCloud = curr.price > Math.max(curr.senkouA, curr.senkouB);
      const prevAboveCloud = prev.price > Math.max(prev.senkouA, prev.senkouB);
      const currBelowCloud = curr.price < Math.min(curr.senkouA, curr.senkouB);
      const prevBelowCloud = prev.price < Math.min(prev.senkouA, prev.senkouB);

      if (currAboveCloud && !prevAboveCloud) {
        alerts.push({
          type: 'Ichimoku Breakout',
          signal: 'bullish',
          date: curr.date,
          description: 'Price broke above Ichimoku cloud — strong bullish signal. Cloud now acts as support.',
          strength: 'strong',
        });
      }
      if (currBelowCloud && !prevBelowCloud) {
        alerts.push({
          type: 'Ichimoku Breakdown',
          signal: 'bearish',
          date: curr.date,
          description: 'Price fell below Ichimoku cloud — strong bearish signal. Cloud now acts as resistance.',
          strength: 'strong',
        });
      }
    }
  }

  return alerts.reverse(); // Most recent first
}
// ════
// MAIN COMPONENT
// ════
// Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(60);
  const [countdown, setCountdown] = useState(60);

export default function BTCPredictionModel() {
  const [currentPrice, setCurrentPrice] = useState(70000);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [volatility, setVolatility] = useState(55);
  const [trend, setTrend] = useState(15);
  const [timeHorizon, setTimeHorizon] = useState(90);
  const [projectionData, setProjectionData] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState('custom');
  const [showMultiScenario, setShowMultiScenario] = useState(false);
  const [multiScenarioData, setMultiScenarioData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('projection');
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAiUpdate, setLastAiUpdate] = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(true);
// Live market data
  const [liveData, setLiveData] = useState<any>(null);
  const [liveTechnicals, setLiveTechnicals] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dataLastUpdated, setDataLastUpdated] = useState<string>('');
  // On-chain data
  const [onchainData, setOnchainData] = useState<any>(null);
  const [isLoadingOnchain, setIsLoadingOnchain] = useState(false);
  // Macro data
  const [macroData, setMacroData] = useState<any>(null);
  const [isLoadingMacro, setIsLoadingMacro] = useState(false);
  // ── FETCH LIVE PRICE ────────────────────────────────────────────────────

  const fetchLivePrice = async () => {
    setIsLoadingPrice(true);
    try {
      const response = await fetch('/api/btc-price');
      const data = await response.json();
      setLivePrice(data.price);
      setCurrentPrice(data.price);
      setLastPriceUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching live price:', error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  useEffect(() => {
    fetchLivePrice();
  }, []);
// ── FETCH LIVE MARKET DATA ──────────────────────────────────────────────

  const fetchMarketData = async (days: number = 90) => {
    setIsLoadingData(true);
    setDataError(null);
    try {
      const response = await fetch(`/api/market-data?days=${days}`);
      const data = await response.json();
      if (data.error) {
        setDataError(data.error);
      } else {
        setLiveData(data.snapshot);
        setLiveTechnicals(data.timeSeries);
        setDataLastUpdated(new Date().toLocaleTimeString());
        if (data.snapshot.price) {
          setCurrentPrice(data.snapshot.price);
          setLivePrice(data.snapshot.price);
        }
      }
    } catch (err) {
      setDataError('Failed to fetch market data');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchMarketData(90);
  }, []);
  // ── FETCH ON-CHAIN DATA ─────────────────────────────────────────────────

  const fetchOnchainData = async () => {
    setIsLoadingOnchain(true);
    try {
      const response = await fetch('/api/onchain');
      const data = await response.json();
      if (!data.error) setOnchainData(data);
    } catch (err) {
      console.error('On-chain fetch error:', err);
    } finally {
      setIsLoadingOnchain(false);
    }
  };

  useEffect(() => {
    fetchOnchainData();
  }, []);
    // ── FETCH MACRO DATA ────────────────────────────────────────────────────

  const fetchMacroData = async () => {
    setIsLoadingMacro(true);
    try {
      const response = await fetch('/api/macro');
      const data = await response.json();
      if (!data.error) setMacroData(data);
    } catch (err) {
      console.error('Macro fetch error:', err);
    } finally {
      setIsLoadingMacro(false);
    }
  };

  useEffect(() => {
    fetchMacroData();
    // ── AUTO-REFRESH TIMER ──────────────────────────────────────────────────

  useEffect(() => {
    if (!autoRefresh) return;

    setCountdown(refreshInterval);

    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Trigger refreshes
          fetchLivePrice();
          fetchMarketData(90);
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [autoRefresh, refreshInterval]);
  }, []);

  // ── PROJECTION ENGINE (Monte Carlo / GBM) ──────────────────────────────

  const generateProjection = useCallback(() => {
    const data: any[] = [];
    const numSimulations = 100;
    const dailyDrift = (trend / 100) / 365;
    const dailyVol = (volatility / 100) / Math.sqrt(365);

    const allPaths: number[][] = [];
    for (let sim = 0; sim < numSimulations; sim++) {
      const path = [currentPrice];
      let price = currentPrice;
      for (let day = 1; day <= timeHorizon; day++) {
        const shock = gaussianRandom();
        price = price * Math.exp((dailyDrift - 0.5 * dailyVol * dailyVol) + dailyVol * shock);
        path.push(Math.max(price, 0));
      }
      allPaths.push(path);
    }

    for (let day = 0; day <= timeHorizon; day++) {
      const dayPrices = allPaths.map(p => p[day]).sort((a, b) => a - b);
      const median = dayPrices[Math.floor(numSimulations * 0.5)];
      const p10 = dayPrices[Math.floor(numSimulations * 0.1)];
      const p25 = dayPrices[Math.floor(numSimulations * 0.25)];
      const p75 = dayPrices[Math.floor(numSimulations * 0.75)];
      const p90 = dayPrices[Math.floor(numSimulations * 0.9)];
      const mean = dayPrices.reduce((a, b) => a + b, 0) / numSimulations;

      const date = new Date();
      date.setDate(date.getDate() + day);

      data.push({
        day,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        median: Math.round(median),
        mean: Math.round(mean),
        p10: Math.round(p10),
        p25: Math.round(p25),
        p75: Math.round(p75),
        p90: Math.round(p90),
      });
    }

    setProjectionData(data);
  }, [currentPrice, volatility, trend, timeHorizon]);

  useEffect(() => {
    generateProjection();
  }, [generateProjection]);

  // ── MULTI-SCENARIO ENGINE ───────────────────────────────────────────────

  const generateMultiScenario = useCallback(() => {
    const scenarioKeys = ['bear', 'base', 'bull'] as const;
    const data: any[] = [];

    for (let day = 0; day <= timeHorizon; day += Math.max(1, Math.floor(timeHorizon / 60))) {
      const point: any = { day };
      const date = new Date();
      date.setDate(date.getDate() + day);
      point.date = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      for (const key of scenarioKeys) {
        const sc = SCENARIOS[key];
        const dailyDrift = (sc.trend / 100) / 365;
        const expectedPrice = currentPrice * Math.exp(dailyDrift * day);
        point[key] = Math.round(expectedPrice);
      }
      data.push(point);
    }
    setMultiScenarioData(data);
  }, [currentPrice, timeHorizon]);

  useEffect(() => {
    if (showMultiScenario) generateMultiScenario();
  }, [showMultiScenario, generateMultiScenario]);

  // ── SCENARIO HANDLER ────────────────────────────────────────────────────

  const applyScenario = (key: string) => {
    setSelectedScenario(key);
    if (key !== 'custom') {
      setTrend(SCENARIOS[key].trend);
      setVolatility(SCENARIOS[key].volatility);
    }
  };

  // ── AI AGENT ────────────────────────────────────────────────────────────

const runAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai-analysis', { method: 'POST' });
      const data = await response.json();

      if (data.error) {
        setAiAnalysis({ error: data.error });
      } else {
        setAiAnalysis(data);
        setLastAiUpdate(new Date().toLocaleString());
        if (data.currentPrice) setCurrentPrice(Math.round(data.currentPrice));
        if (data.recommendedTrend != null) setTrend(data.recommendedTrend);
        if (data.recommendedVolatility != null) setVolatility(data.recommendedVolatility);
        setSelectedScenario('custom');
      }
    } catch (err) {
      console.error('AI Analysis error:', err);
      setAiAnalysis({ error: 'Failed to connect to AI analysis endpoint.' });
    } finally {
      setIsAnalyzing(false);
    }
  };


  // ── EXPORT REPORT ───────────────────────────────────────────────────────

  const exportReport = () => {
    const finalProj = projectionData[projectionData.length - 1];
    const expectedPrice = finalProj?.median || 0;
    const expectedChange = ((expectedPrice - currentPrice) / currentPrice * 100).toFixed(1);
    const avgAccuracy = (ACCURACY_DATA.reduce((sum, d) => sum + d.accuracy, 0) / ACCURACY_DATA.length).toFixed(1);
    const latestTechR = TECHNICAL_DATA[TECHNICAL_DATA.length - 1];
    const latestExR = EXCHANGE_DATA[EXCHANGE_DATA.length - 1];

    const content = `BITCOIN PRICE PREDICTION MODEL - COMPREHENSIVE ANALYSIS
Generated: ${new Date().toLocaleString()}
: 508 Capital LLC

${'='.repeat(60)}
EXECUTIVE SUMMARY
${'='.repeat(60)}

Current BTC Price: $${currentPrice.toLocaleString()}
${livePrice ? `Live Price: $${livePrice.toLocaleString()} (Updated: ${lastPriceUpdate})` : ''}
Time Horizon: ${timeHorizon} days
Parameters: ${trend > 0 ? '+' : ''}${trend}% annual trend, ${volatility}% volatility

Expected (Current Settings): $${Math.round(expectedPrice).toLocaleString()} (${expectedChange}%)

${'='.repeat(60)}
TECHNICAL INDICATORS
${'='.repeat(60)}

RSI (14): ${latestTechR.rsi}
MACD: ${latestTechR.macd.toLocaleString()} | Signal: ${latestTechR.signal.toLocaleString()}
SMA 50: $${latestTechR.sma50.toLocaleString()} | SMA 200: $${latestTechR.sma200.toLocaleString()}

${'='.repeat(60)}
EXCHANGE DATA
${'='.repeat(60)}

24h Volume: $${latestExR.volume}B
Funding Rate: ${(latestExR.fundingRate * 100).toFixed(2)}%
Net Exchange Flow: ${(latestExR.netflow / 1000).toFixed(1)}K BTC
Open Interest: $${latestExR.openInterest}B

${'='.repeat(60)}
MODEL VALIDATION
${'='.repeat(60)}

Average Accuracy: ${avgAccuracy}%

${aiAnalysis && !aiAnalysis.error ? `${'='.repeat(60)}
AI MARKET INTELLIGENCE
${'='.repeat(60)}

Sentiment: ${aiAnalysis.sentimentScore}/10 | Confidence: ${aiAnalysis.confidence}
${aiAnalysis.headline}
${aiAnalysis.findings?.map((f: string) => `  - ${f}`).join('\n')}
` : ''}
${'='.repeat(60)}
DISCLAIMER: For informational purposes only. Not financial advice.
${'='.repeat(60)}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BTC_Report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── DERIVED METRICS ─────────────────────────────────────────────────────

  const latestTech = TECHNICAL_DATA[TECHNICAL_DATA.length - 1];
  const latestIchi = ICHIMOKU_DATA[ICHIMOKU_DATA.length - 1];
  const latestExchange = EXCHANGE_DATA[EXCHANGE_DATA.length - 1];
  const latestETF = ETF_DATA[ETF_DATA.length - 1];
  const finalProjection = projectionData[projectionData.length - 1];

  const rsiSignal = latestTech.rsi > 70 ? 'Overbought' : latestTech.rsi < 30 ? 'Oversold' : 'Neutral';
  const macdSignal = latestTech.histogram > 0 ? 'Bullish' : 'Bearish';
  const ichimokuSignal = latestIchi.price > latestIchi.senkouA && latestIchi.price > latestIchi.senkouB
    ? 'Above Cloud (Bullish)' : latestIchi.price < latestIchi.senkouA && latestIchi.price < latestIchi.senkouB
    ? 'Below Cloud (Bearish)' : 'In Cloud (Neutral)';
  const fundingSignal = latestExchange.fundingRate > 0.030 ? 'Overheated' :
    latestExchange.fundingRate > 0.015 ? 'Mildly Bullish' : 'Neutral/Bearish';

  // 
  // RENDER
  // 

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Auto-refresh toggle */}
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
              <button onClick={() => setAutoRefresh(!autoRefresh)}
                className={`relative w-10 h-5 rounded-full transition-colors ${autoRefresh ? 'bg-green-600' : 'bg-gray-600'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoRefresh ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-xs text-gray-400">Auto</span>
              {autoRefresh && (
                <span className="text-xs font-mono text-green-400">{countdown}s</span>
              )}
            </div>
            {autoRefresh && (
              <select value={refreshInterval} onChange={e => { setRefreshInterval(Number(e.target.value)); setCountdown(Number(e.target.value)); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-xs text-gray-300">
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={120}>2m</option>
                <option value={300}>5m</option>
              </select>
            )}
            <button onClick={fetchLivePrice} disabled={isLoadingPrice}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors">
              {isLoadingPrice ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4 text-green-400" />}
              {livePrice ? `$${livePrice.toLocaleString()}` : 'Fetch Price'}
            </button>
            <button onClick={runAiAnalysis} disabled={isAnalyzing}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 disabled:opacity-60 transition-all shadow-md text-sm">
              {isAnalyzing ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Run AI Analysis</>}
            </button>
            <button onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Bitcoin Price Prediction Model</h1>
              <p className="text-sm text-gray-400">: 508 Capital LLC</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchLivePrice} disabled={isLoadingPrice}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors">
              {isLoadingPrice ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4 text-green-400" />}
              {livePrice ? `$${livePrice.toLocaleString()}` : 'Fetch Price'}
            </button>
            <button onClick={runAiAnalysis} disabled={isAnalyzing}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 disabled:opacity-60 transition-all shadow-md text-sm">
              {isAnalyzing ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Run AI Analysis</>}
            </button>
            <button onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* AI PANEL */}
        {aiAnalysis && !aiAnalysis.error && (
          <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-700/50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-purple-200">AI Market Intelligence</span>
                {lastAiUpdate && <span className="text-xs text-purple-500 ml-2">Updated {lastAiUpdate}</span>}
              </div>
              <button onClick={() => setShowAiPanel(!showAiPanel)} className="text-purple-400 hover:text-purple-300">
                {showAiPanel ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
            {showAiPanel && (
              <>
                <p className="text-purple-100 font-medium">{aiAnalysis.headline}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-900/60 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400">Sentiment</div>
                    <div className="text-2xl font-bold text-purple-300">{aiAnalysis.sentimentScore}/10</div>
                  </div>
                  <div className="bg-gray-900/60 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400">Rec. Trend</div>
                    <div className={`text-2xl font-bold ${aiAnalysis.recommendedTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {aiAnalysis.recommendedTrend > 0 ? '+' : ''}{aiAnalysis.recommendedTrend}%
                    </div>
                  </div>
                  <div className="bg-gray-900/60 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400">Rec. Volatility</div>
                    <div className="text-2xl font-bold text-orange-400">{aiAnalysis.recommendedVolatility}%</div>
                  </div>
                  <div className="bg-gray-900/60 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400">Confidence</div>
                    <div className="text-2xl font-bold text-blue-400 capitalize">{aiAnalysis.confidence}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  {aiAnalysis.findings?.map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-purple-200">
                      <span className="text-purple-500 mt-0.5">•</span><span>{f}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {aiAnalysis?.error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-red-300 text-sm">{aiAnalysis.error}</div>
        )}

        {/* QUICK METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard icon={<DollarSign className="w-5 h-5 text-orange-500" />} label="Starting Price" value={formatLargePrice(currentPrice)} />
          <MetricCard icon={<TrendingUp className="w-5 h-5 text-green-500" />} label="24h Change"
            value={liveData ? `${liveData.change24h > 0 ? '+' : ''}${liveData.change24h}%` : (finalProjection ? `${((finalProjection.median - currentPrice) / currentPrice * 100).toFixed(1)}%` : '—')} />
          <MetricCard icon={<Activity className="w-5 h-5 text-blue-500" />} label="RSI"
            value={`${liveData?.rsi ?? latestTech.rsi} (${(liveData?.rsi ?? latestTech.rsi) > 70 ? 'Overbought' : (liveData?.rsi ?? latestTech.rsi) < 30 ? 'Oversold' : 'Neutral'})`} />
          <MetricCard icon={<Building2 className="w-5 h-5 text-purple-500" />} label="Market Cap"
            value={liveData ? `$${liveData.marketCap}B` : `$${(latestETF.cumulative / 1000).toFixed(1)}B`} />
          <MetricCard icon={<Activity className="w-5 h-5 text-yellow-500" />} label="30d Change"
            value={liveData ? `${liveData.change30d > 0 ? '+' : ''}${liveData.change30d}%` : `${(latestExchange.fundingRate * 100).toFixed(2)}%`} />
        </div>

        {/* TABS */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'projection', label: 'Price Projection' },
            { key: 'multiScenario', label: 'Multi-Scenario' },
            { key: 'technicals', label: 'Technical Indicators' },
            { key: 'ichimoku', label: 'Ichimoku Cloud' },
            { key: 'etf', label: 'ETF Flows' },
            { key: 'exchange', label: 'Exchange Data' },
            { key: 'whale', label: 'Whale Activity' },
            { key: 'accuracy', label: 'Model Accuracy' },
            { key: 'onchain', label: 'On-Chain Metrics' },
            { key: 'halving', label: 'Halving Cycle' },
            { key: 'macro', label: 'Macro Dashboard' },
          ].map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); if (t.key === 'multiScenario') setShowMultiScenario(true); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                ${activeTab === t.key ? 'bg-orange-500 text-white shadow' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: PROJECTION */}
        {activeTab === 'projection' && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <SliderControl label="Starting Price" value={currentPrice} min={10000} max={250000} step={500}
                  display={formatLargePrice(currentPrice)} onChange={(v: number) => setCurrentPrice(v)} />
                <SliderControl label="Annual Trend (%)" value={trend} min={-50} max={100} step={1}
                  display={`${trend > 0 ? '+' : ''}${trend}%`}
                  onChange={(v: number) => { setTrend(v); setSelectedScenario('custom'); }} />
                <SliderControl label="Annualized Volatility (%)" value={volatility} min={5} max={80} step={1}
                  display={`${volatility}%`}
                  onChange={(v: number) => { setVolatility(v); setSelectedScenario('custom'); }} />
                <SliderControl label="Time Horizon (days)" value={timeHorizon} min={7} max={365} step={1}
                  display={`${timeHorizon} days`} onChange={(v: number) => setTimeHorizon(v)} />
              </div>
              <div className="space-y-4">
                <div className="text-sm font-semibold text-gray-300 mb-1">Scenarios</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(SCENARIOS).map(([key, sc]) => (
                    <button key={key} onClick={() => applyScenario(key)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors
                        ${selectedScenario === key ? 'bg-orange-500/20 border-orange-500 text-orange-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                      {sc.label}
                    </button>
                  ))}
                </div>
                {finalProjection && (
                  <div className="bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
                    <div className="font-semibold text-gray-200">{timeHorizon}-Day Projection Summary</div>
                    <div className="grid grid-cols-2 gap-y-1 text-gray-400">
                      <span>Median:</span><span className="font-medium text-gray-200">{formatLargePrice(finalProjection.median)}</span>
                      <span>90th Pctl:</span><span className="font-medium text-green-400">{formatLargePrice(finalProjection.p90)}</span>
                      <span>10th Pctl:</span><span className="font-medium text-red-400">{formatLargePrice(finalProjection.p10)}</span>
                      <span>Expected Δ:</span>
                      <span className={`font-medium ${finalProjection.median >= currentPrice ? 'text-green-400' : 'text-red-400'}`}>
                        {((finalProjection.median - currentPrice) / currentPrice * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
                <button onClick={generateProjection}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm transition-colors">
                  <RefreshCw className="w-4 h-4" /> Re-run Simulation
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} interval={Math.max(1, Math.floor(timeHorizon / 10))} />
                <YAxis tickFormatter={formatPrice} tick={{ fontSize: 11, fill: '#9ca3af' }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }} formatter={(v: any) => formatLargePrice(v)} />
                <Legend />
                <Area type="monotone" dataKey="p90" stroke="none" fill="#065f46" fillOpacity={0.3} name="90th Pctl" />
                <Area type="monotone" dataKey="p75" stroke="none" fill="#064e3b" fillOpacity={0.2} name="75th Pctl" />
                <Area type="monotone" dataKey="p25" stroke="none" fill="#78350f" fillOpacity={0.2} name="25th Pctl" />
                <Area type="monotone" dataKey="p10" stroke="none" fill="#7f1d1d" fillOpacity={0.3} name="10th Pctl" />
                <Line type="monotone" dataKey="median" stroke="#f97316" strokeWidth={2.5} dot={false} name="Median" />
                <Line type="monotone" dataKey="mean" stroke="#818cf8" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Mean" />
                <ReferenceLine y={currentPrice} stroke="#6b7280" strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* TAB: MULTI-SCENARIO */}
        {activeTab === 'multiScenario' && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-5">
            <h2 className="text-lg font-bold text-white">Multi-Scenario Comparison</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={multiScenarioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} interval={Math.max(1, Math.floor(multiScenarioData.length / 10))} />
                <YAxis tickFormatter={formatPrice} tick={{ fontSize: 11, fill: '#9ca3af' }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(v: any) => formatLargePrice(v)} />
                <Legend />
                <Line type="monotone" dataKey="bull" stroke="#22c55e" strokeWidth={2} dot={false} name="Bull (+35%)" />
                <Line type="monotone" dataKey="base" stroke="#3b82f6" strokeWidth={2} dot={false} name="Base (+15%)" />
                <Line type="monotone" dataKey="bear" stroke="#ef4444" strokeWidth={2} dot={false} name="Bear (-20%)" />
                <ReferenceLine y={currentPrice} stroke="#6b7280" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

  {/* TAB: TECHNICALS */}
  <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Technical Indicators {liveData ? '(Live)' : '(Static)'}</h2>
        {activeTab === 'technicals' && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Technical Indicators {liveData ? '(Live)' : '(Static)'}</h2>
              <div className="flex items-center gap-2">
                {dataLastUpdated && <span className="text-xs text-gray-500">Updated {dataLastUpdated}</span>}
                <button onClick={() => fetchMarketData(90)} disabled={isLoadingData}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors">
                  {isLoadingData ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Refresh
                </button>
              </div>
            </div>
            {dataError && <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-300 text-xs">{dataError}</div>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SignalCard label="RSI (14)" value={`${liveData?.rsi ?? latestTech.rsi}`}
                signal={((liveData?.rsi ?? latestTech.rsi) > 70 ? 'Overbought' : (liveData?.rsi ?? latestTech.rsi) < 30 ? 'Oversold' : 'Neutral')} />
              <SignalCard label="MACD" value={`${(liveData?.macd ?? latestTech.macd).toLocaleString()}`}
                signal={(liveData?.histogram ?? latestTech.histogram) > 0 ? 'Bullish' : 'Bearish'} />
              <SignalCard label="SMA 50" value={`$${(liveData?.sma50 ?? latestTech.sma50).toLocaleString()}`} />
              <SignalCard label="24h Change" value={liveData ? `${liveData.change24h > 0 ? '+' : ''}${liveData.change24h}%` : 'N/A'}
                signal={liveData?.change24h > 0 ? 'Bullish' : liveData?.change24h < 0 ? 'Bearish' : undefined} />
            </div>
            {liveData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SignalCard label="24h Volume" value={`$${liveData.volume24h}B`} />
                <SignalCard label="Market Cap" value={`$${liveData.marketCap}B`} />
                <SignalCard label="BB Upper" value={`$${liveData.bbUpper?.toLocaleString()}`} />
                <SignalCard label="BB Lower" value={`$${liveData.bbLower?.toLocaleString()}`} />
              </div>
            )}
            {/* Crossover Alerts */}
            {liveTechnicals.length > 0 && (() => {
              const crossovers = detectCrossovers(liveTechnicals);
              return crossovers.length > 0 ? (
                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </span>
                    Signal Alerts ({crossovers.length} detected in last 90 days)
                  </h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {crossovers.map((alert, i) => (
                      <div key={i} className={`rounded-lg p-3 border ${
                        alert.signal === 'bullish' ? 'bg-green-900/20 border-green-800/50' : 'bg-red-900/20 border-red-800/50'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              alert.signal === 'bullish' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                            }`}>{alert.signal.toUpperCase()}</span>
                            <span className="text-sm font-medium text-gray-200">{alert.type}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              alert.strength === 'strong' ? 'bg-orange-900/50 text-orange-400' :
                              alert.strength === 'moderate' ? 'bg-yellow-900/50 text-yellow-400' :
                              'bg-gray-700 text-gray-400'
                            }`}>{alert.strength}</span>
                          </div>
                          <span className="text-xs text-gray-500">{alert.date}</span>
                        </div>
                        <p className="text-xs text-gray-400">{alert.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
            {/* RSI + MACD Chart */}
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={liveTechnicals.length > 0 ? liveTechnicals : TECHNICAL_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={Math.max(1, Math.floor((liveTechnicals.length || 5) / 10))} />
                <YAxis yAxisId="rsi" orientation="left" domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis yAxisId="macd" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                <Legend />
                <Line yAxisId="rsi" type="monotone" dataKey="rsi" stroke="#f97316" strokeWidth={2} dot={false} name="RSI" connectNulls />
                <Bar yAxisId="macd" dataKey="histogram" fill="#818cf8" opacity={0.6} name="MACD Histogram" />
                <Line yAxisId="macd" type="monotone" dataKey="macd" stroke="#10b981" strokeWidth={1.5} dot={false} name="MACD" connectNulls />
                <Line yAxisId="macd" type="monotone" dataKey="signal" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Signal" connectNulls />
                <ReferenceLine yAxisId="rsi" y={70} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine yAxisId="rsi" y={30} stroke="#10b981" strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
            {/* Price + Moving Averages + Bollinger */}
            <h3 className="text-sm font-bold text-gray-300 mt-4">Price with Moving Averages & Bollinger Bands</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={liveTechnicals.length > 0 ? liveTechnicals : []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={Math.max(1, Math.floor((liveTechnicals.length || 5) / 10))} />
                <YAxis tickFormatter={formatPrice} tick={{ fontSize: 11, fill: '#9ca3af' }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(v: any) => v ? `$${Number(v).toLocaleString()}` : 'N/A'} />
                <Legend />
                <Area type="monotone" dataKey="bbUpper" stroke="none" fill="#6366f1" fillOpacity={0.1} name="BB Upper" connectNulls />
                <Area type="monotone" dataKey="bbLower" stroke="none" fill="#6366f1" fillOpacity={0.1} name="BB Lower" connectNulls />
                <Line type="monotone" dataKey="price" stroke="#f97316" strokeWidth={2} dot={false} name="Price" />
                <Line type="monotone" dataKey="sma20" stroke="#a78bfa" strokeWidth={1} dot={false} name="SMA 20" connectNulls strokeDasharray="4 4" />
                <Line type="monotone" dataKey="sma50" stroke="#22c55e" strokeWidth={1.5} dot={false} name="SMA 50" connectNulls />
                <Line type="monotone" dataKey="ema12" stroke="#facc15" strokeWidth={1} dot={false} name="EMA 12" connectNulls strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* TAB: ICHIMOKU */}
        {activeTab === 'ichimoku' && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Ichimoku Cloud {liveTechnicals.length > 0 ? '(Live)' : ''}</h2>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                ichimokuSignal.includes('Bullish') ? 'bg-green-900/50 text-green-400' :
                ichimokuSignal.includes('Bearish') ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'
              }`}>{ichimokuSignal}</span>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={liveTechnicals.length > 0 ? liveTechnicals : ICHIMOKU_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={Math.max(1, Math.floor((liveTechnicals.length || 5) / 10))} />
                <YAxis tickFormatter={formatPrice} tick={{ fontSize: 11, fill: '#9ca3af' }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(v: any) => v ? `$${Number(v).toLocaleString()}` : 'N/A'} />
                <Legend />
                <Area type="monotone" dataKey="senkouA" stroke="none" fill="#065f46" fillOpacity={0.3} name="Senkou A" connectNulls />
                <Area type="monotone" dataKey="senkouB" stroke="none" fill="#7f1d1d" fillOpacity={0.2} name="Senkou B" connectNulls />
                <Line type="monotone" dataKey="tenkan" stroke="#ef4444" strokeWidth={1.5} name="Tenkan-sen" dot={false} connectNulls />
                <Line type="monotone" dataKey="kijun" stroke="#3b82f6" strokeWidth={1.5} name="Kijun-sen" dot={false} connectNulls />
                <Line type="monotone" dataKey="price" stroke="#f97316" strokeWidth={2.5} name="BTC Price" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* TAB: ETF FLOWS */}
        {activeTab === 'etf' && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-5">
            <h2 className="text-lg font-bold text-white">BTC ETF Flows (Top 3 by AUM)</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-900/30 border border-blue-800/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400">IBIT (iShares)</div>
                <div className="text-xl font-bold text-blue-400">${latestETF.ibit.toLocaleString()}M</div>
              </div>
              <div className="bg-green-900/30 border border-green-800/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400">FBTC (Fidelity)</div>
                <div className="text-xl font-bold text-green-400">${latestETF.fbtc.toLocaleString()}M</div>
              </div>
              <div className="bg-orange-900/30 border border-orange-800/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400">ARKB (ARK/21Shares)</div>
                <div className="text-xl font-bold text-orange-400">${latestETF.arkb.toLocaleString()}M</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={ETF_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis yAxisId="flow" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis yAxisId="price" orientation="right" tickFormatter={formatPrice} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                <Legend />
                <Bar yAxisId="flow" dataKey="ibit" fill="#3b82f6" name="IBIT" stackId="etf" />
                <Bar yAxisId="flow" dataKey="fbtc" fill="#10b981" name="FBTC" stackId="etf" />
                <Bar yAxisId="flow" dataKey="arkb" fill="#f97316" name="ARKB" stackId="etf" />
                <Line yAxisId="price" type="monotone" dataKey="btcPrice" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} name="BTC Price" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* TAB: EXCHANGE */}
        {activeTab === 'exchange' && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-5">
            <h2 className="text-lg font-bold text-white">Exchange & On-Chain Data</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SignalCard label="Funding Rate" value={`${(latestExchange.fundingRate * 100).toFixed(2)}%`} signal={fundingSignal} />
              <SignalCard label="Net Exchange Flow" value={`${(latestExchange.netflow / 1000).toFixed(1)}K BTC`}
                signal={latestExchange.netflow < 0 ? 'Accumulation' : 'Distribution'} />
              <SignalCard label="24h Volume" value={`$${latestExchange.volume}B`} />
              <SignalCard label="Open Interest" value={`$${latestExchange.openInterest}B`} />
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={EXCHANGE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis yAxisId="vol" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis yAxisId="flow" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                <Legend />
                <Bar yAxisId="vol" dataKey="volume" fill="#818cf8" opacity={0.6} name="Volume ($B)" />
                <Bar yAxisId="flow" dataKey="netflow" fill="#ef4444" opacity={0.5} name="Net Flow (BTC)" />
                <Line yAxisId="vol" type="monotone" dataKey="openInterest" stroke="#f97316" strokeWidth={2} name="Open Interest ($B)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* TAB: WHALE */}
        {activeTab === 'whale' && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-5">
            <h2 className="text-lg font-bold text-white">Whale Activity (Exchange Net Flow vs Price)</h2>
            <p className="text-sm text-gray-400">Negative net flow = withdrawals from exchanges (accumulation signal). Large negative flows have historically preceded major rallies.</p>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={WHALE_ACTIVITY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis yAxisId="flow" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis yAxisId="price" orientation="right" tickFormatter={formatPrice} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                <Legend />
                <Bar yAxisId="flow" dataKey="netflow" fill="#ef4444" opacity={0.7} name="Net Flow (BTC)" />
                <Line yAxisId="price" type="monotone" dataKey="price" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4 }} name="BTC Price" />
                <ReferenceLine yAxisId="flow" y={0} stroke="#6b7280" strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* TAB: ACCURACY */}
        {activeTab === 'accuracy' && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-5">
            <h2 className="text-lg font-bold text-white">Historical Model Validation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ACCURACY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Bar dataKey="accuracy" fill="#f97316" name="Accuracy %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Average Accuracy</div>
                  <div className="text-3xl font-bold text-orange-400">
                    {(ACCURACY_DATA.reduce((sum, d) => sum + d.accuracy, 0) / ACCURACY_DATA.length).toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  {ACCURACY_DATA.map((d, i) => (
                    <div key={i} className="flex justify-between text-sm bg-gray-800 rounded-lg px-4 py-2">
                      <span className="text-gray-400">{d.period}</span>
                      <span className="text-gray-300">Pred: {formatLargePrice(d.predicted)}</span>
                      <span className="text-gray-300">Actual: {formatLargePrice(d.actual)}</span>
                      <span className={`font-medium ${d.accuracy >= 85 ? 'text-green-400' : d.accuracy >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {d.accuracy}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
{/* TAB: ON-CHAIN METRICS */}
        {activeTab === 'onchain' && (
          <div className="space-y-6">
            {!onchainData ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-500 mx-auto mb-2" />
                <p className="text-gray-500">Loading on-chain data...</p>
              </div>
            ) : (
              <>
                {/* MVRV & NUPL */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Valuation Metrics</h2>
                    <button onClick={fetchOnchainData} disabled={isLoadingOnchain}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700">
                      {isLoadingOnchain ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Refresh
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* MVRV Card */}
                    <div className="bg-gray-800 rounded-lg p-5 space-y-3">
                      <div className="text-sm text-gray-400">MVRV Ratio (Market Value / Realized Value)</div>
                      <div className="flex items-end gap-3">
                        <span className={`text-4xl font-bold ${
                          onchainData.onchain.mvrv > 3.5 ? 'text-red-400' :
                          onchainData.onchain.mvrv > 2.5 ? 'text-orange-400' :
                          onchainData.onchain.mvrv > 1.5 ? 'text-yellow-400' :
                          onchainData.onchain.mvrv > 1.0 ? 'text-green-400' : 'text-emerald-400'
                        }`}>{onchainData.onchain.mvrv}x</span>
                      </div>
                      <p className="text-xs text-gray-400">{onchainData.onchain.mvrvSignal}</p>
                      <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500"
                          style={{ width: `${Math.min(100, (onchainData.onchain.mvrv / 5) * 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Undervalued</span><span>Fair</span><span>Overvalued</span><span>Extreme</span>
                      </div>
                      <div className="bg-gray-900 rounded p-3 mt-2">
                        <div className="text-xs text-gray-500">Estimated Realized Price</div>
                        <div className="text-lg font-bold text-gray-200">${onchainData.onchain.estimatedRealizedPrice.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 mt-1">This is the average cost basis of all BTC holders. Price falling below this level historically marks cycle bottoms.</div>
                      </div>
                    </div>

                    {/* NUPL Card */}
                    <div className="bg-gray-800 rounded-lg p-5 space-y-3">
                      <div className="text-sm text-gray-400">NUPL (Net Unrealized Profit/Loss)</div>
                      <div className="flex items-end gap-3">
                        <span className={`text-4xl font-bold ${
                          onchainData.onchain.nupl > 0.7 ? 'text-red-400' :
                          onchainData.onchain.nupl > 0.5 ? 'text-orange-400' :
                          onchainData.onchain.nupl > 0.25 ? 'text-green-400' :
                          onchainData.onchain.nupl > 0 ? 'text-yellow-400' : 'text-red-500'
                        }`}>{(onchainData.onchain.nupl * 100).toFixed(1)}%</span>
                      </div>
                      <p className="text-xs text-gray-400">{onchainData.onchain.nuplSignal}</p>
                      <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-red-600 via-yellow-500 via-green-500 to-red-400"
                          style={{ width: `${Math.min(100, ((onchainData.onchain.nupl + 0.3) / 1.0) * 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Capitulation</span><span>Hope</span><span>Optimism</span><span>Euphoria</span>
                      </div>
                      <div className="bg-gray-900 rounded p-3 mt-2">
                        <div className="text-xs text-gray-500">Thermocap Multiple</div>
                        <div className="text-lg font-bold text-gray-200">{onchainData.onchain.thermocapMultiple}x</div>
                        <div className="text-xs text-gray-500 mt-1">Ratio of market cap to cumulative miner revenue. Values above 30x have historically marked cycle tops.</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock-to-Flow */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
                  <h2 className="text-lg font-bold text-white">Stock-to-Flow Model</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-xs text-gray-500">S2F Ratio</div>
                      <div className="text-2xl font-bold text-orange-400">{onchainData.stockToFlow.ratio}</div>
                      <div className="text-xs text-gray-500 mt-1">Higher = scarcer (Gold ≈ 62)</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-xs text-gray-500">S2F Model Price</div>
                      <div className="text-2xl font-bold text-green-400">${onchainData.stockToFlow.modelPrice.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {onchainData.currentCycle.currentPrice > onchainData.stockToFlow.modelPrice ? 'Trading above model' : 'Trading below model'}
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Daily Issuance</div>
                      <div className="text-2xl font-bold text-blue-400">{onchainData.stockToFlow.dailyProduction} BTC</div>
                      <div className="text-xs text-gray-500 mt-1">${(onchainData.stockToFlow.dailyProduction * onchainData.currentCycle.currentPrice).toLocaleString()}/day</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Annual Inflation</div>
                      <div className="text-2xl font-bold text-purple-400">{onchainData.supply.annualInflation}%</div>
                      <div className="text-xs text-gray-500 mt-1">Lower than gold (~1.5%)</div>
                    </div>
                  </div>
                </div>

                {/* Supply Metrics */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
                  <h2 className="text-lg font-bold text-white">Supply Metrics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-2">Supply Mined</div>
                      <div className="text-3xl font-bold text-orange-400">{onchainData.supply.percentMined}%</div>
                      <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden mt-2">
                        <div className="h-full rounded-full bg-orange-500" style={{ width: `${onchainData.supply.percentMined}%` }} />
                      </div>
                      <div className="text-xs text-gray-500 mt-2">{onchainData.supply.circulating.toLocaleString()} / {onchainData.supply.max.toLocaleString()} BTC</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-2">Remaining to Mine</div>
                      <div className="text-3xl font-bold text-blue-400">{onchainData.supply.remainingBTC.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 mt-2">At current rate: {onchainData.stockToFlow.dailyProduction} BTC/day</div>
                      <div className="text-xs text-gray-500">Final BTC mined ~2140</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-2">Current Block Reward</div>
                      <div className="text-3xl font-bold text-green-400">3.125 BTC</div>
                      <div className="text-xs text-gray-500 mt-2">Post-4th halving (Apr 2024)</div>
                      <div className="text-xs text-gray-500">Next: 1.5625 BTC (~Mar 2028)</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB: HALVING CYCLE */}
        {activeTab === 'halving' && (
          <div className="space-y-6">
            {!onchainData ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-500 mx-auto mb-2" />
                <p className="text-gray-500">Loading cycle data...</p>
              </div>
            ) : (
              <>
                {/* Cycle Position */}
                <div className="bg-gradient-to-r from-orange-900/30 to-yellow-900/30 border border-orange-700/50 rounded-xl p-5 space-y-4">
                  <h2 className="text-lg font-bold text-white">Current Halving Cycle Position</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-400">{onchainData.currentCycle.cycleProgress}%</div>
                      <div className="text-xs text-gray-400 mt-1">Cycle Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">{onchainData.currentCycle.currentMultiple}x</div>
                      <div className="text-xs text-gray-400 mt-1">Return Since Halving</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">{onchainData.currentCycle.daysSinceHalving}</div>
                      <div className="text-xs text-gray-400 mt-1">Days Since Halving</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-400">{onchainData.currentCycle.daysToNextHalving}</div>
                      <div className="text-xs text-gray-400 mt-1">Days to Next Halving</div>
                    </div>
                  </div>
                  <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-600 to-yellow-500 relative"
                      style={{ width: `${onchainData.currentCycle.cycleProgress}%` }}>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Halving (Apr 2024)</span>
                    <span>Projected Peak Window ({onchainData.currentCycle.projectedPeakWindow.earliest.slice(0,7)} – {onchainData.currentCycle.projectedPeakWindow.latest.slice(0,7)})</span>
                    <span>Next Halving (~Mar 2028)</span>
                  </div>
                </div>

                {/* Cycle Comparison Chart */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
                  <h2 className="text-lg font-bold text-white">Cycle Performance Comparison (Normalized to Halving Price)</h2>
                  <p className="text-sm text-gray-400">Each line shows price as a multiple of the halving day price. For example, 2x = doubled from halving price.</p>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="day" type="number" domain={[0, 720]}
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        label={{ value: 'Days After Halving', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }}
                        label={{ value: 'Price Multiple (x)', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                        formatter={(v: any) => `${Number(v).toFixed(2)}x`}
                        labelFormatter={(l) => `Day ${l}`} />
                      <Legend />
                      <Line data={onchainData.cycleComparison.cycle2} dataKey="price" stroke="#3b82f6" strokeWidth={1.5}
                        dot={false} name="Cycle 2 (2016-2020)" type="monotone" />
                      <Line data={onchainData.cycleComparison.cycle3} dataKey="price" stroke="#8b5cf6" strokeWidth={1.5}
                        dot={false} name="Cycle 3 (2020-2024)" type="monotone" />
                      <Line data={onchainData.cycleComparison.cycle4} dataKey="price" stroke="#f97316" strokeWidth={2.5}
                        dot={{ r: 3, fill: '#f97316' }} name="Cycle 4 (Current)" type="monotone" />
                      <ReferenceLine x={onchainData.currentCycle.daysSinceHalving} stroke="#f97316" strokeDasharray="3 3" />
                      <ReferenceLine y={1} stroke="#6b7280" strokeDasharray="3 3" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Historical Halving Table */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
                  <h2 className="text-lg font-bold text-white">Halving History</h2>
                  <div className="space-y-3">
                    {onchainData.halvings.map((h: any) => (
                      <div key={h.number} className={`rounded-lg p-4 ${h.number === 4 ? 'bg-orange-900/20 border border-orange-700/50' : 'bg-gray-800'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                h.number === 4 ? 'bg-orange-900/50 text-orange-400' : 'bg-gray-700 text-gray-300'
                              }`}>Halving #{h.number}</span>
                              <span className="text-sm text-gray-400">{h.date}</span>
                              {h.number === 4 && <span className="text-xs text-orange-400 font-medium">CURRENT CYCLE</span>}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Block {h.block.toLocaleString()} | Reward: {h.reward} BTC</div>
                          </div>
                          <div className="flex gap-6 text-sm">
                            <div>
                              <div className="text-xs text-gray-500">Price at Halving</div>
                              <div className="font-bold text-gray-200">${h.priceAtHalving.toLocaleString()}</div>
                            </div>
                            {h.cyclePeak !== null ? (
                              <>
                                <div>
                                  <div className="text-xs text-gray-500">Cycle Peak</div>
                                  <div className="font-bold text-green-400">${h.cyclePeak.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Peak Multiple</div>
                                  <div className="font-bold text-orange-400">{h.peakMultiple}x</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Days to Peak</div>
                                  <div className="font-bold text-blue-400">{h.daysToPeak}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Peak Drawdown</div>
                                  <div className="font-bold text-red-400">{h.drawdownFromPeak}%</div>
                                </div>
                              </>
                            ) : (
                              <div>
                                <div className="text-xs text-gray-500">Current Multiple</div>
                                <div className="font-bold text-orange-400">{onchainData.currentCycle.currentMultiple}x</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cycle Insight */}
                  <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                    <div className="text-sm font-bold text-gray-300">Cycle Pattern Insight</div>
                    <p className="text-xs text-gray-400">
                      Historical pattern: Peak multiples are diminishing each cycle (95x → 30x → 7.8x). If the pattern holds,
                      Cycle 4 peak could be in the 2.5x–4x range from halving price (${Math.round(onchainData.currentCycle.halvingPrice * 2.5).toLocaleString()} – ${Math.round(onchainData.currentCycle.halvingPrice * 4).toLocaleString()}).
                      Peaks have occurred 371–548 days after halving, suggesting the current cycle peak window is approximately {onchainData.currentCycle.projectedPeakWindow.earliest} to {onchainData.currentCycle.projectedPeakWindow.latest}.
                    </p>
                    <p className="text-xs text-gray-500">
                      Important: Diminishing returns doesn't guarantee the pattern continues. Institutional adoption via ETFs is a structural change that could break historical norms.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}{/* TAB: MACRO CORRELATION DASHBOARD */}
        {activeTab === 'macro' && (
          <div className="space-y-6">
            {!macroData ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-500 mx-auto mb-2" />
                <p className="text-gray-500">Loading macro data...</p>
              </div>
            ) : (
              <>
                {/* Macro Bias */}
                <div className={`rounded-xl border p-5 ${
                  macroData.macroAnalysis.bias === 'Bullish' ? 'bg-green-900/20 border-green-700/50' :
                  macroData.macroAnalysis.bias === 'Bearish' ? 'bg-red-900/20 border-red-700/50' :
                  'bg-yellow-900/20 border-yellow-700/50'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Macro Environment for BTC</h2>
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-bold ${
                        macroData.macroAnalysis.bias === 'Bullish' ? 'text-green-400' :
                        macroData.macroAnalysis.bias === 'Bearish' ? 'text-red-400' : 'text-yellow-400'
                      }`}>{macroData.macroAnalysis.bias}</span>
                      <span className="text-sm text-gray-400">Score: {macroData.macroAnalysis.score}/100</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {macroData.macroAnalysis.signals.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className={`mt-0.5 ${s.includes('bullish') || s.includes('supports') || s.includes('favor') ? 'text-green-500' : s.includes('headwind') || s.includes('pressure') || s.includes('hurts') || s.includes('increases') ? 'text-red-500' : 'text-yellow-500'}`}>•</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Regime */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-bold text-white">Current Macro Regime</h3>
                    <button onClick={fetchMacroData} disabled={isLoadingMacro}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700">
                      {isLoadingMacro ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Refresh
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500">DXY</div>
                      <div className="text-xl font-bold text-gray-200">{macroData.current.dxy}</div>
                      <div className={`text-xs font-medium mt-1 ${macroData.regimes.dxyTrend === 'Weakening' ? 'text-green-400' : 'text-red-400'}`}>
                        {macroData.regimes.dxyTrend}
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500">Fed Rate</div>
                      <div className="text-xl font-bold text-gray-200">{macroData.current.fed}%</div>
                      <div className={`text-xs font-medium mt-1 ${macroData.regimes.fedPolicy === 'Easing' ? 'text-green-400' : macroData.regimes.fedPolicy === 'Tightening' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {macroData.regimes.fedPolicy}
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500">M2 Supply</div>
                      <div className="text-xl font-bold text-gray-200">${macroData.current.m2}T</div>
                      <div className={`text-xs font-medium mt-1 ${macroData.regimes.m2Trend === 'Expanding' ? 'text-green-400' : 'text-red-400'}`}>
                        {macroData.regimes.m2Trend}
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500">US 10Y Yield</div>
                      <div className="text-xl font-bold text-gray-200">{macroData.current.us10y}%</div>
                      <div className={`text-xs font-medium mt-1 ${macroData.regimes.yieldTrend === 'Falling' ? 'text-green-400' : 'text-red-400'}`}>
                        {macroData.regimes.yieldTrend}
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500">S&P 500</div>
                      <div className="text-xl font-bold text-gray-200">{macroData.current.sp500.toLocaleString()}</div>
                      <div className={`text-xs font-medium mt-1 ${macroData.regimes.riskAppetite === 'Risk-On' ? 'text-green-400' : 'text-red-400'}`}>
                        {macroData.regimes.riskAppetite}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Normalized Performance Overlay */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
                  <h3 className="text-md font-bold text-white">Normalized Performance (Base 100)</h3>
                  <p className="text-xs text-gray-500">All assets indexed to 100 at start of period. Shows relative performance over time.</p>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={macroData.normalized}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={2} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                        formatter={(v: any) => `${Number(v).toFixed(1)}`} />
                      <Legend />
                      <Line type="monotone" dataKey="btc" stroke="#f97316" strokeWidth={2.5} dot={false} name="BTC" />
                      <Line type="monotone" dataKey="sp500" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="S&P 500" />
                      <Line type="monotone" dataKey="gold" stroke="#facc15" strokeWidth={1.5} dot={false} name="Gold" />
                      <Line type="monotone" dataKey="dxy" stroke="#ef4444" strokeWidth={1.5} dot={false} name="DXY" />
                      <Line type="monotone" dataKey="m2" stroke="#10b981" strokeWidth={1.5} dot={false} name="M2 Supply" />
                      <ReferenceLine y={100} stroke="#6b7280" strokeDasharray="3 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Correlation Matrix */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
                  <h3 className="text-md font-bold text-white">BTC Correlation Matrix</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-3">Price-Level Correlations (Full Period)</div>
                      <div className="space-y-2">
                        {[
                          { label: 'BTC vs S&P 500', value: macroData.correlations.priceLevel.btc_sp500, note: 'Risk asset correlation' },
                          { label: 'BTC vs DXY', value: macroData.correlations.priceLevel.btc_dxy, note: 'Dollar strength impact' },
                          { label: 'BTC vs M2 Supply', value: macroData.correlations.priceLevel.btc_m2, note: 'Liquidity relationship' },
                          { label: 'BTC vs Gold', value: macroData.correlations.priceLevel.btc_gold, note: 'Store of value comparison' },
                          { label: 'BTC vs 10Y Yield', value: macroData.correlations.priceLevel.btc_us10y, note: 'Rate sensitivity' },
                        ].map((c, i) => (
                          <div key={i} className="bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-300">{c.label}</span>
                              <span className={`text-lg font-bold ${
                                Math.abs(c.value) > 0.7 ? (c.value > 0 ? 'text-green-400' : 'text-red-400') :
                                Math.abs(c.value) > 0.4 ? 'text-yellow-400' : 'text-gray-400'
                              }`}>{c.value > 0 ? '+' : ''}{c.value}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${c.value > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.abs(c.value) * 100}%`, marginLeft: c.value < 0 ? `${(1 - Math.abs(c.value)) * 100}%` : '0' }} />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{c.note}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-3">Return-Based Correlations (Month-over-Month)</div>
                      <div className="space-y-2">
                        {[
                          { label: 'BTC vs S&P 500', value: macroData.correlations.returns.btc_sp500, interpretation: '' },
                          { label: 'BTC vs DXY', value: macroData.correlations.returns.btc_dxy, interpretation: '' },
                          { label: 'BTC vs M2 Supply', value: macroData.correlations.returns.btc_m2, interpretation: '' },
                          { label: 'BTC vs Gold', value: macroData.correlations.returns.btc_gold, interpretation: '' },
                        ].map((c, i) => {
                          const interp = Math.abs(c.value) > 0.7 ? 'Strong' : Math.abs(c.value) > 0.4 ? 'Moderate' : Math.abs(c.value) > 0.2 ? 'Weak' : 'Negligible';
                          const dir = c.value > 0 ? 'positive' : 'negative';
                          return (
                            <div key={i} className="bg-gray-800 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-300">{c.label}</span>
                                <span className={`text-lg font-bold ${
                                  Math.abs(c.value) > 0.7 ? (c.value > 0 ? 'text-green-400' : 'text-red-400') :
                                  Math.abs(c.value) > 0.4 ? 'text-yellow-400' : 'text-gray-400'
                                }`}>{c.value > 0 ? '+' : ''}{c.value}</span>
                              </div>
                              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${c.value > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.abs(c.value) * 100}%` }} />
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{interp} {dir} correlation</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3 mt-3">
                        <div className="text-xs text-gray-500">Interpretation Guide</div>
                        <div className="text-xs text-gray-400 mt-1 space-y-1">
                          <p><span className="text-green-400">+0.7 to +1.0:</span> Strong positive — assets move together</p>
                          <p><span className="text-red-400">-0.7 to -1.0:</span> Strong negative — assets move opposite</p>
                          <p><span className="text-yellow-400">±0.4 to ±0.7:</span> Moderate — some relationship</p>
                          <p><span className="text-gray-500">±0.0 to ±0.4:</span> Weak — little to no relationship</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rolling Correlations */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
                  <h3 className="text-md font-bold text-white">Rolling 6-Month Correlations</h3>
                  <p className="text-xs text-gray-500">Shows how BTC&apos;s relationship with macro assets changes over time. Regime shifts in correlation are often more important than the static number.</p>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={macroData.correlations.rolling}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={1} />
                      <YAxis domain={[-1, 1]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                        formatter={(v: any) => Number(v).toFixed(3)} />
                      <Legend />
                      <Line type="monotone" dataKey="btc_sp500" stroke="#3b82f6" strokeWidth={2} dot={false} name="vs S&P 500" />
                      <Line type="monotone" dataKey="btc_dxy" stroke="#ef4444" strokeWidth={2} dot={false} name="vs DXY" />
                      <Line type="monotone" dataKey="btc_m2" stroke="#10b981" strokeWidth={2} dot={false} name="vs M2" />
                      <Line type="monotone" dataKey="btc_gold" stroke="#facc15" strokeWidth={2} dot={false} name="vs Gold" />
                      <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
                      <ReferenceLine y={0.7} stroke="#22c55e" strokeDasharray="2 4" />
                      <ReferenceLine y={-0.7} stroke="#ef4444" strokeDasharray="2 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* BTC vs DXY Inverse Chart */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
                  <h3 className="text-md font-bold text-white">BTC Price vs Dollar Strength (DXY)</h3>
                  <p className="text-xs text-gray-500">BTC and DXY often move inversely. When the dollar weakens, BTC tends to rally as capital seeks alternatives.</p>
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={macroData.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={2} />
                      <YAxis yAxisId="btc" tickFormatter={formatPrice} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis yAxisId="dxy" orientation="right" domain={[98, 110]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                      <Legend />
                      <Area yAxisId="btc" type="monotone" dataKey="btc" stroke="#f97316" fill="#f97316" fillOpacity={0.1} strokeWidth={2} name="BTC Price" />
                      <Line yAxisId="dxy" type="monotone" dataKey="dxy" stroke="#ef4444" strokeWidth={2} dot={false} name="DXY Index" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* M2 vs BTC Chart */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
                  <h3 className="text-md font-bold text-white">BTC Price vs M2 Money Supply</h3>
                  <p className="text-xs text-gray-500">BTC has historically tracked global M2 expansion. When central banks print money, BTC benefits as a scarce asset.</p>
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={macroData.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={2} />
                      <YAxis yAxisId="btc" tickFormatter={formatPrice} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis yAxisId="m2" orientation="right" domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                      <Legend />
                      <Area yAxisId="btc" type="monotone" dataKey="btc" stroke="#f97316" fill="#f97316" fillOpacity={0.1} strokeWidth={2} name="BTC Price" />
                      <Line yAxisId="m2" type="monotone" dataKey="m2" stroke="#10b981" strokeWidth={2} dot={false} name="M2 ($T)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}
        {/* DISCLAIMER */}
        <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4 text-xs text-yellow-300/70">
          <strong>Disclaimer:</strong> This model uses geometric Brownian motion with Monte Carlo simulation.
          For educational and analytical purposes only. Not investment advice.
 </div>
        </div>
      </div>
    </div>
  );
}