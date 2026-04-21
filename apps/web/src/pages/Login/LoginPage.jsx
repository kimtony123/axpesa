import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { connectMetaMask, isMetaMaskInstalled } from '../../lib/wallet';
import useWalletStore from '../../lib/walletStore';
import './LoginPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { address, isConnected, setWallet } = useWalletStore();
  const navigate = useNavigate();
  const hasMetamask = isMetaMaskInstalled();

  const handleConnectMetaMask = async () => {
    setError('');
    setIsConnecting(true);

    try {
      const result = await connectMetaMask();
      if (result) {
        setWallet(result.address);
        
        try {
          const res = await fetch(`${API_URL}/api/auth/verify-wallet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              address: result.address, 
              signature: result.signature 
            }),
          });
          
          const data = await res.json();
          
          if (data.success && data.data?.token) {
            localStorage.setItem('axpesa_token', data.data.token);
            localStorage.setItem('axpesa_auth_type', 'wallet');
            if (data.data.user) {
              localStorage.setItem('axpesa_user', JSON.stringify(data.data.user));
            }
            navigate('/dashboard');
          } else {
            // Check if user is not registered
            if (data.error?.code === 'USER_NOT_REGISTERED') {
              setError('Please register first to use AxPesa');
              setTimeout(() => navigate('/register'), 2000);
            } else {
              setError(data.error?.message || 'Verification failed');
            }
          }
        } catch (err) {
          console.error('Backend verification failed:', err);
          setError('Backend verification failed');
        }
      } else {
        setError('Failed to connect wallet');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnected || address) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-icon">
            <Wallet size={40} />
          </div>
          <h1>Already Connected</h1>
          <p>Your wallet is connected</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">
          <Wallet size={40} />
        </div>
        <h1>Connect Wallet</h1>
        <p>Sign in to your AxPesa account</p>

        {error && <div className="error-message">{error}</div>}

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
            'Connect MetaMask'
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
          <p>New to AxPesa? <Link to="/register">Create an account</Link></p>
        </div>
      </div>
    </div>
  );
}