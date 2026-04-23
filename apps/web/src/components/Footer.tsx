import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-links">
          <Link to="/">About</Link>
          <Link to="/">Privacy</Link>
          <Link to="/">Terms</Link>
          <Link to="/">Contact</Link>
        </div>
        <p className="copyright">© 2026 AxPesa. Built on Conflux eSpace.</p>
      </div>
    </footer>
  );
}