import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { fetchApi } from '../../lib/api';
import './PaymentStatusPage.css';

export default function PaymentStatusPage() {
  const { transactionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  const flutterwaveStatus = searchParams.get('status');
  const flutterwaveTransactionId = searchParams.get('transaction_id');
  const txRef = searchParams.get('tx_ref');

  const checkWithBackend = useCallback(async (txId: string, fwTxId: string | null, ref: string | null) => {
    try {
      let url = `/api/onramp/verify/${txId}`;
      if (fwTxId) {
        url += `?flutterwave_tx_id=${fwTxId}&tx_ref=${ref || ''}`;
      }
      const data = await fetchApi(url);
      
      if (data.success && data.data?.status === 'completed') {
        setStatus('success');
      } else if (data.data?.status === 'failed') {
        setStatus('failed');
        setError(data.data?.error || 'Payment failed');
      } else if (data.success) {
        setStatus('success');
      } else {
        setStatus('pending');
      }
    } catch (err) {
      console.error('Backend check error:', err);
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

    if (flutterwaveStatus === 'successful') {
      setStatus('success');
      checkWithBackend(transactionId, flutterwaveTransactionId, txRef);
      return;
    }

    if (flutterwaveStatus === 'failed') {
      setStatus('failed');
      setError('Payment was not completed');
      return;
    }

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
          <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            Go to Dashboard <ArrowRight size={18} />
          </Link>
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
        <Link to="/buy" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Try Again</Link>
      </div>
    </div>
  );
}