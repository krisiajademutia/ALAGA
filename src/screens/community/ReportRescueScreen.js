import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useApp } from '../../context/AppContext';
import { COLORS, SHADOWS } from '../../constants/theme';
import { uploadImageToImgBB } from '../../services/storageService';
import AlertModal from '../../components/AlertModal';
import PhotoPickerModal from '../../components/PhotoPickerModal';

const ANIMAL_TYPES = ['Dog', 'Cat', 'Bird', 'Other'];

const CONDITIONS = [
  { id: 'injured', label: 'Critical / Injured', icon: 'medical', color: '#D94F4F', urgency: 'High' },
  { id: 'malnourished', label: 'Sick / Weak', icon: 'heart-dislike', color: '#D97706', urgency: 'High' },
  { id: 'abandoned', label: 'Abandoned Litter', icon: 'cube', color: '#E69C24', urgency: 'High' },
  { id: 'stray', label: 'Stray / Lost', icon: 'paw', color: '#2E7A99', urgency: 'Medium' },
];

export default function ReportRescueScreen({ navigation }) {
  const { addRescueReport, currentUser } = useApp();
  const insets = useSafeAreaInsets();
  const safeTop =
    Platform.OS === 'ios'
      ? Math.max(insets.top, 16) + 4
      : insets.top > 24
      ? insets.top + 6
      : 14;

  // Form State
  const [selectedType, setSelectedType] = useState('Dog');
  const [selectedCondition, setSelectedCondition] = useState('injured');
  const [photos, setPhotos] = useState([]); // Array of { uri, base64 }
  const [activePreviewIndex, setActivePreviewIndex] = useState(null); // Full-screen image viewer index
  const [landmark, setLandmark] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Custom Modal States (No native Alert.alert)
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    primaryText: 'OK',
    onPrimaryPress: null,
  });

  // Real-time GPS State
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsStatus, setGpsStatus] = useState('fetching'); // 'fetching' | 'success' | 'error' | 'denied'
  const [coords, setCoords] = useState(null);
  const [detectedAddress, setDetectedAddress] = useState('');

  useEffect(() => {
    fetchRealtimeLocation();
  }, []);

  const showAlert = (type, title, message, onPrimaryPress = null, primaryText = 'OK') => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      primaryText,
      onPrimaryPress: onPrimaryPress || (() => setAlertConfig((prev) => ({ ...prev, visible: false }))),
    });
  };

  const fetchRealtimeLocation = async () => {
    setGpsLoading(true);
    setGpsStatus('fetching');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsStatus('denied');
        setDetectedAddress('Location permission denied');
        setGpsLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      setCoords({ latitude, longitude });

      const reverseList = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseList && reverseList.length > 0) {
        const item = reverseList[0];
        const parts = [
          item.street || item.name,
          item.district || item.subregion || item.neighborhood,
          item.city || item.subregion,
        ].filter(Boolean);

        const fullAddr = parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setDetectedAddress(fullAddr);
      } else {
        setDetectedAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }

      setGpsStatus('success');
    } catch (error) {
      console.warn('Real-time GPS error:', error);
      setGpsStatus('error');
      setDetectedAddress('Location detection unavailable');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleLaunchCamera = async () => {
    setPhotoPickerVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert('warning', 'Permission Required', 'Camera access is needed to capture photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.85,
        allowsEditing: false, // Upload whole image uncropped
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setPhotos((prev) => [...prev, { uri: asset.uri, base64: asset.base64 }]);
      }
    } catch (err) {
      console.warn('Camera error:', err);
    }
  };

  const handleLaunchGallery = async () => {
    setPhotoPickerVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('warning', 'Permission Required', 'Media library access is needed to select photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.85,
        allowsEditing: false, // Upload whole image uncropped
        allowsMultipleSelection: true,
        selectionLimit: 8,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newAssets = result.assets.map((a) => ({ uri: a.uri, base64: a.base64 }));
        setPhotos((prev) => [...prev, ...newAssets]);
      }
    } catch (err) {
      console.warn('Gallery error:', err);
    }
  };

  const handleSubmit = async () => {
    const finalAddress = detectedAddress.trim();
    if (!finalAddress && !landmark.trim()) {
      showAlert('warning', 'Location Required', 'Please wait for GPS to detect your location or enter a landmark description.');
      return;
    }

    setLoading(true);

    try {
      // Upload all attached photos
      const uploadedUrls = [];
      for (const item of photos) {
        const url = await uploadImageToImgBB(item);
        if (url) uploadedUrls.push(url);
      }

      const condObj = CONDITIONS.find((c) => c.id === selectedCondition) || CONDITIONS[0];
      const title = `${condObj.label} (${selectedType})`;

      const primaryPhoto =
        uploadedUrls[0] ||
        (selectedType === 'Cat'
          ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80'
          : 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80');

      const reportPayload = {
        title,
        animalType: selectedType,
        condition: condObj.label,
        urgency: condObj.urgency,
        description: description.trim() || `${selectedType} spotted at ${finalAddress}`,
        photo: primaryPhoto,
        photos: uploadedUrls.length > 0 ? uploadedUrls : [primaryPhoto],
        location: {
          latitude: coords ? coords.latitude : 14.5764,
          longitude: coords ? coords.longitude : 121.0851,
          address: finalAddress || 'Real-time GPS Location',
          landmark: landmark.trim() || 'Near detected coordinates',
        },
        reporterId: currentUser?.id || currentUser?.uid || 'u_reporter',
        reporterName: currentUser?.name || 'Community Member',
        reporterEmail: currentUser?.email || '',
      };

      addRescueReport(reportPayload);

      showAlert(
        'success',
        'Rescue Alert Broadcasted',
        'Your report, photos, and real-time GPS coordinates have been broadcasted to registered rescuers and foster volunteers in this area.',
        () => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          navigation.goBack();
        },
        'Done'
      );
    } catch (err) {
      console.error('Submit report error:', err);
      showAlert('error', 'Submission Failed', 'Unable to broadcast rescue report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* ── Top Navigation ────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: safeTop }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#473018" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Report Animal</Text>
          <Text style={styles.headerSub}>Dispatch rescue alert to nearby advocates</Text>
        </View>

        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── 1. Integrated Location Card (Single Clean Surface) ── */}
          <View style={styles.locationCard}>
            <View style={styles.locTopRow}>
              <View style={styles.gpsLiveBadge}>
                <View
                  style={[
                    styles.gpsDot,
                    gpsStatus === 'success'
                      ? styles.gpsDotGreen
                      : gpsStatus === 'fetching'
                      ? styles.gpsDotYellow
                      : styles.gpsDotRed,
                  ]}
                />
                <Text style={styles.gpsLiveText}>
                  {gpsStatus === 'fetching'
                    ? 'Detecting GPS...'
                    : gpsStatus === 'success'
                    ? 'Real-time GPS'
                    : 'Location'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.locRefreshBtn}
                onPress={fetchRealtimeLocation}
                disabled={gpsLoading}
                activeOpacity={0.7}
              >
                {gpsLoading ? (
                  <ActivityIndicator size="small" color="#2E7A99" />
                ) : (
                  <>
                    <Ionicons name="sync-outline" size={13} color="#2E7A99" />
                    <Text style={styles.locRefreshText}>Update</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.locAddressRow}>
              <Ionicons name="location-sharp" size={18} color="#D94F4F" style={{ marginRight: 6 }} />
              <Text style={styles.locAddressText} numberOfLines={2}>
                {gpsLoading ? 'Detecting current coordinates...' : detectedAddress || 'Locating...'}
              </Text>
            </View>

            {coords && (
              <Text style={styles.locCoordsText}>
                {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
              </Text>
            )}

            <View style={styles.locDivider} />

            <TextInput
              style={styles.landmarkInput}
              placeholder="Add specific landmark or spot (e.g., near gate, under tree)"
              placeholderTextColor="#947E68"
              value={landmark}
              onChangeText={setLandmark}
            />
          </View>

          {/* ── 2. Animal Type (Clean Segmented Row) ──────────── */}
          <Text style={styles.sectionHeading}>ANIMAL TYPE</Text>
          <View style={styles.typeSegment}>
            {ANIMAL_TYPES.map((type) => {
              const active = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeBtn, active && styles.typeBtnActive]}
                  onPress={() => setSelectedType(type)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.typeBtnText, active && styles.typeBtnTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── 3. Condition & Urgency (Compact 2x2 Grid) ──────── */}
          <Text style={styles.sectionHeading}>OBSERVED CONDITION</Text>
          <View style={styles.condGrid}>
            {CONDITIONS.map((cond) => {
              const active = selectedCondition === cond.id;
              return (
                <TouchableOpacity
                  key={cond.id}
                  style={[styles.condChip, active && styles.condChipActive]}
                  onPress={() => setSelectedCondition(cond.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.condDot, { backgroundColor: cond.color }]} />
                  <Text style={[styles.condChipText, active && styles.condChipTextActive]}>
                    {cond.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark-circle" size={14} color="#1E586E" style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── 4. Photo Evidence (Modern Multi-Photo Gallery) ── */}
          <View style={styles.labelRow}>
            <Text style={styles.sectionHeading}>PHOTO EVIDENCE</Text>
            <Text style={styles.optionalText}>Recommended</Text>
          </View>

          {photos.length > 0 ? (
            <View style={styles.galleryContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryScroll}
              >
                {photos.map((item, index) => (
                  <View key={index} style={styles.galleryItemWrap}>
                    <TouchableOpacity
                      style={styles.galleryThumbCard}
                      onPress={() => setActivePreviewIndex(index)}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: item.uri }} style={styles.galleryImage} resizeMode="cover" />
                      <View style={styles.viewBadge}>
                        <Ionicons name="expand" size={11} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeBadgeBtn}
                      onPress={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={11} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.galleryAddMoreCard}
                  onPress={() => setPhotoPickerVisible(true)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="add" size={22} color="#2E7A99" />
                  <Text style={styles.galleryAddMoreText}>Add More</Text>
                </TouchableOpacity>
              </ScrollView>
              <Text style={styles.galleryHintText}>
                {photos.length} {photos.length === 1 ? 'photo' : 'photos'} attached · Tap any photo to view full screen
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addPhotoBar}
              onPress={() => setPhotoPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={20} color="#2E7A99" style={{ marginRight: 8 }} />
              <Text style={styles.addPhotoText}>Attach Photos</Text>
              <Text style={styles.addPhotoSubText}>(Multiple photos allowed)</Text>
            </TouchableOpacity>
          )}

          {/* ── 5. Additional Details ──────────────────────────── */}
          <View style={styles.labelRow}>
            <Text style={styles.sectionHeading}>ADDITIONAL DETAILS</Text>
            <Text style={styles.optionalText}>Optional</Text>
          </View>

          <TextInput
            style={styles.notesArea}
            placeholder="Describe visible injuries, collar, temperament, or safety notes..."
            placeholderTextColor="#947E68"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* ── Submit Broadcast Button ───────────────────────── */}
          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#473018" />
            ) : (
              <Text style={styles.submitButtonText}>Broadcast Rescue Alert</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerCaption}>
            Your alert, photos, and GPS coordinates will be instantly dispatched to active volunteers.
          </Text>

          <View style={{ height: 36 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Custom Styled Photo Picker Bottom Sheet ───────────── */}
      <PhotoPickerModal
        visible={photoPickerVisible}
        onClose={() => setPhotoPickerVisible(false)}
        onSelectCamera={handleLaunchCamera}
        onSelectGallery={handleLaunchGallery}
        title="Attach Photos"
        subtitle="Choose how you want to add photos of the animal"
      />

      {/* ── Full-Screen Image Preview Modal (View Whole Image) ── */}
      <Modal
        visible={activePreviewIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePreviewIndex(null)}
      >
        <View style={styles.previewModalOverlay}>
          <View style={[styles.previewTopHeader, { paddingTop: safeTop }]}>
            <TouchableOpacity
              style={styles.previewHeaderBtn}
              onPress={() => setActivePreviewIndex(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.previewCounterText}>
              {activePreviewIndex !== null ? `${activePreviewIndex + 1} of ${photos.length}` : ''}
            </Text>

            <TouchableOpacity
              style={styles.previewHeaderBtn}
              onPress={() => {
                const idxToRemove = activePreviewIndex;
                setPhotos((prev) => prev.filter((_, i) => i !== idxToRemove));
                setActivePreviewIndex(null);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={22} color="#D94F4F" />
            </TouchableOpacity>
          </View>

          <View style={styles.previewImageArea}>
            {activePreviewIndex !== null && photos[activePreviewIndex] && (
              <Image
                source={{ uri: photos[activePreviewIndex].uri }}
                style={styles.previewFullImage}
                resizeMode="contain"
              />
            )}
          </View>

          {photos.length > 1 && (
            <View style={styles.previewNavRow}>
              <TouchableOpacity
                style={[styles.previewNavBtn, activePreviewIndex === 0 && styles.previewNavBtnDisabled]}
                disabled={activePreviewIndex === 0}
                onPress={() => setActivePreviewIndex((prev) => Math.max(0, prev - 1))}
              >
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.previewNavBtn,
                  activePreviewIndex === photos.length - 1 && styles.previewNavBtnDisabled,
                ]}
                disabled={activePreviewIndex === photos.length - 1}
                onPress={() => setActivePreviewIndex((prev) => Math.min(photos.length - 1, prev + 1))}
              >
                <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* ── Branded Custom Alert Modal ───────────────────────── */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        primaryText={alertConfig.primaryText}
        onPrimaryPress={alertConfig.onPrimaryPress}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF8E8',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Navigation Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FCF8E8',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#473018',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 12,
    color: '#685038',
    marginTop: 2,
  },

  // 1. Clean Integrated Location Card
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DFC8',
    padding: 14,
    marginBottom: 16,
  },
  locTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gpsLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  gpsDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  gpsDotGreen: {
    backgroundColor: '#2D9E5F',
  },
  gpsDotYellow: {
    backgroundColor: '#D97706',
  },
  gpsDotRed: {
    backgroundColor: '#D94F4F',
  },
  gpsLiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#528367',
    letterSpacing: 0.3,
  },
  locRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F0F8FB',
  },
  locRefreshText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7A99',
  },
  locAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  locAddressText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#473018',
    lineHeight: 18,
  },
  locCoordsText: {
    fontSize: 10,
    color: '#8C7D6A',
    marginLeft: 24,
    marginBottom: 8,
  },
  locDivider: {
    height: 1,
    backgroundColor: '#F4EDE0',
    marginVertical: 4,
  },
  landmarkInput: {
    paddingTop: 8,
    paddingBottom: 2,
    fontSize: 13,
    color: '#473018',
  },

  // Headings
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C7D6A',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 2,
  },
  optionalText: {
    fontSize: 11,
    color: '#947E68',
    fontWeight: '500',
  },

  // 2. Animal Type Segmented Row
  typeSegment: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DFC8',
    padding: 3,
    gap: 4,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  typeBtnActive: {
    backgroundColor: '#92CDE5',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#685038',
  },
  typeBtnTextActive: {
    fontWeight: '800',
    color: '#473018',
  },

  // 3. Condition 2x2 Grid
  condGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  condChip: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
  condChipActive: {
    borderColor: '#92CDE5',
    backgroundColor: '#F5FAFC',
    borderWidth: 1.5,
  },
  condDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 8,
  },
  condChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#685038',
  },
  condChipTextActive: {
    fontWeight: '800',
    color: '#1E586E',
  },

  // 4. Photo Evidence (Modern Attachment Bar)
  addPhotoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DFC8',
    paddingVertical: 14,
    marginBottom: 16,
  },
  addPhotoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7A99',
  },
  addPhotoSubText: {
    fontSize: 12,
    color: '#8C7D6A',
    marginLeft: 4,
  },
  // 4. Photo Evidence Gallery
  galleryContainer: {
    marginBottom: 16,
  },
  galleryScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingRight: 10,
  },
  galleryItemWrap: {
    position: 'relative',
  },
  galleryThumbCard: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DFC8',
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.sm,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  viewBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(30, 88, 110, 0.75)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#D94F4F',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  galleryAddMoreCard: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CCEAF3',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  galleryAddMoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7A99',
  },
  galleryHintText: {
    fontSize: 11,
    color: '#8C7D6A',
    marginTop: 6,
  },

  // 5. Notes
  notesArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DFC8',
    padding: 12,
    fontSize: 13,
    color: '#473018',
    minHeight: 68,
    marginBottom: 16,
  },

  // Submit Button
  submitButton: {
    backgroundColor: '#92CDE5',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
    ...SHADOWS.sm,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#473018',
  },
  footerCaption: {
    fontSize: 11,
    color: '#8C7D6A',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 8,
  },

  // Full-Screen Image Preview Modal
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 28, 0.96)',
    justifyContent: 'space-between',
  },
  previewTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  previewHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCounterText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  previewImageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  previewFullImage: {
    width: '100%',
    height: '100%',
  },
  previewNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
  },
  previewNavBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewNavBtnDisabled: {
    opacity: 0.25,
  },
});
