import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'http://localhost:8080';

export default function MerchantDashboardScreen() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('axpesa_token');
    if (!token) {
      Alert.alert('Login Required', 'Please login as merchant first');
      navigation.goBack();
      return;
    }

    fetch(`${API_URL}/api/merchant/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setStats(d.data.stats);
          setTransactions(d.data.recentTransactions);
        }
        setLoading(false);
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to load dashboard');
        setLoading(false);
      });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📊</Text>
          <Text style={styles.statValue}>{stats?.totalAxCNH?.toFixed(2) || 0}</Text>
          <Text style={styles.statLabel}>Total Volume (AxCNH)</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📝</Text>
          <Text style={styles.statValue}>{stats?.totalTransactions || 0}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔗</Text>
          <Text style={styles.statValue}>{stats?.activeLinks || 0}</Text>
          <Text style={styles.statLabel}>Active Links</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          transactions.map(tx => (
            <View key={tx.id} style={styles.txItem}>
              <View>
                <Text style={styles.txAmount}>{tx.axcnhAmount.toFixed(4)} AxCNH</Text>
                <Text style={styles.txFiat}>{tx.fiatCurrency} {tx.fiatAmount.toFixed(2)}</Text>
              </View>
              <View style={[styles.txStatus, 
                tx.status === 'completed' && styles.txCompleted,
                tx.status === 'pending' && styles.txPending,
              ]}>
                <Text style={[styles.txStatusText, 
                  tx.status === 'completed' && styles.txCompletedText,
                  tx.status === 'pending' && styles.txPendingText,
                ]}>
                  {tx.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity 
        style={styles.posButton}
        onPress={() => navigation.navigate('POS')}
      >
        <Text style={styles.posButtonText}>📱 Open POS Terminal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
  },
  txItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  txFiat: {
    fontSize: 12,
    color: '#666',
  },
  txStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  txCompleted: {
    backgroundColor: '#dcfce7',
  },
  txPending: {
    backgroundColor: '#fef3c7',
  },
  txStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  txCompletedText: {
    color: '#16a34a',
  },
  txPendingText: {
    color: '#d97706',
  },
  posButton: {
    backgroundColor: '#3B82F6',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  posButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
