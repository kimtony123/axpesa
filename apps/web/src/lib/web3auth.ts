'use client';

import { Web3Auth } from '@web3auth/modal';
import { WEB3AUTH_NETWORK } from '@web3auth/modal';

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || '';

export const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  uiConfig: {
    appName: 'AxPesa',
    logoLight: 'https://your-logo-url.com/logo-light.png',
    logoDark: 'https://your-logo-url.com/logo-dark.png',
    defaultLanguage: 'en',
    modalZIndex: '99999',
    loginMethodsOrder: ['google', 'twitter', 'discord', 'github', 'linkedin'],
  },
});

export type Web3AuthUserInfo = {
  email?: string;
  name?: string;
  profileImage?: string;
  walletAddress?: string;
  verifier?: string;
  verifierId?: string;
};

export const CONFLUX_CHAIN_CONFIG = {
  chainId: '0x47',
  chainNamespace: 'eip155' as const,
  rpcTarget: process.env.NEXT_PUBLIC_RPC_URL || 'https://evmtestnet.confluxrpc.com',
  blockExplorer: 'https://evmtestnet.confluxscan.io',
  displayName: 'Conflux eSpace Testnet',
  ticker: 'CFX',
  tickerName: 'Conflux',
};
