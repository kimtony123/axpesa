import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, UserPlus } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { connectMetaMask, isMetaMaskInstalled } from '../../lib/wallet';
import useWalletStore from '../../lib/walletStore';
import { fetchApi } from '../../lib/api';
import './LoginPage.css';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { address, isConnected, setWallet } = useWalletStore();
  const navigate = useNavigate();
  const hasMetamask = isMetaMaskInstalled();

  useEffect(() => {
    const token = localStorage.getItem('axpesa_token');
    if (isConnected && address && token) {
      navigate('/dashboard');
    }
  }, [isConnected, address, navigate]);

  const handleConnectMetaMask = async () => {
    setError('');
    setIsConnecting(true);

    try {
      const result = await connectMetaMask('login');
      if (result) {
        setWallet(result.address);
        
        try {
          const data = await fetchApi('/api/auth/verify-wallet', {
            method: 'POST',
            body: JSON.stringify({ 
              address: result.address, 
              signature: result.signature 
            }),
          });
          
          if (data.success && data.data?.token) {
            localStorage.setItem('axpesa_token', data.data.token);
            localStorage.setItem('axpesa_auth_type', 'wallet');
            if (data.data.user) {
              localStorage.setItem('axpesa_user', JSON.stringify(data.data.user));
            }
            navigate('/dashboard');
          } else {
            if (data.error?.code === 'USER_NOT_REGISTERED') {
              setError('You are not registered. Please sign up first.');
              setTimeout(() => navigate('/register'), 2000);
            } else {
              setError(data.error?.message || 'Verification failed');
            }
          }
        } catch (err: any) {
          console.error('Backend verification failed:', err);
          setError(err?.message || 'Backend verification failed');
        }
      } else {
        setError('Failed to connect wallet');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="page-layout">
      <Navbar />
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-icon">
            <Wallet size={40} />
          </div>
          <h1>Welcome to AxPesa</h1>
          <p>Buy, sell and transfer CNY through Conflux eSpace</p>

          {error && <div className="error-message">{error}</div>}

          <div className="auth-buttons">
            <button 
              className="btn-primary connect-btn" 
              onClick={handleConnectMetaMask}
              disabled={isConnecting || !hasMetamask}
            >
              {isConnecting ? (
                <>
                  <span className="spinner"></span>
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet size={18} />
                  Login with Wallet
                </>
              )}
            </button>

            <Link to="/register" className="btn-secondary">
              <UserPlus size={18} />
              Sign Up
            </Link>
          </div>

          {!hasMetamask && (
            <p className="help-text">
              MetaMask not installed.{' '}
              <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
                Install MetaMask
              </a>
            </p>
          )}

          <div className="auth-footer">
            <p>By connecting, you agree to our Terms of Service</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}