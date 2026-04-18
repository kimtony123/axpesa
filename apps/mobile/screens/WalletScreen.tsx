import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useWalletStore, formatAddress, formatBalance } from '../src/walletStore';
import { TOKENS } from '../src/api';

export default function WalletScreen() {
  const { address, isConnected, balance, disconnect } = useWalletStore();

  const copyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      Alert.alert('Copied!', 'Wallet address copied to clipboard');
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: disconnect },
      ]
    );
  };

  if (!isConnected || !address) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Wallet</Text>
        </View>
        
        <View style={styles.notConnectedCard}>
          <Text style={styles.notConnectedIcon}>👛</Text>
          <Text style={styles.notConnectedTitle}>Wallet Not Connected</Text>
          <Text style={styles.notConnectedText}>
            Your wallet will be auto-generated when you make a transaction, or connect using the Buy/Sell screens.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Available Tokens</Text>
          {Object.values(TOKENS).map((token) => (
            <View key={token.symbol} style={styles.tokenRow}>
              <View style={[styles.tokenIcon, { backgroundColor: token.color + '20' }]}>
                <Text style={[styles.tokenEmoji, { color: token.color }]}>
                  {token.symbol === 'AxCNH' ? '💴' : token.symbol === 'USDTO' ? '💵' : token.symbol === 'BTC' ? '₿' : 'Ξ'}
                </Text>
              </View>
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                <Text style={styles.tokenPeg}>{token.name}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={styles.connectionBadge}>
          <Text style={styles.connectionDot}>●</Text>
          <Text style={styles.connectionText}>Connected</Text>
        </View>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>AxCNH Balance</Text>
        <Text style={styles.balanceAmount}>{formatBalance(balance)}</Text>
        <Text style={styles.balanceUnit}>AxCNH</Text>
        <Text style={styles.balanceUSD}>≈ $0.00 USD</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Wallet Address</Text>
        <View style={styles.addressRow}>
          <Text style={styles.address} numberOfLines={1}>
            {formatAddress(address)}
          </Text>
          <TouchableOpacity onPress={copyAddress} style={styles.copyButton}>
            <Text style={styles.copyText}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📤</Text>
          <Text style={styles.menuText}>Transaction History</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📥</Text>
          <Text style={styles.menuText}>Receive</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📤</Text>
          <Text style={styles.menuText}>Send</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleDisconnect}>
          <Text style={styles.menuIcon}>🔌</Text>
          <Text style={[styles.menuText, styles.disconnectText]}>Disconnect</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.networkInfo}>
        <Text style={styles.networkLabel}>Network</Text>
        <Text style={styles.networkValue}>Conflux eSpace Testnet (71)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#10B981',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  connectionDot: {
    color: '#4ade80',
    marginRight: 4,
    fontSize: 8,
  },
  connectionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: -10,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#10B981',
  },
  balanceUnit: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: '500',
  },
  balanceUSD: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  label: {
    fontSize: 14,
    color: '#666',
    padding: 16,
    paddingBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  address: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#333',
  },
  copyButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyText: {
    color: '#10B981',
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  menuArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  disconnectText: {
    color: '#EF4444',
  },
  networkInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  networkLabel: {
    color: '#666',
  },
  networkValue: {
    fontWeight: '500',
    color: '#333',
  },
  notConnectedCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  notConnectedIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  notConnectedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  notConnectedText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tokenIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenEmoji: {
    fontSize: 18,
  },
  tokenInfo: {
    marginLeft: 12,
  },
  tokenSymbol: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  tokenPeg: {
    fontSize: 12,
    color: '#999',
  },
});
