import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';

const API_URL = 'http://localhost:8080';

export default function POSScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePayment = async () => {
    if (!amount) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('axpesa_token');
      if (!token) {
        Alert.alert('Login Required', 'Please login as merchant first');
        return;
      }

      const res = await fetch(`${API_URL}/api/merchant/payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description: description || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentLink(data.data.url);
        const qrRes = await fetch(`${API_URL}/api/merchant/qr/${data.data.linkCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const qrData = await qrRes.json();
        if (qrData.success) {
          setQrCode(qrData.data.qrCode);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to generate payment');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (paymentLink) {
      await Clipboard.setStringAsync(paymentLink);
      Alert.alert('Copied!', 'Payment link copied to clipboard');
    }
  };

  const reset = () => {
    setAmount('');
    setDescription('');
    setQrCode(null);
    setPaymentLink(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>POS Terminal</Text>
        <Text style={styles.headerSubtitle}>Accept AxCNH payments</Text>
      </View>

      {!qrCode ? (
        <View style={styles.form}>
          <View style={styles.card}>
            <Text style={styles.label}>Amount (AxCNH)</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#ccc"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Coffee, Lunch, etc."
            />
          </View>

          <TouchableOpacity 
            style={[styles.generateButton, loading && styles.buttonDisabled]} 
            onPress={generatePayment}
            disabled={loading}
          >
            <Text style={styles.generateButtonText}>
              {loading ? 'Generating...' : 'Generate QR Code'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.qrContainer}>
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Customer Payment</Text>
            <Text style={styles.qrAmount}>{amount} AxCNH</Text>
            {description && <Text style={styles.qrDesc}>{description}</Text>}
            
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>QR Code Generated</Text>
              <Text style={styles.qrNote}>Show this screen to customer</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.linkButton} onPress={copyLink}>
            <Text style={styles.linkButtonText}>📋 Copy Payment Link</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={reset}>
            <Text style={styles.resetButtonText}>New Payment</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Customer scans QR code with their Conflux wallet app
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
    backgroundColor: '#3B82F6',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  form: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
  generateButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  qrContainer: {
    padding: 16,
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  qrTitle: {
    fontSize: 18,
    color: '#666',
  },
  qrAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginVertical: 8,
  },
  qrDesc: {
    fontSize: 14,
    color: '#999',
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  qrPlaceholderText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  qrNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  linkButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  linkButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    padding: 16,
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
