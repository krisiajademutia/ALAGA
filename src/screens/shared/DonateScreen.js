import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { COLORS, SHADOWS } from '../../constants/theme';
import Header from '../../components/Header';

const PRESET_AMOUNTS = ['100', '250', '500', '1,000'];
const PAYMENT_METHODS = [
  { id: 'GCash', label: 'GCash', icon: 'phone-portrait-outline' },
  { id: 'Maya', label: 'Maya', icon: 'card-outline' },
  { id: 'Bank Transfer', label: 'Bank Transfer', icon: 'business-outline' },
  { id: 'Cash', label: 'Cash', icon: 'cash-outline' },
];

export default function DonateScreen({ route, navigation }) {
  const { animalName } = route.params || {};
  const { submitDonation } = useApp();

  const targetName = animalName || 'Papet (Limb Rehab)';
  const [amount, setAmount] = useState('1,000');
  const [method, setMethod] = useState('GCash');
  const [reference, setReference] = useState('GC20260826001');
  const [message, setMessage] = useState('');
  const [proof, setProof] = useState('receipt_screenshot.png');
  const [loading, setLoading] = useState(false);

  const pickProof = async () => {
    Alert.alert('Upload Receipt', 'Attach proof of transaction:', [
      {
        text: 'Camera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') return;
          const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
          if (!result.canceled) setProof(result.assets[0].uri);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') return;
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
          if (!result.canceled) setProof(result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      submitDonation({
        animalName: targetName,
        amount: 1000,
        amountDisplay: `₱${amount}`,
        method,
        referenceNumber: reference,
        proofPhoto: proof,
        message: message.trim() || 'For orthopedic follow-up and treats!',
      });
      setLoading(false);
      Alert.alert(
        'Donation Submitted',
        `Thank you! Your donation for ${targetName} is submitted and will be verified by the advocate.`,
        [{ text: 'View Activity', onPress: () => navigation.navigate('Activity', { tab: 'donations' }) }]
      );
    }, 700);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <Header
        title="Donate"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Green Card: Donating For */}
        <View style={styles.donatingForCard}>
          <View style={styles.giftCircle}>
            <Ionicons name="gift-outline" size={24} color="#2D9E5F" />
          </View>
          <View style={styles.donatingTextCol}>
            <Text style={styles.donatingLabel}>Donating for</Text>
            <Text style={styles.donatingName}>{targetName}</Text>
          </View>
        </View>

        {/* Amount presets */}
        <Text style={styles.sectionLabel}>AMOUNT (₱)</Text>
        <View style={styles.presetRow}>
          {PRESET_AMOUNTS.map((a) => {
            const active = amount === a;
            return (
              <TouchableOpacity
                key={a}
                style={[styles.presetBox, active && styles.presetBoxActive]}
                onPress={() => setAmount(a)}
                activeOpacity={0.8}
              >
                <Text style={[styles.presetText, active && styles.presetTextActive]}>
                  ₱{a}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom amount input */}
        <View style={styles.customAmountWrap}>
          <Text style={styles.currencyPrefix}>₱</Text>
          <TextInput
            style={styles.customAmountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        {/* Payment Method */}
        <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
        <View style={styles.methodGrid}>
          {PAYMENT_METHODS.map((m) => {
            const active = method === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.methodCard, active && styles.methodCardActive]}
                onPress={() => setMethod(m.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={m.icon}
                  size={18}
                  color={active ? '#206B82' : '#5C4E3A'}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.methodText, active && styles.methodTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Reference / Transaction Number */}
        <Text style={styles.sectionLabel}>Reference / Transaction Number</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.textInput}
            value={reference}
            onChangeText={setReference}
            placeholder="Transaction Reference"
            placeholderTextColor="#9A8B7A"
            autoCapitalize="characters"
          />
        </View>

        {/* Message (optional) */}
        <Text style={styles.sectionLabel}>Message (optional)</Text>
        <View style={[styles.inputWrap, styles.textAreaWrap]}>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Add an encouraging note..."
            placeholderTextColor="#9A8B7A"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Proof of payment */}
        <Text style={styles.sectionLabel}>PROOF OF PAYMENT (OPTIONAL)</Text>
        <TouchableOpacity
          style={styles.proofContainer}
          onPress={pickProof}
          activeOpacity={0.85}
        >
          <View style={styles.proofInner}>
            <Ionicons name="camera-outline" size={22} color="#206B82" style={{ marginBottom: 4 }} />
            <Text style={styles.proofText}>
              {proof
                ? typeof proof === 'string' && proof.includes('/')
                  ? 'Receipt Uploaded (custom)'
                  : 'Receipt Uploaded (receipt_screenshot.png)'
                : 'Tap to upload screenshot proof'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.8 }]}
          onPress={handleSubmit}
          activeOpacity={0.88}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>
            {loading ? 'Processing...' : 'Submit Donation'}
          </Text>
        </TouchableOpacity>

        {/* Disclaimer note */}
        <Text style={styles.disclaimerText}>
          All donations are verified by the Animal Advocate before being confirmed.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  donatingForCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5EE',
    borderWidth: 1.5,
    borderColor: '#C5E2D2',
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
  },
  giftCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#CCE7D7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  donatingTextCol: {
    flex: 1,
  },
  donatingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2D9E5F',
  },
  donatingName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#473018',
    marginTop: 2,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5C4E3A',
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBoxActive: {
    backgroundColor: '#B8E4E5',
    borderColor: '#92CDE5',
  },
  presetText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#473018',
  },
  presetTextActive: {
    color: '#473018',
    fontWeight: '800',
  },

  customAmountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: '700',
    color: '#473018',
    marginRight: 6,
  },
  customAmountInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#473018',
  },

  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  methodCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  methodCardActive: {
    backgroundColor: '#B8E4E5',
    borderColor: '#92CDE5',
  },
  methodText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#473018',
  },
  methodTextActive: {
    color: '#473018',
  },

  inputWrap: {
    backgroundColor: '#F3F7F8',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
    marginBottom: 16,
  },
  textAreaWrap: {
    height: 80,
    paddingVertical: 8,
  },
  textInput: {
    fontSize: 13,
    fontWeight: '600',
    color: '#473018',
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
  },

  proofContainer: {
    height: 72,
    borderWidth: 1.5,
    borderColor: '#92CDE5',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#F0F8FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  proofInner: {
    alignItems: 'center',
  },
  proofText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7A99',
  },

  submitBtn: {
    backgroundColor: '#85BBD2',
    borderRadius: 25,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#2E7A99',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  disclaimerText: {
    fontSize: 11,
    color: '#8C7D6A',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
});
