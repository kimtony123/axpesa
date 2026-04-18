import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { api } from '../src/api';
import { useWalletStore, formatAddress } from '../src/walletStore';

const FAUCET_AMOUNT = 100;

export default function FaucetScreen() {
  const [walletAddress, setWalletAddress] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const { address, isConnected } = useWalletStore();

  useEffect(() => {
    const addr = address || walletAddress;
    if (addr && addr.startsWith('0x')) {
      loadStatus(addr);
    }
  }, [address, walletAddress]);

  const loadStatus = async (addr: string) => {
    setChecking(true);
    const data = await api.getFaucetStatus(addr);
    setStatus(data.data);
    setChecking(false);
  };

  const handleCheckStatus = () => {
    if (walletAddress.startsWith('0x') && walletAddress.length === 42) {
      loadStatus(walletAddress);
    } else {
      Alert.alert('Invalid Address', 'Please enter a valid Conflux wallet address');
    }
  };

  const handleClaim = async () => {
    const addr = address || walletAddress;
    
    if (!addr || !addr.startsWith('0x') || addr.length !== 42) {
      Alert.alert('Invalid Address', 'Please enter a valid Conflux wallet address');
      return;
    }

    setLoading(true);
    try {
      const res = await api.claimFaucet(addr);
      
      if (res.success) {
        Alert.alert(
          '🎉 Success!',
          `You received ${FAUCET_AMOUNT} AxCNH!\n\nTransaction: ${res.data.txHash?.slice(0, 10)}...`,
          [{ text: 'OK' }]
        );
        loadStatus(addr);
      } else {
        Alert.alert('Claim Failed', res.error?.message || 'Unable to claim tokens');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canClaim = status?.canClaim && status?.faucetBalance >= FAUCET_AMOUNT;
  const timeUntilNextClaim = status?.timeUntilNextClaim || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🚰</Text>
        <Text style={styles.headerTitle}>Test Token Faucet</Text>
        <Text style={styles.headerSubtitle}>
          Get free AxCNH tokens for testing
        </Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Token</Text>
          <Text style={styles.infoValue}>💴 AxCNH</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Amount per claim</Text>
          <Text style={[styles.infoValue, styles.infoHighlight]}>{FAUCET_AMOUNT} AxCNH</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cooldown</Text>
          <Text style={styles.infoValue}>60 minutes</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Available</Text>
          <Text style={[styles.infoValue, { color: status?.faucetBalance >= FAUCET_AMOUNT ? '#10B981' : '#EF4444' }]}>
            {status?.faucetBalance?.toLocaleString() || '0'} AxCNH
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Conflux Wallet Address</Text>
        
        {isConnected && address ? (
          <View style={styles.connectedWallet}>
            <Text style={styles.walletAddress}>{formatAddress(address)}</Text>
            <Text style={styles.walletConnected}>✓ Connected</Text>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={walletAddress}
              onChangeText={setWalletAddress}
              placeholder="0x..."
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={styles.checkButton}
              onPress={handleCheckStatus}
              disabled={checking}
            >
              {checking ? (
                <ActivityIndicator size="small" color="#666" />
              ) : (
                <Text style={styles.checkButtonText}>Check Status</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {status && (
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={[styles.statusBadge, canClaim ? styles.statusAvailable : styles.statusCooldown]}>
              <Text style={styles.statusBadgeText}>
                {canClaim ? '✓ Available' : '⏳ Cooldown'}
              </Text>
            </View>
          </View>
          
          {timeUntilNextClaim > 0 && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Time remaining</Text>
              <Text style={styles.statusValue}>{timeUntilNextClaim} minutes</Text>
            </View>
          )}
          
          {status.lastClaimedAmount && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Last claimed</Text>
              <Text style={styles.statusValue}>{status.lastClaimedAmount} AxCNH</Text>
            </View>
          )}
          
          {status.lastClaimedAt && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Last claimed at</Text>
              <Text style={styles.statusValue}>
                {new Date(status.lastClaimedAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.claimButton,
          (!canClaim || loading) && styles.claimButtonDisabled
        ]}
        onPress={handleClaim}
        disabled={!canClaim || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.claimButtonText}>
            {canClaim ? `Claim ${FAUCET_AMOUNT} AxCNH` : 'Not Available'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>⚠️ Important</Text>
        <Text style={styles.noteText}>
          • This is a TEST faucet for the Conflux eSpace testnet{'\n'}
          • Tokens have NO real value{'\n'}
          • One claim per wallet every 60 minutes{'\n'}
          • Use these tokens to test the Buy/Sell flow
        </Text>
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
    padding: 24,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  infoHighlight: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  checkButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  checkButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  connectedWallet: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletAddress: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#333',
  },
  walletConnected: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAvailable: {
    backgroundColor: '#dcfce7',
  },
  statusCooldown: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  claimButton: {
    backgroundColor: '#10B981',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  claimButtonDisabled: {
    backgroundColor: '#ccc',
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noteCard: {
    backgroundColor: '#fef3c7',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
  },
});
