import { Link } from 'react-router-dom';
import { QrCode, Wallet } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './MerchantPage.css';

export default function MerchantPage() {
  return (
    <div className="page-layout">
      <Navbar />
      <main className="page-container">
        <h1 className="page-title">Merchant Portal</h1>
        <div className="merchant-grid">
          <div className="merchant-card">
            <div className="merchant-icon"><QrCode size={48} /></div>
            <h3>QR Code Payment</h3>
            <p>Generate a QR code for customers to scan and pay</p>
          </div>
          <div className="merchant-card">
            <div className="merchant-icon"><Wallet size={48} /></div>
            <h3>Payment Link</h3>
            <p>Create a payment link to share with customers</p>
          </div>
        </div>
        <Link to="/login" className="btn-primary" style={{ marginTop: '2rem' }}>Merchant Login</Link>
      </main>
      <Footer />
    </div>
  );
}