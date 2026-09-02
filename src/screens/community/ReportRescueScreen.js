import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
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
  const [otherAnimalType, setOtherAnimalType] = useState('');
  const [condition, setCondition] = useState('');
  const [otherCondition, setOtherCondition] = useState('');
  const [urgency, setUrgency] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [contact, setContact] = useState('');
  const [isContained, setIsContained] = useState('');
  
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
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
    else if (animalType === 'Other' && !otherAnimalType.trim()) e.animalType = 'Please specify the animal type.';
    
    if (!condition) e.condition = 'Select the condition.';
    else if (condition === 'Other' && !otherCondition.trim()) e.condition = 'Please specify the condition.';
    
    if (!urgency) e.urgency = 'Select urgency level.';
    if (!isContained) e.isContained = 'Select if contained.';
    if (!description.trim()) e.description = 'Describe the situation.';
    if (!address.trim()) e.address = 'Enter the location.';
    if (!contact.trim()) e.contact = 'Contact number is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const fetchLocation = async () => {
    setLoadingLoc(true);
    setAddress('Fetching GPS coordinates...');
    setTimeout(() => {
      setAddress('123 Mango Avenue, Cebu City, Philippines');
      setLoadingLoc(false);
    }, 1500);
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      addRescueReport({
        animalType: animalType === 'Other' ? otherAnimalType.trim() : animalType,
        condition: condition === 'Other' ? otherCondition.trim() : condition,
        urgency,
        description: description.trim(),
        contact: contact.trim(),
        isContained,
        photo,
        location: {
          latitude: 10.3157 + (Math.random() - 0.5) * 0.05,
          longitude: 123.8854 + (Math.random() - 0.5) * 0.05,
          address: address.trim(),
          landmark: landmark.trim(),
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
        <Text style={styles.sectionLabel}>PHOTO {errors.photo && <Text style={styles.errInline}> · {errors.photo}</Text>}</Text>
        <View style={styles.photoRow}>
          {photo ? (
            <View style={styles.photoPreviewWrap}>
              <Image source={{ uri: photo }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.removePhoto} onPress={() => setPhoto(null)}>
                <Ionicons name="close-circle" size={28} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <View style={styles.photoBtnRow}>
                <TouchableOpacity style={styles.photoCircleBtn} onPress={takePhoto}>
                  <Ionicons name="camera" size={24} color={COLORS.primaryDeep} />
                  <Text style={styles.photoCircleText}>Camera</Text>
                </TouchableOpacity>
                <View style={styles.photoDivider} />
                <TouchableOpacity style={styles.photoCircleBtn} onPress={pickPhoto}>
                  <Ionicons name="image" size={24} color={COLORS.primaryDeep} />
                  <Text style={styles.photoCircleText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Animal type */}
        <Text style={styles.sectionLabel}>ANIMAL TYPE {errors.animalType && <Text style={styles.errInline}> · {errors.animalType}</Text>}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow}>
          {ANIMAL_SPECIES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, animalType === s && styles.chipActive]}
              onPress={() => {
                setAnimalType((prev) => prev === s ? '' : s);
                setErrors((e) => ({ ...e, animalType: null }));
              }}
            >
              <Text style={[styles.chipText, animalType === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {animalType === 'Other' && (
          <Input
            placeholder="Please specify animal type..."
            value={otherAnimalType}
            onChangeText={(t) => { setOtherAnimalType(t); setErrors((e) => ({ ...e, animalType: null })); }}
            autoCapitalize="words"
            style={{ marginBottom: SIZES.paddingM }}
          />
        )}

        {/* Condition */}
        <Text style={styles.sectionLabel}>CONDITION {errors.condition && <Text style={styles.errInline}> · {errors.condition}</Text>}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow}>
          {ANIMAL_CONDITIONS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, condition === c && styles.chipActive]}
              onPress={() => {
                setCondition((prev) => prev === c ? '' : c);
                setErrors((e) => ({ ...e, condition: null }));
              }}
            >
              <Text style={[styles.chipText, condition === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {condition === 'Other' && (
          <Input
            placeholder="Please specify condition..."
            value={otherCondition}
            onChangeText={(t) => { setOtherCondition(t); setErrors((e) => ({ ...e, condition: null })); }}
            autoCapitalize="words"
            style={{ marginBottom: SIZES.paddingM }}
          />
        )}

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

        {/* Is Contained */}
        <Text style={styles.sectionLabel}>IS THE ANIMAL CONTAINED? {errors.isContained && <Text style={styles.errInline}> · {errors.isContained}</Text>}</Text>
        <View style={styles.binaryRow}>
          {['Yes, secured', 'No, roaming free'].map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.binaryBtn, isContained === c && styles.binaryBtnActive]}
              onPress={() => { setIsContained(c); setErrors((e) => ({ ...e, isContained: null })); }}
            >
              <Text style={[styles.binaryBtnText, isContained === c && styles.binaryBtnTextActive]}>{c}</Text>
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

        {/* Contact Number */}
        <Input
          label="Contact Number"
          placeholder="e.g. 09123456789"
          value={contact}
          onChangeText={(t) => { setContact(t); setErrors((e) => ({ ...e, contact: null })); }}
          keyboardType="phone-pad"
          error={errors.contact}
          icon={<Ionicons name="call-outline" size={18} color={COLORS.textMuted} />}
        />

        {/* Location Section */}
        <View style={styles.locationHeader}>
          <Text style={styles.sectionLabel}>LOCATION / ADDRESS {errors.address && <Text style={styles.errInline}> · {errors.address}</Text>}</Text>
          <TouchableOpacity style={styles.fetchBtn} onPress={fetchLocation} disabled={loadingLoc}>
            <Ionicons name="locate" size={16} color={COLORS.primaryDeep} />
            <Text style={styles.fetchBtnText}>{loadingLoc ? 'Fetching...' : 'Use Current'}</Text>
          </TouchableOpacity>
        </View>
        <Input
          placeholder="e.g. Near Carbon Market, Cebu City"
          value={address}
          onChangeText={(t) => { setAddress(t); setErrors((e) => ({ ...e, address: null })); }}
          autoCapitalize="words"
          error={errors.address}
          icon={<Ionicons name="location-outline" size={18} color={COLORS.textMuted} />}
        />

        {/* Landmark */}
        <Input
          label="Nearby Landmark (Optional)"
          placeholder="e.g. Across Jollibee"
          value={landmark}
          onChangeText={setLandmark}
          autoCapitalize="words"
          icon={<Ionicons name="flag-outline" size={18} color={COLORS.textMuted} />}
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
    paddingHorizontal: SIZES.paddingL, paddingTop: Platform.OS === 'ios' ? 52 : 28, paddingBottom: SIZES.paddingM,
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
  photoPreview: { width: '100%', height: 200, borderRadius: SIZES.r16, resizeMode: 'cover' },
  removePhoto: { position: 'absolute', top: 12, right: 12, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden' },
  photoPlaceholder: {
    height: 140, backgroundColor: COLORS.surface, borderRadius: SIZES.r16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
    borderColor: COLORS.border, borderStyle: 'dashed',
  },
  photoBtnRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  photoCircleBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: SIZES.paddingM },
  photoCircleText: { fontSize: SIZES.small, fontWeight: '700', color: COLORS.textSecondary, marginTop: 8 },
  photoDivider: { width: 2, height: '60%', backgroundColor: COLORS.border },

  scrollRow: { flexDirection: 'row', gap: 10, paddingRight: SIZES.paddingL, marginBottom: SIZES.paddingM, marginTop: 4 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: SIZES.r12,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.card, shadowOpacity: 0.05, elevation: 1,
  },
  chipActive: { backgroundColor: COLORS.primaryDeep, borderColor: COLORS.primaryDeep },
  chipText: { fontSize: SIZES.small, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: '#fff' },

  urgencyRow: { flexDirection: 'row', gap: 10, marginBottom: SIZES.paddingM, marginTop: 4 },
  urgencyCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: SIZES.r12,
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    ...SHADOWS.card, shadowOpacity: 0.08, elevation: 2,
  },
  urgencyDot: { width: 10, height: 10, borderRadius: 5 },
  urgencyText: { fontSize: SIZES.small, fontWeight: '700' },

  binaryRow: { flexDirection: 'row', gap: 10, marginBottom: SIZES.paddingM, marginTop: 4 },
  binaryBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: SIZES.r12,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.card, shadowOpacity: 0.05, elevation: 1,
  },
  binaryBtnActive: { backgroundColor: COLORS.primaryDeep, borderColor: COLORS.primaryDeep },
  binaryBtnText: { fontSize: SIZES.small, fontWeight: '600', color: COLORS.textSecondary },
  binaryBtnTextActive: { color: '#fff' },

  locationHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SIZES.xs4,
  },
  fetchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.tagBg, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: SIZES.r12, borderWidth: 1, borderColor: COLORS.primaryLight,
  },
  fetchBtnText: { fontSize: SIZES.xs, fontWeight: '700', color: COLORS.primaryDeep },

  submitBtn: { marginTop: SIZES.paddingS, borderRadius: SIZES.radiusFull },
});
