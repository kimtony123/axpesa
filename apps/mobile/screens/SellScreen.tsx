import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { api, TOKENS } from '../src/api';
import { useWalletStore, formatAddress } from '../src/walletStore';

const TOKEN_KEYS = Object.keys(TOKENS);

const PAYOUT_METHODS = [
  { id: 'mpesa', name: 'M-PESA', icon: '📱', countries: ['Kenya', 'Tanzania', 'Uganda'] },
  { id: 'bank', name: 'Bank Transfer', icon: '🏦', countries: ['NG', 'KE', 'UG', 'ZA', 'GH'] },
];

export default function SellScreen() {
  const [tokenAmount, setTokenAmount] = useState('10');
  const [selectedToken, setSelectedToken] = useState('AxCNH');
  const [payoutMethod, setPayoutMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<any>(null);
  const { address, isConnected } = useWalletStore();

  const walletAddress = address || '0x' + Math.random().toString(36).slice(2, 42);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    const data = await api.getRates();
    setRates(data);
  };

  const token = TOKENS[selectedToken as keyof typeof TOKENS];
  const rate = rates?.sell?.[selectedToken]?.rate || 18.5;
  const feePercent = rates?.sell?.[selectedToken]?.fee || 0.025;
  const fee = (parseFloat(tokenAmount || '0') * rate * feePercent);
  const payoutAmount = ((parseFloat(tokenAmount || '0') * rate) - fee).toFixed(2);

  const handleSell = async () => {
    if (payoutMethod === 'mpesa' && !phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await api.initiateSell({
        axcnhAmount: parseFloat(tokenAmount),
        tokenSymbol: selectedToken,
        walletAddress,
        phoneNumber,
      });

      if (res.success) {
        Alert.alert(
          'Order Initiated',
          `Selling ${tokenAmount} ${selectedToken} for ${payoutAmount} KES.\n\nCheck your phone for M-PESA prompt.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', res.error?.message || 'Failed to initiate sale');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Token Amount</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.amountInput, { borderBottomColor: '#F59E0B' }]}
            value={tokenAmount}
            onChangeText={setTokenAmount}
            keyboardType="numeric"
            placeholder="0"
          />
          <TouchableOpacity 
            style={styles.currencyPicker}
            onPress={() => {
              const currentIndex = TOKEN_KEYS.indexOf(selectedToken);
              const nextIndex = (currentIndex + 1) % TOKEN_KEYS.length;
              setSelectedToken(TOKEN_KEYS[nextIndex]);
            }}
          >
            <Text style={[styles.tokenEmoji, { color: token.color }]}>
              {selectedToken === 'AxCNH' ? '💴' : selectedToken === 'USDTO' ? '💵' : selectedToken === 'BTC' ? '₿' : 'Ξ'}
            </Text>
            <Text style={[styles.tokenCode, { color: token.color }]}>{selectedToken}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.rateText}>Rate: 1 {selectedToken} = {rate.toFixed(2)} KES</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Select Token to Sell</Text>
        <View style={styles.tokenGrid}>
          {TOKEN_KEYS.map((key) => {
            const t = TOKENS[key as keyof typeof TOKENS];
            const isSelected = selectedToken === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.tokenOption,
                  isSelected && { borderColor: t.color, backgroundColor: t.color + '15' }
                ]}
                onPress={() => setSelectedToken(key)}
              >
                <View style={[styles.tokenIcon, { backgroundColor: t.color + '20' }]}>
                  <Text style={[styles.tokenEmojiSmall, { color: t.color }]}>
                    {key === 'AxCNH' ? '💴' : key === 'USDTO' ? '💵' : key === 'BTC' ? '₿' : 'Ξ'}
                  </Text>
                </View>
                <Text style={[styles.tokenSymbol, isSelected && { color: t.color }]}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { borderLeftColor: '#F59E0B', borderLeftWidth: 4 }]}>
        <Text style={styles.sectionTitle}>You Receive</Text>
        <View style={styles.receiveBox}>
          <Text style={styles.receiveAmount}>{payoutAmount}</Text>
          <Text style={styles.receiveUnit}>KES</Text>
        </View>
        <Text style={styles.feeText}>
          Fee ({(feePercent * 100).toFixed(1)}%): {fee.toFixed(2)} KES
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payout Method</Text>
        {PAYOUT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            onPress={() => setPayoutMethod(method.id)}
            style={[styles.methodOption, payoutMethod === method.id && styles.methodSelected]}
          >
            <Text style={styles.methodIcon}>{method.icon}</Text>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodName, payoutMethod === method.id && styles.methodNameSelected]}>
                {method.name}
              </Text>
              <Text style={styles.methodCountries}>{method.countries.join(', ')}</Text>
            </View>
            {payoutMethod === method.id && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {payoutMethod === 'mpesa' && (
        <View style={styles.card}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="254700123456"
            keyboardType="phone-pad"
          />
        </View>
      )}

      {payoutMethod === 'bank' && (
        <View style={styles.card}>
          <Text style={styles.label}>Bank Code</Text>
          <TextInput
            style={styles.input}
            value={bankCode}
            onChangeText={setBankCode}
            placeholder="MPSSKE"
          />
          <Text style={[styles.label, { marginTop: 12 }]}>Account Number</Text>
          <TextInput
            style={styles.input}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="Account number"
            keyboardType="numeric"
          />
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your Wallet</Text>
        <View style={styles.walletBox}>
          <Text style={styles.walletAddress}>{formatAddress(walletAddress)}</Text>
          <Text style={styles.walletNote}>
            {isConnected ? 'Connected wallet' : 'Enter your wallet address'}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.sellButton} 
        onPress={handleSell} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.sellButtonText}>Sell {tokenAmount} {selectedToken}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    paddingVertical: 8,
  },
  currencyPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  tokenEmoji: {
    fontSize: 20,
  },
  tokenCode: {
    fontWeight: '600',
  },
  rateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  tokenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tokenOption: {
    width: '23%',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tokenIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tokenEmojiSmall: {
    fontSize: 18,
  },
  tokenSymbol: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  receiveBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  receiveAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  receiveUnit: {
    fontSize: 18,
    color: '#F59E0B',
    fontWeight: '600',
  },
  feeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: '#eee',
    borderRadius: 10,
    marginBottom: 8,
  },
  methodSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#fffbeb',
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
  },
  methodNameSelected: {
    fontWeight: '600',
    color: '#F59E0B',
  },
  methodCountries: {
    fontSize: 11,
    color: '#999',
  },
  checkmark: {
    color: '#F59E0B',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  walletBox: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  walletAddress: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#333',
  },
  walletNote: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  sellButton: {
    backgroundColor: '#F59E0B',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sellButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 40,
  },
});
