import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import useWalletStore from '../../lib/walletStore';
import { fetchApi } from '../../lib/api';
import './TransactionsPage.css';

export default function TransactionsPage() {
  const { address, isConnected } = useWalletStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      fetchApi(`/api/transactions/by-address?address=${address}`)
        .then(d => d.success && setTransactions(d.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [address]);

  if (!isConnected) {
    return (
      <div className="page-layout">
        <Navbar />
        <main className="auth-page"><div className="auth-card"><div className="auth-icon"><Wallet size={40} /></div><h1>Connect Wallet First</h1><p>Connect your wallet to view transactions</p><Link to="/login" className="btn-primary">Connect Wallet</Link></div></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-layout">
      <Navbar />
      <main className="page-container">
        <h1 className="page-title">Transactions</h1>
        {loading ? <p className="loading-text">Loading...</p> : transactions.length === 0 ? <div className="empty-state">No transactions yet</div> : (
          <div className="tx-list">
            {transactions.map((tx, i) => (
              <div key={i} className="tx-item">
                <div className="tx-info"><span className="tx-type">{tx.type}</span><span className="tx-date">{new Date(tx.createdat).toLocaleString()}</span></div>
                <div className="tx-amount"><span className={tx.status === 'completed' ? 'success' : 'pending'}>{tx.fiatamount} {tx.fiatcurrency}</span><span className="tx-sub">{tx.axcnhamount} AxCNH</span></div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}