import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { api, TOKENS, CURRENCIES, PAYMENT_METHODS } from '../src/api';
import { useWalletStore, formatAddress } from '../src/walletStore';

const TOKEN_KEYS = Object.keys(TOKENS);

export default function BuyScreen() {
  const [amount, setAmount] = useState('1000');
  const [currency, setCurrency] = useState('KES');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedToken, setSelectedToken] = useState('AxCNH');
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
  const rate = rates?.buy?.[selectedToken]?.rate || 18.87;
  const feePercent = rates?.buy?.[selectedToken]?.fee || 0.02;
  const fee = (parseFloat(amount || '0') * feePercent);
  const total = (parseFloat(amount || '0') + fee);
  const tokenAmount = (total / rate).toFixed(6);

  const handleBuy = async () => {
    if (paymentMethod === 'mpesa' && !phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await api.initiateBuy({
        fiatAmount: parseFloat(total.toFixed(2)),
        fiatCurrency: currency,
        paymentMethod,
        walletAddress,
        phoneNumber,
        tokenSymbol: selectedToken,
      });
      
      if (res.success) {
        Alert.alert(
          'Order Created', 
          `You will receive ${tokenAmount} ${selectedToken}.\n\nCheck your phone for M-PESA payment prompt.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', res.error?.message || 'Failed to initiate payment');
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
        <Text style={styles.label}>You Pay</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
          />
          <TouchableOpacity 
            style={styles.currencyPicker}
            onPress={() => {
              const currentIndex = CURRENCIES.findIndex(c => c.code === currency);
              const nextIndex = (currentIndex + 1) % CURRENCIES.length;
              setCurrency(CURRENCIES[nextIndex].code);
            }}
          >
            <Text style={styles.currencyText}>{CURRENCIES.find(c => c.code === currency)?.flag}</Text>
            <Text style={styles.currencyCode}>{currency}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Select Token</Text>
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
                  <Text style={[styles.tokenEmoji, { color: t.color }]}>
                    {key === 'AxCNH' ? '💴' : key === 'USDTO' ? '💵' : key === 'BTC' ? '₿' : 'Ξ'}
                  </Text>
                </View>
                <Text style={[styles.tokenSymbol, isSelected && { color: t.color }]}>{key}</Text>
                <Text style={styles.tokenPeg}>{t.peg}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Rate</Text>
          <Text style={styles.summaryValue}>1 {selectedToken} = {rate.toFixed(2)} {currency}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fee ({(feePercent * 100).toFixed(0)}%)</Text>
          <Text style={styles.summaryValue}>{fee.toFixed(2)} {currency}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{total.toFixed(2)} {currency}</Text>
        </View>
      </View>

      <View style={[styles.card, { borderLeftColor: token.color, borderLeftWidth: 4 }]}>
        <Text style={styles.sectionTitle}>You Receive</Text>
        <View style={styles.receiveBox}>
          <Text style={[styles.receiveAmount, { color: token.color }]}>{tokenAmount}</Text>
          <Text style={[styles.receiveUnit, { color: token.color }]}>{selectedToken}</Text>
        </View>
        <Text style={styles.receivePeg}>Pegged to {token.peg}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {PAYMENT_METHODS.slice(0, 3).map((method) => (
          <TouchableOpacity
            key={method.id}
            onPress={() => setPaymentMethod(method.id)}
            style={[styles.methodOption, paymentMethod === method.id && styles.methodSelected]}
          >
            <Text style={styles.methodIcon}>{method.icon}</Text>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodName, paymentMethod === method.id && styles.methodNameSelected]}>
                {method.name}
              </Text>
              <Text style={styles.methodCountries}>{method.countries.join(', ')}</Text>
            </View>
            {paymentMethod === method.id && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {paymentMethod === 'mpesa' && (
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

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Wallet Address</Text>
        <View style={styles.walletBox}>
          <Text style={styles.walletAddress}>{formatAddress(walletAddress)}</Text>
          <Text style={styles.walletNote}>
            {isConnected ? 'Connected wallet' : 'Auto-generated (will be created on purchase)'}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.buyButton, { backgroundColor: token.color }]} 
        onPress={handleBuy} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buyButtonText}>Buy {tokenAmount} {selectedToken}</Text>
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
    alignItems: 'center',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#10B981',
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
  currencyText: {
    fontSize: 20,
  },
  currencyCode: {
    fontWeight: '600',
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
  tokenEmoji: {
    fontSize: 18,
  },
  tokenSymbol: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  tokenPeg: {
    fontSize: 9,
    color: '#999',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    color: '#666',
  },
  summaryValue: {
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontWeight: '600',
    fontSize: 16,
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  receiveBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  receiveAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  receiveUnit: {
    fontSize: 18,
    fontWeight: '600',
  },
  receivePeg: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
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
    borderColor: '#10B981',
    backgroundColor: '#f0fdf4',
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
    color: '#10B981',
  },
  methodCountries: {
    fontSize: 11,
    color: '#999',
  },
  checkmark: {
    color: '#10B981',
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
  buyButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 40,
  },
});
