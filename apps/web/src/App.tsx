import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import useWalletStore from "./lib/walletStore";

import Toaster from "./components/Toaster";

import HomePage from "./pages/Home/HomePage";
import LoginPage from "./pages/Login/LoginPage";
import RegisterPage from "./pages/Register/RegisterPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import BuyPage from "./pages/Buy/BuyPage";
import SellPage from "./pages/Sell/SellPage";
import TransferPage from "./pages/Transfer/TransferPage";
import StakingPage from "./pages/Staking/StakingPage";
import FaucetPage from "./pages/Faucet/FaucetPage";
import TransactionsPage from "./pages/Transactions/TransactionsPage";
import PaymentStatusPage from "./pages/PaymentStatus/PaymentStatusPage";
import POSPage from "./pages/POS/POSPage";
import MerchantPage from "./pages/Merchant/MerchantPage";
import MerchantLoginPage from "./pages/Merchant/Login/MerchantLoginPage";
import MerchantRegisterPage from "./pages/Merchant/Register/MerchantRegisterPage";
import MerchantDashboardPage from "./pages/Merchant/Dashboard/MerchantDashboardPage";

function WalletStateManager() {
  const { address, setWallet } = useWalletStore();

  useEffect(() => {
    const stored = localStorage.getItem("axpesa-wallet");
    if (stored && !address) {
      setWallet(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string | any[]) => {
      if (accounts.length === 0) {
        useWalletStore.getState().disconnect();
      } else {
        setWallet(accounts[0]);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () =>
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
  }, []);

  return null;
}

const App: React.FC = () => {
  return (
    <Router>
      <WalletStateManager />
      <Toaster />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/buy" element={<BuyPage />} />
        <Route path="/sell" element={<SellPage />} />
        <Route path="/transfer" element={<TransferPage />} />
        <Route path="/staking" element={<StakingPage />} />
        <Route path="/faucet" element={<FaucetPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/status/:transactionId" element={<PaymentStatusPage />} />
        <Route path="/pos" element={<POSPage />} />
        <Route path="/merchant" element={<MerchantPage />} />
        <Route path="/merchant/login" element={<MerchantLoginPage />} />
        <Route path="/merchant/register" element={<MerchantRegisterPage />} />
        <Route path="/merchant/dashboard" element={<MerchantDashboardPage />} />
      </Routes>
    </Router>
  );
};

export default App;
