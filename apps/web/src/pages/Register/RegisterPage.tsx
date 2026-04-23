import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import useWalletStore from '../../lib/walletStore';
import { connectMetaMask, isMetaMaskInstalled } from '../../lib/wallet';
import { fetchApi } from '../../lib/api';
import './RegisterPage.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { address, isConnected, setWallet } = useWalletStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const hasMetamask = isMetaMaskInstalled();

  useEffect(() => {
    const token = localStorage.getItem('axpesa_token');
    if (isConnected && address && token) {
      navigate('/dashboard');
    }
  }, [isConnected, address, navigate]);

  const handleConnectAndRegister = async () => {
    if (!name || !phone) {
      setError('Please enter your name and phone number');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await connectMetaMask();
      if (!result) {
        setError('Failed to connect wallet');
        setLoading(false);
        return;
      }

      setWallet(result.address);

      const data = await fetchApi('/api/auth/user-register', {
        method: 'POST',
        body: JSON.stringify({
          walletaddress: result.address,
          name,
          phonenumber: phone,
          signature: result.signature,
        }),
      });

      if (data.success) {
        localStorage.setItem('axpesa_token', data.data.token);
        localStorage.setItem('axpesa_user', JSON.stringify(data.data.user));
        navigate('/dashboard');
      } else {
        setError(data.error?.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-layout">
      <Navbar />
      <main className="auth-page">
        <div className="auth-card">
          <h1>Create Account</h1>
          <p className="info-text">
            Register to buy, sell, and transfer CNY through AxPesa
          </p>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="+254700000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleConnectAndRegister}
            disabled={loading || !hasMetamask || !name || !phone}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Registering...
              </>
            ) : (
              <>
                <Wallet size={18} />
                Connect Wallet & Register
              </>
            )}
          </button>

          {!hasMetamask && (
            <p className="help-text">
              MetaMask not installed.{' '}
              <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
                Install MetaMask
              </a>
            </p>
          )}

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}