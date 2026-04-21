import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import './PaymentStatusPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function PaymentStatusPage() {
  const { transactionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  const flutterwaveStatus = searchParams.get('status');
  const flutterwaveTransactionId = searchParams.get('transaction_id');
  const txRef = searchParams.get('tx_ref');

  const checkWithBackend = useCallback(async (txId, fwTxId, ref) => {
    try {
      const url = `${API_URL}/api/onramp/verify/${txId}${fwTxId ? `?flutterwave_tx_id=${fwTxId}&tx_ref=${ref || ''}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success && data.data?.status === 'completed') {
        setStatus('success');
      } else if (data.data?.status === 'failed') {
        setStatus('failed');
        setError(data.data?.error || 'Payment failed');
      } else if (data.success) {
        // If API says success but status not completed, might be async - check status
        setStatus('success');
      } else {
        setStatus('pending');
      }
    } catch (err) {
      console.error('Backend check error:', err);
      // If backend fails, trust Flutterwave status
      if (flutterwaveStatus === 'successful') {
        setStatus('success');
      } else if (flutterwaveStatus === 'failed') {
        setStatus('failed');
      } else {
        setStatus('error');
        setError('Failed to verify payment');
      }
    }
  }, [flutterwaveStatus]);

  useEffect(() => {
    if (!transactionId) {
      navigate('/dashboard');
      return;
    }

    // If Flutterwave already says successful, set status immediately
    if (flutterwaveStatus === 'successful') {
      setStatus('success');
      // Still verify with backend in background for vault execution
      checkWithBackend(transactionId, flutterwaveTransactionId, txRef);
      return;
    }

    // If Flutterwave says failed
    if (flutterwaveStatus === 'failed') {
      setStatus('failed');
      setError('Payment was not completed');
      return;
    }

    // Otherwise check with backend
    checkWithBackend(transactionId, flutterwaveTransactionId, txRef);
  }, [transactionId, flutterwaveStatus, flutterwaveTransactionId, txRef, navigate, checkWithBackend]);

  if (status === 'processing') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="spinner-lg"></div>
          <h2>Processing Payment...</h2>
          <p>Verifying your payment with Flutterwave</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="success-icon"><Check size={32} /></div>
          <h2 style={{ color: '#22c55e' }}>Payment Successful!</h2>
          <p>Your AxCNH has been sent to your wallet</p>
          <Link to="/dashboard" className="btn-primary" style={{ marginTop: '1.5rem' }}>Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="error-icon">✕</div>
        <h2 style={{ color: '#ef4444' }}>Payment Failed</h2>
        <p>{error || 'Something went wrong'}</p>
        <Link to="/buy" className="btn-primary" style={{ marginTop: '1.5rem' }}>Try Again</Link>
      </div>
    </div>
  );
}