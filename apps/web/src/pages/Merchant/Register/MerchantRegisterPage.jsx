import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Loader2 } from 'lucide-react';
import { api } from '../../../lib/api';
import './MerchantRegisterPage.css';

export default function MerchantRegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    businessName: '',
    businessType: 'retail',
    phoneNumber: '',
    walletAddress: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.auth.register(form);
      if (data.success) {
        localStorage.setItem('axpesa_token', data.data.token);
        localStorage.setItem('axpesa_auth_type', 'email');
        localStorage.setItem('axpesa_merchant', JSON.stringify(data.data.merchant));
        navigate('/merchant/dashboard');
      } else {
        setError(data.error?.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">
          <Store size={40} />
        </div>
        <h1>Merchant Registration</h1>
        <p>Create your merchant account to start accepting AxCNH</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Business Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="input"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="input"
              minLength={8}
              required
            />
          </div>
          <div className="form-group">
            <label>Business Name</label>
            <input
              type="text"
              value={form.businessName}
              onChange={e => setForm({ ...form, businessName: e.target.value })}
              className="input"
              required
            />
          </div>
          <div className="form-group">
            <label>Business Type</label>
            <select
              value={form.businessType}
              onChange={e => setForm({ ...form, businessType: e.target.value })}
              className="select"
            >
              <option value="retail">Retail Shop</option>
              <option value="restaurant">Restaurant/Cafe</option>
              <option value="hotel">Hotel/Hostel</option>
              <option value="services">Services</option>
              <option value="online">Online Store</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
              className="input"
              placeholder="254700123456"
              required
            />
          </div>
          <div className="form-group">
            <label>Conflux Wallet Address</label>
            <input
              type="text"
              value={form.walletAddress}
              onChange={e => setForm({ ...form, walletAddress: e.target.value })}
              className="input font-mono"
              placeholder="cfx: or 0x..."
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <><Loader2 size={20} className="spinner" /> Creating Account...</> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/merchant/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
}