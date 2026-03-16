import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bitcoin Price Prediction Model | AMP InvestCo",
  description: "Comprehensive Bitcoin price prediction and analysis tool with multi-scenario projections, whale tracking, and AI-powered market intelligence.",
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