import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true',
      {
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch BTC price');
    }

    const data = await response.json();

    return NextResponse.json({
      price: Math.round(data.bitcoin.usd),
      change24h: data.bitcoin.usd_24h_change?.toFixed(2),
      volume24h: data.bitcoin.usd_24h_vol,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    
    return NextResponse.json({
      price: 70000,
      change24h: '0.00',
      volume24h: 0,
      timestamp: new Date().toISOString(),
      error: 'Using fallback price',
    });
  }
}
```

**Save (Ctrl + S)**

---

## 🎉 ALL FILES CREATED!

You now have all 14 files! Your structure should look like:
```
BTC-PREDICTION-MODEL
├── app/
│   ├── api/
│   │   └── btc-price/
│   │       └── route.ts ✅
│   ├── globals.css ✅
│   ├── layout.tsx ✅
│   └── page.tsx ✅
├── .gitignore ✅
├── next.config.js ✅
├── package.json ✅
├── postcss.config.js ✅
├── tailwind.config.js ✅
├── tsconfig.json ✅
└── vercel.json ✅