import React from "react";
import { useTheme } from "../../services/ThemeProvider";
import Navbar from "../../components/navbar/NavBar";
import PortfolioChart from "../../components/performance/PortfolioChart";
import ProfitsChart from "../../components/performance/ProfitsChart";
import TradeHistory from "../../components/performance/TradeHistory";
import LiveComparison from "../../components/performance/LiveComparison";
import SideBySideChart from "../../components/performance/SideBySideChart";
import {
  tradeHistory,
  totalPnL,
  winRate,
  totalTrades,
  currentPortfolioValue,
  initialValue,
  totalReturn,
} from "../../data/mockTradeData";
import "./Performance.css";

const Performance: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const wins = tradeHistory.filter((t) => t.status === "WIN").length;

  const stats = [
    {
      label: "Total PnL",
      value: `${totalPnL >= 0 ? "+" : ""}$${totalPnL.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      color: totalPnL >= 0 ? "var(--accent-green)" : "var(--accent-red)",
      sub: "30-day simulation",
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      color: winRate >= 60 ? "var(--accent-green)" : "var(--accent-red)",
      sub: `${wins} wins / ${totalTrades} trades`,
    },
    {
      label: "Total Return",
      value: `+${totalReturn.toFixed(2)}%`,
      color: "var(--accent-green)",
      sub: `${initialValue.toLocaleString()} → ${currentPortfolioValue.toLocaleString()} USDC`,
    },
    {
      label: "Asset",
      value: "BTC/USDC",
      color: "var(--accent-cyan)",
      sub: "Perpetual — Hyperliquid",
    },
  ];

  return (
    <div className="perf-body">
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      <div className="perf-layout">
        <div className="perf-header">
          <div className="perf-title-group">
            <h1 className="perf-title">
              <span className="perf-title-accent">_</span> Live Performance
            </h1>
            <p className="perf-subtitle">
              AI (PPO LSTM) vs SBI (CL1 Neural) — live on Hyperliquid, BTC/USDC
            </p>
          </div>
          <div className="perf-live-badge">
            <span className="live-dot"></span>
            <span>LIVE COMPARISON</span>
          </div>
        </div>

        {/* Live Comparison Section */}
        <section className="perf-section">
          <LiveComparison />
        </section>

        {/* Side-by-side chart */}
        <section className="perf-section">
          <h2 className="section-title">
            <span className="perf-title-accent">_</span> Portfolio Comparison
          </h2>
          <SideBySideChart />
        </section>

        {/* Stats grid */}
        <div className="perf-stats-grid">
          {stats.map((stat, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="stat-sub">{stat.sub}</div>
            </div>
          ))}
        </div>

        <div className="perf-charts-row">
          <div className="chart-col">
            <PortfolioChart />
          </div>
          <div className="chart-col">
            <ProfitsChart />
          </div>
        </div>

        <div className="perf-table-row">
          <TradeHistory />
        </div>
      </div>
    </div>
  );
};

export default Performance;
