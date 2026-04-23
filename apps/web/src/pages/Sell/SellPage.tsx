import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Wallet } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import useWalletStore from '../../lib/walletStore';
import { api } from '../../lib/api';
import { transferTokens, waitForTransaction } from '../../lib/wallet';
import './SellPage.css';

const AXCNH_TOKEN_ADDRESS = import.meta.env.VITE_AXCNH_TOKEN_ADDRESS || '0xc709FF3C768EEE6217DfAa3d75FD3e1bb085D4ad';
const VAULT_ADDRESS = import.meta.env.VITE_VAULT_ADDRESS || '0xa360c11F053E587738B259Ab4Ad94460d21c58E4';

export default function SellPage() {
  const { address, isConnected } = useWalletStore();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState('0');
  const [rates, setRates] = useState({ KES: 18.87 });

  const rate = rates.KES || 18.87;
  const sellAmount = parseFloat(amount) || 0;
  const balanceNum = parseFloat(balance) || 0;
  const kesAmount = (sellAmount * rate).toFixed(2);
  const isInsufficient = sellAmount > balanceNum;
  const isValid = sellAmount > 0 && phone && !isInsufficient && !loading;

  useEffect(() => {
    if (address) {
      api.wallet.getBalances(address)
        .then(d => d.success && d.data?.AxCNH && setBalance(d.data.AxCNH))
        .catch(() => {});
    }
  }, [address]);

  useEffect(() => {
    api.offramp.getRate('KES')
      .then(d => d.success && d.data?.rate && setRates({ KES: d.data.rate }))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError('');
    let txHash = null;
    try {
      const initData = await api.offramp.initiate({
        axcnhamount: sellAmount,
        payoutmethod: 'mpesa',
        payoutdetails: {
          phonenumber: phone,
        },
      });

      if (!initData.success) {
        setError(initData.error?.message || 'Failed to initiate sell order');
        setLoading(false);
        return;
      }

      try {
        setError('Please confirm the token transfer in MetaMask...');
        const tx = await transferTokens(AXCNH_TOKEN_ADDRESS, VAULT_ADDRESS, sellAmount.toString());
        txHash = tx.hash;
        
        setError('Waiting for transaction confirmation...');
        const confirmed = await waitForTransaction(txHash);
        
        if (!confirmed) {
          setError('Token transfer failed. Please try again.');
          setLoading(false);
          return;
        }
      } catch (metaMaskErr: any) {
        console.error('MetaMask error:', metaMaskErr);
        if (metaMaskErr.code === 4001) {
          setError('You rejected the transaction. Please try again.');
        } else {
          setError(`MetaMask error: ${metaMaskErr.message}`);
        }
        setLoading(false);
        return;
      }

      setError('Confirming transaction...');
      const confirmData = await api.offramp.confirm(initData.data.transactionId, {
        txhash: txHash,
        phonenumber: phone,
      });

      if (confirmData.success) {
        alert(`✅ Sell order completed! You will receive ${kesAmount} KES via M-PESA to ${phone}.`);
        setAmount('');
        setPhone('');
      } else {
        setError(confirmData.error?.message || 'Failed to confirm transaction');
      }
    } catch (err: any) {
      console.error('Sell error:', err);
      setError(err?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="page-layout">
        <Navbar />
        <main className="auth-page">
          <div className="auth-card">
            <div className="auth-icon"><Wallet size={40} /></div>
            <h1>Connect Wallet First</h1>
            <p>Please connect your wallet to sell AxCNH</p>
            <Link to="/login" className="btn-primary">Connect Wallet</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-layout">
      <Navbar />
      <main className="page-container">
        <h1 className="page-title">Sell AxCNH</h1>
        <div className="form-card">
          <div className="balance-display">
            <div>
              <span className="balance-label">Your Balance</span>
              <span className="balance-value">{parseFloat(balance).toFixed(2)} <small>AxCNH</small></span>
            </div>
            <span className="exchange-rate">1 AxCNH = {rate} KES</span>
          </div>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Amount (AxCNH)</label>
              <input type="number" className="form-input" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} />
              {amount && <p className={isInsufficient ? 'form-error' : 'form-hint'}>{isInsufficient ? `Insufficient balance! Max: ${parseFloat(balance).toFixed(2)}` : `≈ ${kesAmount} KES`}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="tel" className="form-input" placeholder="+254700000000" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" disabled={!isValid}>
              {loading ? <><span className="spinner"></span> Processing...</> : isInsufficient ? 'Insufficient Balance' : `Sell ${sellAmount} AxCNH for ${kesAmount} KES`}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}