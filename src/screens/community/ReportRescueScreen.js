import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useApp } from '../../context/AppContext';
import { ANIMAL_SPECIES, ANIMAL_CONDITIONS, URGENCY_LEVELS } from '../../data/mockData';

export default function ReportRescueScreen({ navigation }) {
  const { addRescueReport } = useApp();

  const [animalType, setAnimalType] = useState('');
  const [condition, setCondition] = useState('');
  const [urgency, setUrgency] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to attach an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const validate = () => {
    const e = {};
    if (!animalType) e.animalType = 'Select the animal type.';
    if (!condition) e.condition = 'Select the condition.';
    if (!urgency) e.urgency = 'Select urgency level.';
    if (!description.trim()) e.description = 'Describe the situation.';
    if (!address.trim()) e.address = 'Enter the location.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      addRescueReport({
        animalType,
        condition,
        urgency,
        description: description.trim(),
        photo,
        location: {
          latitude: 10.3157 + (Math.random() - 0.5) * 0.05,
          longitude: 123.8854 + (Math.random() - 0.5) * 0.05,
          address: address.trim(),
        },
      });
      setLoading(false);
      Alert.alert(
        'Report Submitted!',
        'Your rescue report has been posted. Animal Advocates in the area will be notified.',
        [{ text: 'View Reports', onPress: () => navigation.navigate('AllReports') }]
      );
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Report an Animal</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Photo section */}
        <Text style={styles.sectionLabel}>PHOTO</Text>
        <View style={styles.photoRow}>
          {photo ? (
            <View style={styles.photoPreviewWrap}>
              <Image source={{ uri: photo }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.removePhoto} onPress={() => setPhoto(null)}>
                <Ionicons name="close-circle" size={24} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={36} color={COLORS.textMuted} />
              <Text style={styles.photoHint}>Add a photo of the animal</Text>
            </View>
          )}
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
              <Ionicons name="camera" size={20} color={COLORS.primary} />
              <Text style={styles.photoBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
              <Ionicons name="image" size={20} color={COLORS.primary} />
              <Text style={styles.photoBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Animal type */}
        <Text style={styles.sectionLabel}>ANIMAL TYPE {errors.animalType && <Text style={styles.errInline}> · {errors.animalType}</Text>}</Text>
        <View style={styles.chipRow}>
          {ANIMAL_SPECIES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, animalType === s && styles.chipActive]}
              onPress={() => { setAnimalType(s); setErrors((e) => ({ ...e, animalType: null })); }}
            >
              <Text style={[styles.chipText, animalType === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Condition */}
        <Text style={styles.sectionLabel}>CONDITION {errors.condition && <Text style={styles.errInline}> · {errors.condition}</Text>}</Text>
        <View style={styles.chipRow}>
          {ANIMAL_CONDITIONS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, condition === c && styles.chipActive]}
              onPress={() => { setCondition(c); setErrors((e) => ({ ...e, condition: null })); }}
            >
              <Text style={[styles.chipText, condition === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Urgency */}
        <Text style={styles.sectionLabel}>URGENCY LEVEL {errors.urgency && <Text style={styles.errInline}> · {errors.urgency}</Text>}</Text>
        <View style={styles.urgencyRow}>
          {URGENCY_LEVELS.map((u) => (
            <TouchableOpacity
              key={u.label}
              style={[styles.urgencyCard, urgency === u.label && { borderColor: u.color, borderWidth: 2 }]}
              onPress={() => { setUrgency(u.label); setErrors((e) => ({ ...e, urgency: null })); }}
            >
              <View style={[styles.urgencyDot, { backgroundColor: u.color }]} />
              <Text style={[styles.urgencyText, { color: u.color }]}>{u.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Input
          label="Description"
          placeholder="Describe the animal's situation, any visible injuries, behavior..."
          value={description}
          onChangeText={(t) => { setDescription(t); setErrors((e) => ({ ...e, description: null })); }}
          multiline
          numberOfLines={4}
          autoCapitalize="sentences"
          error={errors.description}
        />

        {/* Location */}
        <Input
          label="Location / Address"
          placeholder="e.g. Near Carbon Market, Cebu City"
          value={address}
          onChangeText={(t) => { setAddress(t); setErrors((e) => ({ ...e, address: null })); }}
          autoCapitalize="words"
          error={errors.address}
          icon={<Ionicons name="location-outline" size={18} color={COLORS.textMuted} />}
        />

        <Button
          title="Submit Rescue Report"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
          icon={<Ionicons name="alert-circle" size={18} color="#fff" />}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.paddingL, paddingTop: 56, paddingBottom: SIZES.paddingM,
    backgroundColor: COLORS.background,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: SIZES.large, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { paddingHorizontal: SIZES.paddingL, paddingBottom: 40 },

  sectionLabel: {
    fontSize: SIZES.xsmall, fontWeight: '700', color: COLORS.textSecondary,
    letterSpacing: 0.8, marginBottom: 10, marginTop: SIZES.paddingS,
  },
  errInline: { color: COLORS.danger, fontWeight: '600' },

  photoRow: { marginBottom: SIZES.paddingM },
  photoPreviewWrap: { position: 'relative', marginBottom: 10 },
  photoPreview: { width: '100%', height: 180, borderRadius: SIZES.radius, resizeMode: 'cover' },
  removePhoto: { position: 'absolute', top: 8, right: 8 },
  photoPlaceholder: {
    height: 150, backgroundColor: COLORS.inputBg, borderRadius: SIZES.radius,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
    borderColor: COLORS.border, borderStyle: 'dashed', marginBottom: 10,
  },
  photoHint: { fontSize: SIZES.small, color: COLORS.textMuted, marginTop: 6 },
  photoButtons: { flexDirection: 'row', gap: 10 },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: SIZES.radius,
    backgroundColor: COLORS.tagBg, borderWidth: 1.5, borderColor: COLORS.primaryLight,
  },
  photoBtnText: { fontSize: SIZES.small, fontWeight: '700', color: COLORS.primary },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SIZES.paddingM },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.inputBg, borderWidth: 1.5, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: SIZES.small, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: '#fff' },

  urgencyRow: { flexDirection: 'row', gap: 10, marginBottom: SIZES.paddingM },
  urgencyCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: SIZES.radius,
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  urgencyDot: { width: 10, height: 10, borderRadius: 5 },
  urgencyText: { fontSize: SIZES.small, fontWeight: '700' },

  submitBtn: { marginTop: SIZES.paddingS, borderRadius: SIZES.radiusFull },
});
