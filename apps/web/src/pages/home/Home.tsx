import React from "react";
import { useTheme } from "../../services/ThemeProvider";
import Navbar from "../../components/navbar/NavBar";
import NeuralHero from "../../components/three/NeuralHero";
import HeroSection from "../../components/landing/HeroSection";
import WhatIsCaishen from "../../components/landing/WhatIsCaishen";
import HowItWorksSection from "../../components/landing/HowItWorksSection";
import ArchitectureSection from "../../components/landing/ArchitectureSection";
import FeaturesSection from "../../components/landing/FeaturesSection";
import CTASection from "../../components/landing/CTASection";
import Footer from "../../components/landing/Footer";

import "./Home.css";
import "../../components/navbar/NavBar.css";

const Home: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="caishen-body">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <NeuralHero />
      <HeroSection />
      <WhatIsCaishen />
      <HowItWorksSection />
      <ArchitectureSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Home;
