import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api, TOKENS } from '../src/api';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [rates, setRates] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadRates = async () => {
    const data = await api.getRates();
    setRates(data);
    setRefreshing(false);
  };

  useEffect(() => {
    loadRates();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRates();
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Africa-China</Text>
            <Text style={styles.titleAccent}>Crypto Bridge</Text>
          </View>
          <View style={styles.brandBadge}>
            <Text style={styles.brandEmoji}>🌏</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Buy & Sell Stablecoins with M-PESA</Text>
        <View style={styles.routeTag}>
          <Text style={styles.routeEmoji}>🇨🇳 → 🇿🇦</Text>
          <Text style={styles.routeText}>China ↔ Africa</Text>
        </View>
      </View>

      <View style={styles.rateCard}>
        <Text style={styles.rateCardTitle}>Live Exchange Rates</Text>
        <View style={styles.rateGrid}>
          {Object.entries(TOKENS).slice(0, 2).map(([key, token]) => (
            <View key={key} style={[styles.rateItem, { borderLeftColor: token.color }]}>
              <View style={styles.rateHeader}>
                <Text style={[styles.tokenSymbol, { color: token.color }]}>{token.symbol}</Text>
                <Text style={styles.peg}>({token.peg})</Text>
              </View>
              <Text style={styles.rateValue}>
                {rates?.buy?.[key]?.rate?.toFixed(2) || '18.87'} KES
              </Text>
              <Text style={styles.rateLabel}>Buy rate</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('Buy')}
          >
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={styles.actionTitle}>Buy Stablecoins</Text>
            <Text style={styles.actionDesc}>Pay with M-PESA</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionCard, styles.sellCard]} 
            onPress={() => navigation.navigate('Sell')}
          >
            <Text style={styles.actionIcon}>💸</Text>
            <Text style={styles.actionTitle}>Sell Stablecoins</Text>
            <Text style={styles.actionDesc}>Get KES instantly</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('Faucet')}
          >
            <Text style={styles.actionIcon}>🚰</Text>
            <Text style={styles.actionTitle}>Faucet</Text>
            <Text style={styles.actionDesc}>Free test tokens</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>Dashboard</Text>
            <Text style={styles.actionDesc}>Vault balances</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supported Tokens</Text>
        <View style={styles.tokensList}>
          {Object.values(TOKENS).map((token) => (
            <View key={token.symbol} style={styles.tokenItem}>
              <View style={[styles.tokenIcon, { backgroundColor: token.color + '20' }]}>
                <Text style={[styles.tokenEmoji, { color: token.color }]}>
                  {token.symbol === 'AxCNH' ? '💴' : token.symbol === 'USDTO' ? '💵' : token.symbol === 'BTC' ? '₿' : 'Ξ'}
                </Text>
              </View>
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenName}>{token.name}</Text>
                <Text style={styles.tokenPeg}>Pegged to {token.peg}</Text>
              </View>
              <Text style={[styles.tokenRate, { color: '#10B981' }]}>
                {rates?.buy?.[token.symbol]?.rate?.toFixed(2) || '-'} KES
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        <View style={styles.methodsList}>
          <View style={styles.methodItem}>
            <Text style={styles.methodIcon}>📱</Text>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>M-PESA</Text>
              <Text style={styles.methodDesc}>Kenya, Tanzania, Uganda</Text>
            </View>
          </View>
          <View style={styles.methodItem}>
            <Text style={styles.methodIcon}>💳</Text>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>Cards</Text>
              <Text style={styles.methodDesc}>Visa, Mastercard</Text>
            </View>
          </View>
          <View style={styles.methodItem}>
            <Text style={styles.methodIcon}>🏦</Text>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>Bank Transfer</Text>
              <Text style={styles.methodDesc}>NG, KE, UG, ZA, GH</Text>
            </View>
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
    backgroundColor: '#10B981',
    padding: 24,
    paddingTop: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  titleAccent: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFD700',
  },
  brandBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  brandEmoji: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  routeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  routeEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  routeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  rateCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: -16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rateCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  rateGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  rateItem: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tokenSymbol: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  peg: {
    fontSize: 10,
    color: '#999',
  },
  rateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  rateLabel: {
    fontSize: 10,
    color: '#999',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sellCard: {
    backgroundColor: '#FEF3C7',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tokensList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenEmoji: {
    fontSize: 20,
  },
  tokenInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tokenName: {
    fontSize: 14,
    fontWeight: '500',
  },
  tokenPeg: {
    fontSize: 12,
    color: '#999',
  },
  tokenRate: {
    fontSize: 14,
    fontWeight: '600',
  },
  methodsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  methodIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
  },
  methodDesc: {
    fontSize: 12,
    color: '#666',
  },
  bottomPadding: {
    height: 40,
  },
});
