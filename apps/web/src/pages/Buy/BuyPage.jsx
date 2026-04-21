import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import useWalletStore from '../../lib/walletStore';
import './BuyPage.css';

function getAuthHeaders() {
  const token = localStorage.getItem('axpesa_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export default function BuyPage() {
  const { address, isConnected } = useWalletStore();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rates, setRates] = useState({ KES: 18.87 });
  const rate = rates.KES || 18.87;

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/onramp/rates`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.rates) {
          setRates(d.data.rates);
        }
      })
      .catch(() => {});
  }, []);

  const axcnhAmount = amount ? (parseFloat(amount) / rate).toFixed(2) : '0';
  const fee = amount ? (parseFloat(amount) * 0.02).toFixed(2) : '0';
  const total = amount ? (parseFloat(amount) + parseFloat(fee)).toFixed(2) : '0';
  const isValid = amount && phone && isConnected;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/onramp/initiate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          fiatAmount: parseFloat(amount),
          fiatCurrency: currency,
          paymentMethod,
          walletAddress: address,
          phoneNumber: phone,
          email: email || undefined,
          tokenSymbol: 'AxCNH',
        }),
      });
      const data = await res.json();
      
      if (data.success && data.data?.paymentLink) {
        window.location.href = data.data.paymentLink;
      } else if (data.success && data.data?.link) {
        window.location.href = data.data.link;
      } else {
        setError(data.error?.message || 'Failed to initiate payment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="page-layout">
        <Navbar />
        <div className="auth-page">
          <div className="auth-card">
            <h1>Connect Wallet First</h1>
            <p>Please connect your wallet to buy AxCNH</p>
            <Link to="/login" className="btn-primary">Connect Wallet</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-layout">
      <Navbar />
      <main className="page-container">
        <h1 className="page-title">Buy AxCNH</h1>
        
        <div className="form-card">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Amount ({currency})</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="Enter amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
              {amount && (
                <p className="form-hint">
                  ≈ {axcnhAmount} AxCNH (rate: 1 AxCNH = {rate} {currency})
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select 
                className="form-input"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              >
                <option value="mpesa">M-PESA</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="+254700000000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email (optional)</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {amount && (
              <div className="form-summary">
                <div className="summary-row">
                  <span>You get</span>
                  <span>{axcnhAmount} AxCNH</span>
                </div>
                <div className="summary-row">
                  <span>Fee (2%)</span>
                  <span>{fee} {currency}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>{total} {currency}</span>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading || !isValid}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                `Continue with ${paymentMethod === 'mpesa' ? 'M-PESA' : paymentMethod}`
              )}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}