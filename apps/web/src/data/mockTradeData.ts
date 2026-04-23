export interface Trade {
  id: string;
  timestamp: string;
  asset: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  size: number;
  status: "WIN" | "LOSS";
}

export interface PortfolioPoint {
  date: string;
  value: number;
  pnl: number;
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export const portfolioHistory: PortfolioPoint[] = [
  { date: daysAgo(30), value: 10000, pnl: 0 },
  { date: daysAgo(28), value: 10240, pnl: 240 },
  { date: daysAgo(26), value: 10180, pnl: 180 },
  { date: daysAgo(24), value: 10450, pnl: 450 },
  { date: daysAgo(22), value: 10320, pnl: 320 },
  { date: daysAgo(20), value: 10780, pnl: 780 },
  { date: daysAgo(18), value: 10920, pnl: 920 },
  { date: daysAgo(16), value: 10640, pnl: 640 },
  { date: daysAgo(14), value: 11150, pnl: 1150 },
  { date: daysAgo(12), value: 11420, pnl: 1420 },
  { date: daysAgo(10), value: 11280, pnl: 1280 },
  { date: daysAgo(8), value: 11690, pnl: 1690 },
  { date: daysAgo(6), value: 11980, pnl: 1980 },
  { date: daysAgo(4), value: 11750, pnl: 1750 },
  { date: daysAgo(2), value: 12240, pnl: 2240 },
  { date: daysAgo(0), value: 12480, pnl: 2480 },
];

export const tradeHistory: Trade[] = [
  {
    id: "T001",
    timestamp: `${daysAgo(29)} 08:14:22`,
    asset: "BTC/USDC",
    direction: "LONG",
    entryPrice: 67240.50,
    exitPrice: 67890.20,
    pnl: 487.30,
    pnlPercent: 0.72,
    size: 0.75,
    status: "WIN",
  },
  {
    id: "T002",
    timestamp: `${daysAgo(27)} 14:32:05`,
    asset: "BTC/USDC",
    direction: "SHORT",
    entryPrice: 68120.00,
    exitPrice: 67650.80,
    pnl: 351.90,
    pnlPercent: 0.69,
    size: 0.75,
    status: "WIN",
  },
  {
    id: "T003",
    timestamp: `${daysAgo(25)} 02:18:44`,
    asset: "BTC/USDC",
    direction: "LONG",
    entryPrice: 67500.00,
    exitPrice: 67080.00,
    pnl: -210.00,
    pnlPercent: -0.41,
    size: 0.50,
    status: "LOSS",
  },
  {
    id: "T004",
    timestamp: `${daysAgo(23)} 19:45:11`,
    asset: "BTC/USDC",
    direction: "LONG",
    entryPrice: 66950.00,
    exitPrice: 67840.00,
    pnl: 667.50,
    pnlPercent: 1.33,
    size: 0.75,
    status: "WIN",
  },
  {
    id: "T005",
    timestamp: `${daysAgo(21)} 11:22:38`,
    asset: "BTC/USDC",
    direction: "SHORT",
    entryPrice: 67920.00,
    exitPrice: 68470.00,
    pnl: -385.00,
    pnlPercent: -0.76,
    size: 0.60,
    status: "LOSS",
  },
  {
    id: "T006",
    timestamp: `${daysAgo(19)} 06:07:52`,
    asset: "BTC/USDC",
    direction: "LONG",
    entryPrice: 68350.00,
    exitPrice: 69200.00,
    pnl: 637.50,
    pnlPercent: 1.24,
    size: 0.75,
    status: "WIN",
  },
  {
    id: "T007",
    timestamp: `${daysAgo(17)} 22:51:19`,
    asset: "BTC/USDC",
    direction: "LONG",
    entryPrice: 69180.00,
    exitPrice: 69750.00,
    pnl: 427.50,
    pnlPercent: 0.82,
    size: 0.75,
    status: "WIN",
  },
  {
    id: "T008",
    timestamp: `${daysAgo(15)} 15:30:44`,
    asset: "BTC/USDC",
    direction: "SHORT",
    entryPrice: 69820.00,
    exitPrice: 69110.00,
    pnl: 497.00,
    pnlPercent: 0.97,
    size: 0.60,
    status: "WIN",
  },
  {
    id: "T009",
    timestamp: `${daysAgo(13)} 09:14:07`,
    asset: "BTC/USDC",
    direction: "LONG",
    entryPrice: 68980.00,
    exitPrice: 69720.00,
    pnl: 555.00,
    pnlPercent: 1.07,
    size: 0.75,
    status: "WIN",
  },
  {
    id: "T010",
    timestamp: `${daysAgo(11)} 03:42:33`,
    asset: "BTC/USDC",
    direction: "SHORT",
    entryPrice: 69980.00,
    exitPrice: 69420.00,
    pnl: 280.00,
    pnlPercent: 0.80,
    size: 0.50,
    status: "WIN",
  },
  {
    id: "T011",
    timestamp: `${daysAgo(9)} 17:55:18`,
    asset: "BTC/USDC",
    direction: "LONG",
    entryPrice: 69250.00,
    exitPrice: 69980.00,
    pnl: 547.50,
    pnlPercent: 1.05,
    size: 0.75,
    status: "WIN",
  },
  {
    id: "T012",
    timestamp: `${daysAgo(7)} 12:28:41`,
    asset: "BTC/USDC",
    direction: "SHORT",
    entryPrice: 70120.00,
    exitPrice: 69480.00,
    pnl: 426.67,
    pnlPercent: 0.91,
    size: 0.60,
    status: "WIN",
  },
  {
    id: "T013",
    timestamp: `${daysAgo(5)} 08:11:59`,
    asset: "BTC/USDC",
    direction: "LONG",
    entryPrice: 69340.00,
    exitPrice: 70180.00,
    pnl: 630.00,
    pnlPercent: 1.21,
    size: 0.75,
    status: "WIN",
  },
  {
    id: "T014",
    timestamp: `${daysAgo(3)} 21:37:26`,
    asset: "BTC/USDC",
    direction: "SHORT",
    entryPrice: 70340.00,
    exitPrice: 69820.00,
    pnl: 347.78,
    pnlPercent: 0.74,
    size: 0.60,
    status: "WIN",
  },
  {
    id: "T015",
    timestamp: `${daysAgo(1)} 16:05:13`,
    asset: "BTC/USDC",
    direction: "LONG",
    entryPrice: 69850.00,
    exitPrice: 70680.00,
    pnl: 622.50,
    pnlPercent: 1.19,
    size: 0.75,
    status: "WIN",
  },
];

export const totalPnL = tradeHistory.reduce((sum, t) => sum + t.pnl, 0);
export const winRate = Math.round(
  (tradeHistory.filter((t) => t.status === "WIN").length / tradeHistory.length) * 100
);
export const totalTrades = tradeHistory.length;
export const currentPortfolioValue = portfolioHistory[portfolioHistory.length - 1].value;
export const initialValue = portfolioHistory[0].value;
export const totalReturn = ((currentPortfolioValue - initialValue) / initialValue) * 100;
