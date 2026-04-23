import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import useWalletStore from '../../lib/walletStore';
import { fetchApi } from '../../lib/api';
import { transferTokens, waitForTransaction } from '../../lib/wallet';
import './TransferPage.css';

const AXCNH_TOKEN_ADDRESS = import.meta.env.VITE_AXCNH_TOKEN_ADDRESS || '0xc709FF3C768EEE6217DfAa3d75FD3e1bb085D4ad';

export default function TransferPage() {
  const { address, isConnected } = useWalletStore();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState('0');

  const transferAmount = parseFloat(amount) || 0;
  const balanceNum = parseFloat(balance) || 0;
  const isInsufficient = transferAmount > balanceNum;
  const isValid = recipient && transferAmount > 0 && !isInsufficient && !loading;

  useEffect(() => {
    if (address) {
      fetchApi(`/api/wallet/balances?address=${address}`)
        .then(d => d.success && d.data?.AxCNH && setBalance(d.data.AxCNH))
        .catch(() => {});
    }
  }, [address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError('');

    try {
      setError('Looking up recipient...');
      const lookupData = await fetchApi('/api/transfer/lookup', {
        method: 'POST',
        body: JSON.stringify({ recipient }),
      });
      
      if (!lookupData.success) {
        setError(lookupData.error?.message || 'Recipient not found');
        setLoading(false);
        return;
      }
      
      const toAddress = lookupData.data.walletaddress;
      setError('Please confirm the transfer in MetaMask...');

      try {
        const tx = await transferTokens(AXCNH_TOKEN_ADDRESS, toAddress, amount);
        const txHash = tx.hash;
        
        setError('Waiting for transaction confirmation...');
        const confirmed = await waitForTransaction(txHash);
        
        if (!confirmed) {
          setError('Transfer failed. Please try again.');
          setLoading(false);
          return;
        }

        setError('Confirming transfer...');
        const confirmData = await fetchApi('/api/transfer/confirm', {
          method: 'POST',
          body: JSON.stringify({ 
            recipient,
            amount: transferAmount,
            txhash: txHash,
          }),
        });
        
        if (confirmData.success) {
          alert(`Transfer of ${amount} AxCNH completed!`);
          setRecipient('');
          setAmount('');
        } else {
          setError(confirmData.error?.message || 'Transfer failed');
        }
      } catch (metaMaskErr: any) {
        console.error('MetaMask error:', metaMaskErr);
        if (metaMaskErr.code === 4001) {
          setError('You rejected the transaction. Please try again.');
        } else {
          setError(`MetaMask error: ${metaMaskErr.message}`);
        }
      }
    } catch (err: any) {
      console.error('Transfer error:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="page-layout">
        <Navbar />
        <main className="auth-page"><div className="auth-card"><div className="auth-icon"><Wallet size={40} /></div><h1>Connect Wallet First</h1><p>Please connect your wallet to transfer AxCNH</p><Link to="/login" className="btn-primary">Connect Wallet</Link></div></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-layout">
      <Navbar />
      <main className="page-container">
        <h1 className="page-title">Transfer AxCNH</h1>
        <div className="form-card">
          <div className="balance-display">
            <div>
              <span className="balance-label">Your Balance</span>
              <span className="balance-value">{parseFloat(balance).toFixed(2)} <small>AxCNH</small></span>
            </div>
          </div>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Recipient (Phone or Wallet Address)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="+254700000000 or 0x..." 
                value={recipient} 
                onChange={e => setRecipient(e.target.value)} 
              />
              <p className="form-hint">Enter phone number or wallet address</p>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (AxCNH)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="Enter amount" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
              />
              {amount && (
                <p className={isInsufficient ? 'form-error' : 'form-hint'}>
                  {isInsufficient ? `Insufficient balance! Max: ${parseFloat(balance).toFixed(2)}` : ''}
                </p>
              )}
            </div>
            <button type="submit" className="btn-primary" disabled={!isValid || loading}>
              {loading ? <><span className="spinner"></span> Processing...</> : isInsufficient ? 'Insufficient Balance' : `Send ${transferAmount} AxCNH`}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}