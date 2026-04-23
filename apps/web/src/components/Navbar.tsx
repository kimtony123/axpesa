import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Wallet, LogOut, ArrowLeft } from 'lucide-react';
import useWalletStore from '../lib/walletStore';
import useThemeStore from '../lib/themeStore';
import './Navbar.css';

export default function Navbar() {
  const { address, isConnected, disconnect } = useWalletStore();
  const { mode, toggleMode } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

  const showBackBtn = !['/', '/dashboard', '/login', '/register'].includes(location.pathname);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        {showBackBtn && (
          <button 
            onClick={() => navigate(-1)} 
            className="back-btn"
            title="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <Link to="/" className="logo">
          <img src="/axpesa.jpg" alt="AxPesa" className="logo-img" />
        </Link>
        
        <div className="navbar-right">
          <button 
            className="theme-toggle"
            onClick={toggleMode}
          >
            {mode === 'dark' ? '☀️' : '🌙'} {mode === 'dark' ? 'Light' : 'Dark'}
          </button>

          {isConnected ? (
            <div className="wallet-dropdown">
              <button className="btn btn-primary" onClick={() => setShowDropdown(!showDropdown)}>
                <Wallet size={16} />
                {shortAddress}
              </button>
              {showDropdown && (
                <div className="dropdown-menu">
                  <button onClick={handleDisconnect} className="disconnect-btn">
                    <LogOut size={16} />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">Connect Wallet</Link>
          )}
        </div>
      </div>
    </nav>
  );
}