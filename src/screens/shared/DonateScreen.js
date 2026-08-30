import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { PAYMENT_METHODS } from '../../data/mockData';

const PRESET_AMOUNTS = [100, 250, 500, 1000];

export default function DonateScreen({ route, navigation }) {
  const { animalId, animalName } = route.params || {};
  const { submitDonation, animals } = useApp();

  const animal = animals.find((a) => a.id === animalId);
  const targetName = animalName || animal?.name || 'General Fund';

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const pickProof = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.7,
    });
    if (!result.canceled) setProof(result.assets[0].uri);
  };

  const validate = () => {
    const e = {};
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = 'Enter a valid donation amount.';
    if (!method) e.method = 'Select a payment method.';
    if (!reference.trim()) e.reference = 'Enter the reference or transaction number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      submitDonation({
        animalId: animalId || null,
        animalName: targetName,
        amount: Number(amount),
        method,
        referenceNumber: reference.trim(),
        proofPhoto: proof,
        message: message.trim(),
      });
      setLoading(false);
      Alert.alert(
        'Thank you! 💛',
        `Your donation of ₱${amount} for ${targetName} has been submitted and is pending verification.`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    }, 900);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Donate</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Target banner */}
        <View style={styles.targetBanner}>
          <View style={styles.targetIconWrap}>
            <Ionicons name="gift" size={28} color={COLORS.secondary} />
          </View>
          <View style={styles.targetText}>
            <Text style={styles.targetLabel}>Donating for</Text>
            <Text style={styles.targetName}>{targetName}</Text>
          </View>
        </View>

        {/* Amount presets */}
        <Text style={styles.sectionLabel}>AMOUNT (₱) {errors.amount && <Text style={styles.errInline}> · {errors.amount}</Text>}</Text>
        <View style={styles.presetRow}>
          {PRESET_AMOUNTS.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.presetBtn, amount === String(a) && styles.presetBtnActive]}
              onPress={() => { setAmount(String(a)); setErrors((e) => ({ ...e, amount: null })); }}
            >
              <Text style={[styles.presetText, amount === String(a) && styles.presetTextActive]}>₱{a}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Input
          placeholder="Or enter custom amount"
          value={amount}
          onChangeText={(t) => { setAmount(t); setErrors((e) => ({ ...e, amount: null })); }}
          keyboardType="numeric"
          icon={<Ionicons name="cash-outline" size={18} color={COLORS.textMuted} />}
        />

        {/* Payment method */}
        <Text style={styles.sectionLabel}>PAYMENT METHOD {errors.method && <Text style={styles.errInline}> · {errors.method}</Text>}</Text>
        <View style={styles.methodGrid}>
          {PAYMENT_METHODS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.methodCard, method === m && styles.methodCardActive]}
              onPress={() => { setMethod(m); setErrors((e) => ({ ...e, method: null })); }}
            >
              <Ionicons
                name={m === 'GCash' ? 'phone-portrait-outline' : m === 'Maya' ? 'card-outline' : m === 'Bank Transfer' ? 'business-outline' : 'cash-outline'}
                size={20}
                color={method === m ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Reference / Transaction Number"
          placeholder="e.g. GC20260826001"
          value={reference}
          onChangeText={(t) => { setReference(t); setErrors((e) => ({ ...e, reference: null })); }}
          autoCapitalize="characters"
          error={errors.reference}
          icon={<Ionicons name="receipt-outline" size={18} color={COLORS.textMuted} />}
        />

        <Input
          label="Message (optional)"
          placeholder="Leave a message of support..."
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={3}
          autoCapitalize="sentences"
        />

        {/* Proof of payment */}
        <Text style={styles.sectionLabel}>PROOF OF PAYMENT (optional)</Text>
        <TouchableOpacity style={styles.proofPicker} onPress={pickProof}>
          {proof ? (
            <View style={styles.proofPreviewWrap}>
              <Image source={{ uri: proof }} style={styles.proofPreview} />
              <TouchableOpacity style={styles.removeProof} onPress={() => setProof(null)}>
                <Ionicons name="close-circle" size={24} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.proofEmpty}>
              <Ionicons name="image-outline" size={28} color={COLORS.textMuted} />
              <Text style={styles.proofHint}>Tap to upload screenshot</Text>
            </View>
          )}
        </TouchableOpacity>

        <Button
          title="Submit Donation"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
          icon={<Ionicons name="heart" size={18} color="#fff" />}
        />

        <Text style={styles.disclaimer}>
          All donations will be verified by the Animal Advocate before being confirmed. Thank you for your support!
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.paddingL, paddingTop: 56, paddingBottom: SIZES.paddingM,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: SIZES.large, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { paddingHorizontal: SIZES.paddingL, paddingBottom: 40 },

  targetBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.advocateBadge, borderRadius: SIZES.radius,
    padding: SIZES.paddingM, marginBottom: SIZES.paddingL,
    borderWidth: 1.5, borderColor: COLORS.secondaryLight,
  },
  targetIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#D4EDDA', alignItems: 'center', justifyContent: 'center',
  },
  targetText: {},
  targetLabel: { fontSize: SIZES.small, color: COLORS.secondary, fontWeight: '600' },
  targetName: { fontSize: SIZES.large, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },

  sectionLabel: {
    fontSize: SIZES.xsmall, fontWeight: '700', color: COLORS.textSecondary,
    letterSpacing: 0.8, marginBottom: 10, marginTop: SIZES.paddingS,
  },
  errInline: { color: COLORS.danger, fontWeight: '600' },

  presetRow: { flexDirection: 'row', gap: 8, marginBottom: SIZES.paddingM },
  presetBtn: {
    flex: 1, paddingVertical: 10, borderRadius: SIZES.radius,
    borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  presetBtnActive: { backgroundColor: COLORS.tagBg, borderColor: COLORS.primary },
  presetText: { fontSize: SIZES.small, fontWeight: '700', color: COLORS.textSecondary },
  presetTextActive: { color: COLORS.primary },

  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SIZES.paddingM },
  methodCard: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: SIZES.radius,
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  methodCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.tagBg },
  methodText: { fontSize: SIZES.small, fontWeight: '700', color: COLORS.textSecondary },
  methodTextActive: { color: COLORS.primary },

  proofPicker: { marginBottom: SIZES.paddingM },
  proofPreviewWrap: { position: 'relative' },
  proofPreview: { width: '100%', height: 160, borderRadius: SIZES.radius, resizeMode: 'cover' },
  removeProof: { position: 'absolute', top: 8, right: 8 },
  proofEmpty: {
    height: 120, backgroundColor: COLORS.inputBg, borderRadius: SIZES.radius,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
    borderColor: COLORS.border, borderStyle: 'dashed',
  },
  proofHint: { fontSize: SIZES.small, color: COLORS.textMuted, marginTop: 6 },

  submitBtn: { marginTop: SIZES.paddingS, borderRadius: SIZES.radiusFull },
  disclaimer: {
    fontSize: SIZES.xsmall, color: COLORS.textMuted, textAlign: 'center',
    lineHeight: 18, marginTop: SIZES.paddingM,
  },
});
