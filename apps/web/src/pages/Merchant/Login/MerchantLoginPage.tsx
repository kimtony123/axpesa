import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Loader2 } from 'lucide-react';
import { api } from '../../../lib/api';
import './MerchantLoginPage.css';

export default function MerchantLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.auth.login(form);
      if (data.success) {
        localStorage.setItem('axpesa_token', data.data.token);
        localStorage.setItem('axpesa_auth_type', 'email');
        localStorage.setItem('axpesa_merchant', JSON.stringify(data.data.merchant));
        navigate('/merchant/dashboard');
      } else {
        setError(data.error?.message || 'Login failed');
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
        <h1>Merchant Login</h1>
        <p>Access your merchant dashboard</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
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
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <><Loader2 size={20} className="spinner" /> Logging in...</> : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>New merchant? <Link to="/merchant/register">Register here</Link></p>
        </div>
      </div>
    </div>
  );
}