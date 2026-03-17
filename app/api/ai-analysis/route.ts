import { NextResponse } from 'next/server';

export async function POST() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured. Add it to .env.local' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [
          {
            role: 'user',
            content: `You are a Bitcoin market analyst. Search for the current Bitcoin price and the latest BTC news from the last 48 hours. Analyze:
1. Current BTC price
2. Major news events affecting price
3. ETF flow trends (IBIT, FBTC, ARKB)
4. Market sentiment and fear/greed indicators
5. Any whale activity or large transactions
6. Macro factors (Fed policy, DXY, equities correlation)
7. On-chain signals if available

Then respond ONLY with a JSON object (no markdown fences, no preamble, no explanation) with these exact fields:
{
  "currentPrice": <number, current BTC price in USD>,
  "sentimentScore": <number 1-10, 1=extreme fear, 10=extreme greed>,
  "recommendedTrend": <number, suggested annual trend percentage>,
  "recommendedVolatility": <number, suggested annualized volatility percentage>,
  "confidence": "<high|medium|low>",
  "headline": "<one-line market summary, max 15 words>",
  "findings": ["<finding 1>", "<finding 2>", "<finding 3>", "<finding 4>", "<finding 5>"],
  "technicalOutlook": "<1-2 sentence technical analysis>",
  "riskFactors": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "keyLevels": {
    "support": <number, key support price>,
    "resistance": <number, key resistance price>
  }
}`
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: `Anthropic API error: ${errorData.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract text blocks from response
    const textBlocks = data.content
      ?.filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('') || '';

    const cleaned = textBlocks.replace(/```json|```/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: cleaned },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: `Analysis failed: ${error.message}` },
      { status: 500 }
    );
  }
}