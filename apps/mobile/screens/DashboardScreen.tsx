import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { api, TOKENS, VAULT_ADDRESSES } from '../src/api';

export default function DashboardScreen() {
  const [vaultStats, setVaultStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVaultStats = async () => {
    setRefreshing(true);
    const stats: Record<string, any> = {};
    
    for (const token of Object.keys(TOKENS)) {
      const data = await api.getVaultStats(token);
      stats[token] = data;
    }
    
    setVaultStats(stats);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadVaultStats();
  }, []);

  const onRefresh = () => {
    loadVaultStats();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vault Dashboard</Text>
        <Text style={styles.headerSubtitle}>Multi-Token Liquidity Pools</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🔒 Liquidity Model</Text>
        <View style={styles.infoRow}>
          <View style={[styles.infoDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.infoText}>90% Locked (for stability)</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={[styles.infoDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.infoText}>10% Available (instant withdrawals)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vault Balances</Text>
        
        {Object.entries(TOKENS).map(([key, token]) => {
          const stats = vaultStats[key];
          const total = parseFloat(stats?.vaultBalance || '0');
          const liquidity = parseFloat(stats?.liquidityPool || '0');
          const locked = parseFloat(stats?.totalLocked || '0');
          
          return (
            <View key={key} style={styles.vaultCard}>
              <View style={styles.vaultHeader}>
                <View style={styles.vaultTitleRow}>
                  <View style={[styles.tokenIcon, { backgroundColor: token.color + '20' }]}>
                    <Text style={[styles.tokenEmoji, { color: token.color }]}>
                      {key === 'AxCNH' ? '💴' : key === 'USDTO' ? '💵' : key === 'BTC' ? '₿' : 'Ξ'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.vaultSymbol}>{token.symbol}</Text>
                    <Text style={styles.vaultPeg}>Pegged to {token.peg}</Text>
                  </View>
                </View>
                <Text style={[styles.vaultTotal, { color: token.color }]}>
                  {total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={styles.vaultBar}>
                <View 
                  style={[
                    styles.vaultBarLocked, 
                    { width: `${locked > 0 ? (locked / total) * 100 : 90}%`, backgroundColor: '#10B981' }
                  ]} 
                />
                <View 
                  style={[
                    styles.vaultBarLiquidity, 
                    { width: `${liquidity > 0 ? (liquidity / total) * 100 : 10}%`, backgroundColor: '#F59E0B' }
                  ]} 
                />
              </View>

              <View style={styles.vaultStats}>
                <View style={styles.vaultStat}>
                  <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.statLabel}>Locked</Text>
                  <Text style={styles.statValue}>{locked.toLocaleString()}</Text>
                </View>
                <View style={styles.vaultStat}>
                  <View style={[styles.statDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.statLabel}>Available</Text>
                  <Text style={styles.statValue}>{liquidity.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contract Addresses</Text>
        
        {Object.entries(VAULT_ADDRESSES).map(([key, address]) => (
          <View key={key} style={styles.addressCard}>
            <Text style={styles.addressLabel}>{key} Vault</Text>
            <Text style={styles.addressValue} numberOfLines={1}>{address}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Info</Text>
        <View style={styles.networkCard}>
          <View style={styles.networkRow}>
            <Text style={styles.networkLabel}>Network</Text>
            <Text style={styles.networkValue}>Conflux eSpace Testnet</Text>
          </View>
          <View style={styles.networkRow}>
            <Text style={styles.networkLabel}>Chain ID</Text>
            <Text style={styles.networkValue}>71</Text>
          </View>
          <View style={styles.networkRow}>
            <Text style={styles.networkLabel}>RPC URL</Text>
            <Text style={styles.networkValue} numberOfLines={1}>
              evmtestnet.confluxrpc.com
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3B82F6',
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  vaultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  vaultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  vaultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tokenIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenEmoji: {
    fontSize: 24,
  },
  vaultSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  vaultPeg: {
    fontSize: 12,
    color: '#999',
  },
  vaultTotal: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  vaultBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
  },
  vaultBarLocked: {
    height: '100%',
  },
  vaultBarLiquidity: {
    height: '100%',
  },
  vaultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  vaultStat: {
    alignItems: 'center',
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  addressValue: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#333',
  },
  networkCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  networkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  networkLabel: {
    fontSize: 14,
    color: '#666',
  },
  networkValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    maxWidth: '60%',
    textAlign: 'right',
  },
  bottomPadding: {
    height: 40,
  },
});
