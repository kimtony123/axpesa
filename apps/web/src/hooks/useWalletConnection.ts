'use client';

import { useEffect } from 'react';
import { useWalletStore } from '@/lib/walletStore';

export default function WalletAutoConnect(props: { children: React.ReactNode }) {
  const hasCheckedConnection = useWalletStore((state) => state.hasCheckedConnection);
  const checkConnection = useWalletStore((state) => state.checkConnection);

  useEffect(() => {
    if (!hasCheckedConnection && typeof window !== 'undefined' && window.ethereum) {
      checkConnection();
    }
  }, [hasCheckedConnection, checkConnection]);

  return props.children;
}
