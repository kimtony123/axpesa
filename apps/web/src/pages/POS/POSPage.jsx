import { useState, useEffect } from 'react';
import { QrCode, Loader2, Copy, X } from 'lucide-react';
import './POSPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function POSPage() {
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [qrUrl, setQrUrl] = useState(null);
  const [creating, setCreating] = useState(false);
  const [merchant, setMerchant] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('axpesa_merchant');
    if (stored) {
      try {
        setMerchant(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  const createQR = async () => {
    if (!amount && !description) {
      alert('Please enter an amount or description');
      return;
    }
    setCreating(true);
    try {
      const token = localStorage.getItem('axpesa_token');
      const res = await fetch(`${API_URL}/api/merchant/payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amount ? Number(amount) : undefined,
          description: description || 'POS Payment',
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        setQrUrl(data.data.url);
      }
    } catch (err) {
      alert('Failed to create payment link');
    }
    setCreating(false);
  };

  const closeQR = () => {
    setQrUrl(null);
    setAmount('');
    setDescription('');
  };

  if (loading) {
    return (
      <div className="pos-page">
        <div className="loading"><Loader2 className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="pos-page">
      <header className="pos-header">
        <div className="pos-brand">
          <div className="pos-logo">A</div>
          <span>AxPesa POS</span>
        </div>
        {merchant && <span className="merchant-name">{merchant.businessName}</span>}
      </header>

      <main className="pos-main">
        {!qrUrl ? (
          <>
            <div className="pos-form">
              <h1>Create Payment</h1>
              <div className="form-group">
                <label>Amount (KES)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="input"
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Lunch, Drinks"
                  className="input"
                />
              </div>
              <button onClick={createQR} disabled={creating || (!amount && !description)} className="btn btn-primary w-full">
                {creating ? <><Loader2 className="spinner" /> Creating...</> : 'Generate QR Code'}
              </button>
            </div>
            <div className="pos-tips">
              <p>Tips:</p>
              <ul>
                <li>Enter the amount customer needs to pay</li>
                <li>Customer scans QR code to pay</li>
                <li>Payment is automatic via Flutterwave</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="qr-display">
            <button className="close-btn" onClick={closeQR}><X size={24} /></button>
            <div className="qr-card">
              <h2>Scan to Pay</h2>
              <p className="qr-amount">{amount} KES</p>
              {description && <p className="qr-desc">{description}</p>}
              <div className="qr-placeholder">
                <QrCode size={200} />
              </div>
              <p className="qr-url">{qrUrl}</p>
              <button onClick={() => navigator.clipboard.writeText(qrUrl)} className="btn btn-secondary">
                <Copy size={18} /> Copy Link
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}