import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { COLORS, SHADOWS } from '../../constants/theme';
import { uploadImageToImgBB } from '../../services/storageService';

const CONDITIONS = [
  { id: 'injured', label: 'Injured (Urgent)' },
  { id: 'litter', label: 'Stray Litter' },
  { id: 'malnourished', label: 'Malnourished' },
];

export default function ReportRescueScreen({ navigation }) {
  const { addRescueReport } = useApp();

  const [selectedCondition, setSelectedCondition] = useState('injured');
  const [photo, setPhoto] = useState(null);
  const [locationDesc, setLocationDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    Alert.alert('Upload Photo', 'Choose photo source:', [
      {
        text: 'Camera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera access is required.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
          if (!result.canceled) setPhoto(result.assets[0].uri);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Gallery access is required.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
          if (!result.canceled) setPhoto(result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!locationDesc.trim()) {
      Alert.alert('Location required', 'Please describe the exact location.');
      return;
    }

    setLoading(true);
    let finalPhoto = photo;
    if (photo && !photo.startsWith('http')) {
      finalPhoto = await uploadImageToImgBB(photo);
    }

    addRescueReport({
      title: selectedCondition === 'injured' ? 'Injured Pup' : 'Stray Animal',
      animalType: 'Dog',
      condition: selectedCondition === 'injured' ? 'Injured' : 'Stray',
      urgency: selectedCondition === 'injured' ? 'High' : 'Medium',
      description: locationDesc.trim(),
      photo: finalPhoto || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80',
      location: {
        latitude: 14.5764,
        longitude: 121.0851,
        address: 'Pasig Blvd, near Rotonda',
        landmark: locationDesc.trim(),
      },
    });
    setLoading(false);
    Alert.alert(
      'Rescue Dispatch Submitted',
      'Immediately alerted registered foster volunteers in the area.',
      [{ text: 'View Alerts', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      {/* ── Map Canvas Background ─────────────────────────── */}
      <View style={styles.mapCanvas}>
        {/* Soft roads and green shapes mockup */}
        <View style={styles.roadH1} />
        <View style={styles.roadH2} />
        <View style={styles.roadV1} />
        <View style={styles.roadV2} />
        <View style={styles.roadDiag} />
        <View style={styles.river} />

        {/* Map Marker 1: Injured Pup (Ortigas) */}
        <View style={[styles.markerWrap, { top: '35%', left: '30%' }]}>
          <View style={styles.pinCircleAlert}>
            <Ionicons name="medical" size={18} color="#D94F4F" />
          </View>
          <View style={styles.pinCallout}>
            <Text style={styles.pinCalloutText}>Injured Pup (Ortigas)</Text>
          </View>
        </View>

        {/* Map Marker 2: Bantay Hayop Clinic */}
        <View style={[styles.markerWrap, { top: '44%', right: '12%' }]}>
          <View style={styles.pinCircleClinic}>
            <Ionicons name="business" size={18} color="#2E7A99" />
          </View>
          <View style={styles.pinCallout}>
            <Text style={styles.pinCalloutText}>Bantay Hayop Clinic</Text>
          </View>
        </View>

        {/* Map Marker 3: Stray Cat Colony */}
        <View style={[styles.markerWrap, { top: '54%', left: '22%' }]}>
          <View style={styles.pinCircleCat}>
            <Ionicons name="paw" size={16} color="#B45309" />
          </View>
          <View style={styles.pinCallout}>
            <Text style={styles.pinCalloutText}>Stray Cat Colony</Text>
          </View>
        </View>
      </View>

      {/* ── Top Header Bar ────────────────────────────────── */}
      <View style={styles.topHeader}>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.backCircle}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color="#473018" />
          </TouchableOpacity>

          <View style={styles.titleCenter}>
            <Text style={styles.networkLabel}>ALAGA COMMUNITY</Text>
            <Text style={styles.dispatchTitle}>Rescue Dispatch & Live Map</Text>
          </View>

          <View style={styles.liveIndicatorCircle}>
            <View style={styles.liveDot} />
          </View>
        </View>

        {/* GPS Coordinates Bar */}
        <View style={styles.gpsBar}>
          <View style={styles.gpsTargetWrap}>
            <View style={styles.gpsTargetDot} />
          </View>
          <View style={styles.gpsTextCol}>
            <Text style={styles.gpsLabel}>ACTIVE GPS COORDINATES</Text>
            <Text style={styles.gpsCoords}>Pasig Blvd, near Rotonda</Text>
          </View>
          <TouchableOpacity style={styles.compassBtn}>
            <Ionicons name="compass-outline" size={20} color="#8C7D6A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Bottom Sheet Form ─────────────────────────────── */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />

        <Text style={styles.sheetTitle}>Report Stray or Injured Animal</Text>
        <Text style={styles.sheetSub}>
          Immediately alerts 14 registered foster volunteers within 2 km.
        </Text>

        {/* Observed Urgency & Condition */}
        <Text style={styles.fieldLabel}>Observed Urgency & Condition:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {CONDITIONS.map((c) => {
            const active = selectedCondition === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.condPill, active && styles.condPillActive]}
                onPress={() => setSelectedCondition(c.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.condPillText, active && styles.condPillTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Photo Proof Upload */}
        <TouchableOpacity
          style={styles.uploadContainer}
          onPress={pickPhoto}
          activeOpacity={0.85}
        >
          {photo ? (
            <Image source={{ uri: photo }} style={styles.uploadedImg} resizeMode="cover" />
          ) : (
            <View style={styles.uploadInner}>
              <View style={styles.cameraIconCircle}>
                <Ionicons name="camera" size={20} color="#2E7A99" />
              </View>
              <Text style={styles.uploadText}>
                Tap to upload photo proof & landmark
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Location input */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.locationInput}
            placeholder="Describe exact location (e.g. across gas station)..."
            placeholderTextColor="#9A8B7A"
            value={locationDesc}
            onChangeText={setLocationDesc}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.8 }]}
          onPress={handleSubmit}
          activeOpacity={0.88}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>
            {loading ? 'Submitting...' : 'Submit Rescue Dispatch'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#E8F2EC',
  },

  // Mock Map Background Canvas
  mapCanvas: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E5EFE9',
    overflow: 'hidden',
  },
  roadH1: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  roadH2: {
    position: 'absolute',
    top: '48%',
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  roadV1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '38%',
    width: 14,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  roadV2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '68%',
    width: 14,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  roadDiag: {
    position: 'absolute',
    top: '15%',
    left: '-20%',
    width: '140%',
    height: 12,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
    transform: [{ rotate: '25deg' }],
  },
  river: {
    position: 'absolute',
    top: '46%',
    left: 0,
    right: 0,
    height: 38,
    backgroundColor: '#B5DCED',
    opacity: 0.85,
    transform: [{ rotate: '-8deg' }],
  },

  // Map Pins
  markerWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinCircleAlert: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF0B3',
    borderWidth: 3,
    borderColor: '#473018',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  pinCircleClinic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#A2D3EA',
    borderWidth: 3,
    borderColor: '#473018',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  pinCircleCat: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C5E2D2',
    borderWidth: 3,
    borderColor: '#473018',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  pinCallout: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
    ...SHADOWS.sm,
  },
  pinCalloutText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#473018',
  },

  // Top Header
  topHeader: {
    paddingTop: 50,
    paddingHorizontal: 18,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  titleCenter: {
    alignItems: 'center',
  },
  networkLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C7D6A',
    letterSpacing: 0.8,
  },
  dispatchTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#473018',
  },
  liveIndicatorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  liveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D94F4F',
  },

  // GPS Coordinates Bar
  gpsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...SHADOWS.card,
  },
  gpsTargetWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CCE3EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  gpsTargetDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2D1F12',
  },
  gpsTextCol: {
    flex: 1,
  },
  gpsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8C7D6A',
    letterSpacing: 0.5,
  },
  gpsCoords: {
    fontSize: 13,
    fontWeight: '800',
    color: '#473018',
  },
  compassBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom Sheet Form
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 28,
    ...SHADOWS.card,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6D3D1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#473018',
    marginBottom: 4,
  },
  sheetSub: {
    fontSize: 12,
    color: '#5C4E3A',
    marginBottom: 14,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#473018',
    marginBottom: 8,
  },
  pillsRow: {
    gap: 8,
    marginBottom: 14,
  },
  condPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCE3EE',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  condPillActive: {
    backgroundColor: '#FEF8DE',
    borderColor: '#473018',
    borderWidth: 1.5,
  },
  condPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#473018',
  },
  condPillTextActive: {
    fontWeight: '800',
  },

  uploadContainer: {
    height: 80,
    borderWidth: 1.5,
    borderColor: '#CCE3EE',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#F8FAF9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  uploadedImg: {
    width: '100%',
    height: '100%',
  },
  uploadInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#CCE3EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#473018',
  },

  inputWrap: {
    backgroundColor: '#F8FAF9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CCE3EE',
    paddingHorizontal: 14,
    height: 46,
    justifyContent: 'center',
    marginBottom: 16,
  },
  locationInput: {
    fontSize: 12,
    color: '#473018',
  },

  submitBtn: {
    backgroundColor: '#85BBD2',
    borderRadius: 25,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7A99',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#473018',
  },
});
