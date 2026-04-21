import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="page-layout">
      <Navbar />
      <section className="hero">
        <div className="hero-content">
          <h1>African Finance,<br /><span>Evolved</span></h1>
          <p>Your Money, Multiple Options</p>
          <p className="subtitle">Access Chinese Yuan (CNY) and global currencies through Conflux eSpace. No crypto expertise needed.</p>
          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary">Get Started</Link>
            <Link to="/dashboard" className="btn btn-outline">View Dashboard</Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}