import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "./HomePage.css";

export default function HomePage() {
  return (
    <div className="page-layout">
      <Navbar />
      <section className="hero">
        <div className="hero-content">
          <img src="/axpesa.jpg" alt="AxPesa Logo" className="hero-logo" />
          <h1>
            African Finance,
            <br />
            <span>Evolved</span>
          </h1>
          <p>Your Money, Multiple Options</p>
          <p className="subtitle">
            Access Chinese Yuan (CNY) and global currencies through Conflux
            eSpace. No crypto expertise needed.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">
              Sign Up
            </Link>
            <Link to="/login" className="btn btn-outline">
              Login
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}