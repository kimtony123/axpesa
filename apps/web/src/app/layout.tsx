import type { Metadata } from 'next';
import '@/styles/globals.css';
import WalletScripts from '@/components/WalletScripts';
import WalletAutoConnect from '@/hooks/useWalletConnection';

export const metadata: Metadata = {
  title: 'AxPesa - Buy & Sell AxCNH on Conflux',
  description: 'Seamless fiat-to-stablecoin onboarding for Conflux Network. Buy and sell AxCNH using M-PESA, cards, and bank transfers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js" async />
      </head>
      <body className="min-h-screen bg-gray-50">
        <WalletScripts />
        <WalletAutoConnect>
          {children}
        </WalletAutoConnect>
      </body>
    </html>
  );
}
