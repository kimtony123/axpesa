import { Toaster as HotToaster } from 'react-hot-toast';

export default function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
        },
        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: 'white',
          },
        },
      }}
    />
  );
}