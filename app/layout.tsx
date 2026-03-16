import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bitcoin Price Prediction Model | : 508 Capital LLC",
  description: "Interactive BTC price prediction with AI-powered market intelligence, technical indicators, ETF flows, and Monte Carlo simulation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}