'use client';

import { useEffect } from 'react';
import { useWalletStore, setHasCheckedConnection } from '@/lib/walletStore';

export default function WalletAutoConnect(props: { children: React.ReactNode }) {
  const hasCheckedConnection = useWalletStore((state) => state.hasCheckedConnection);

  useEffect(() => {
    if (!hasCheckedConnection && typeof window !== 'undefined' && window.ethereum) {
      setHasCheckedConnection(true);
    }
  }, [hasCheckedConnection]);

  return props.children;
}
