import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import Button from '../../components/Button';
import Input from '../../components/Input';
import PhotoPickerModal from '../../components/PhotoPickerModal';
import { ANIMAL_SPECIES, FOSTER_DURATIONS } from '../../data/mockData';
import { uploadImageToImgBB } from '../../services/storageService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GENDERS = ['Male', 'Female', 'Unknown'];
const LISTING_TYPES = [
  { key: 'Adoption', label: 'Adoption only', icon: 'home-outline', desc: 'Looking for a permanent home' },
  { key: 'Foster', label: 'Foster only', icon: 'heart-outline', desc: 'Need temporary care' },
  { key: 'Both', label: 'Open to either', icon: 'paw-outline', desc: 'Adoption or foster welcome' },
];
const READINESS = [
  { key: 'Available', label: 'Available now', icon: 'checkmark-circle', color: COLORS.success },
  { key: 'Under Care', label: 'Not ready yet', icon: 'time', color: COLORS.warning },
];

export default function AddAnimalScreen({ route, navigation }) {
  const { addAnimal, getAdvocateRescuedCases, showAlert } = useApp();
  const rescueReportId = route.params?.rescueReportId || null;
  const rescuedCases = (getAdvocateRescuedCases ? getAdvocateRescuedCases() : []) || [];

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [otherSpecies, setOtherSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [size, setSize] = useState('');
  const [gender, setGender] = useState('');
  const [color, setColor] = useState('');
  const [condition, setCondition] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [description, setDescription] = useState('');
  const [listingType, setListingType] = useState('Adoption');
  const [readiness, setReadiness] = useState('Available');
  const [fosterDuration, setFosterDuration] = useState('');
  const [vaccinated, setVaccinated] = useState(false);
  const [neutered, setNeutered] = useState(false);

  // Multi-image state: Array of { uri: string, base64?: string }
  const [photos, setPhotos] = useState([]);
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState(null);

  const [tagsText, setTagsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errors, setErrors] = useState({});

  // Rescue linking state
  const [selectedRescueId, setSelectedRescueId] = useState(rescueReportId);
  const [showRescueSelector, setShowRescueSelector] = useState(false);

  const insets = useSafeAreaInsets();
  const safeTopPadding =
    Platform.OS === 'ios'
      ? Math.max(insets.top, 16) + 4
      : insets.top > 24
        ? insets.top + 6
        : 14;

  const needsFosterDuration = listingType === 'Foster' || listingType === 'Both';

  const pickPhoto = async () => {
    setPhotoPickerVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert({
          type: 'warning',
          title: 'Permission Required',
          message: 'Please allow photo library access to select animal photos.',
        });
        return;
      }
      const r = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 8,
        quality: 0.8,
        base64: true,
      });
      if (!r.canceled && r.assets && r.assets.length > 0) {
        const newAssets = r.assets.map((a) => ({
          uri: a.uri,
          base64: a.base64 || null,
        }));
        setPhotos((prev) => [...prev, ...newAssets]);
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
      showAlert({
        type: 'error',
        title: 'Photo Selection Failed',
        message: 'Unable to select images from gallery. Please try again.',
      });
    }
  };

  const takePhoto = async () => {
    setPhotoPickerVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert({
          type: 'warning',
          title: 'Permission Required',
          message: 'Please allow camera access to take an animal photo.',
        });
        return;
      }
      const r = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });
      if (!r.canceled && r.assets && r.assets.length > 0) {
        const newAsset = {
          uri: r.assets[0].uri,
          base64: r.assets[0].base64 || null,
        };
        setPhotos((prev) => [...prev, newAsset]);
      }
    } catch (err) {
      console.warn('Camera capture error:', err);
      showAlert({
        type: 'error',
        title: 'Camera Failed',
        message: 'Unable to capture photo. Please try again.',
      });
    }
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    if (activePreviewIndex === index) {
      setActivePreviewIndex(null);
    }
  };

  const setCoverPhoto = (index) => {
    if (index === 0 || index >= photos.length) return;
    setPhotos((prev) => {
      const chosen = prev[index];
      const remaining = prev.filter((_, i) => i !== index);
      return [chosen, ...remaining];
    });
    setActivePreviewIndex(0);
  };

  const handleSelectRescue = (rescueId) => {
    setSelectedRescueId(rescueId);
    if (rescueId) {
      const c = rescuedCases.find((r) => r.id === rescueId);
      if (c) {
        if (!species && (c.animalType === 'Dog' || c.animalType === 'Cat')) {
          setSpecies(c.animalType);
        }
        if (!condition && c.condition) {
          setCondition(c.condition);
        }
        if (photos.length === 0) {
          const rescuePhotos = (c.photos && c.photos.length > 0)
            ? c.photos.map((uri) => ({ uri }))
            : (c.photo ? [{ uri: c.photo }] : []);
          if (rescuePhotos.length > 0) {
            setPhotos(rescuePhotos);
          }
        }
      }
    }
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Animal name is required.';
    if (!species) e.species = 'Select the species.';
    else if (species === 'Other' && !otherSpecies.trim()) e.species = 'Please specify the species.';
    if (!gender) e.gender = 'Select gender.';
    if (!size) e.size = 'Select size.';
    if (!description.trim()) e.desc = 'Add a description.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    setUploadStatus('Preparing upload...');

    try {
      const uploadedUrls = [];
      for (let i = 0; i < photos.length; i++) {
        const item = photos[i];
        setUploadStatus(`Uploading photo ${i + 1} of ${photos.length}...`);
        if (item.uri && (item.uri.startsWith('http://') || item.uri.startsWith('https://'))) {
          uploadedUrls.push(item.uri);
        } else {
          const cloudUrl = await uploadImageToImgBB({ uri: item.uri, base64: item.base64 });
          if (cloudUrl) uploadedUrls.push(cloudUrl);
        }
      }

      let primaryPhoto = uploadedUrls[0] || null;
      if (!primaryPhoto) {
        primaryPhoto = species === 'Cat'
          ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80'
          : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80';
        uploadedUrls.push(primaryPhoto);
      }

      const tags = tagsText.split(',').map((t) => t.trim()).filter(Boolean);
      addAnimal({
        name: name.trim(),
        species: species === 'Other' ? otherSpecies.trim() : species,
        breed: breed.trim() || 'Unknown',
        age: age.trim() || 'Unknown',
        size,
        gender,
        color: color.trim() || 'Unknown',
        condition: condition.trim() || 'Healthy',
        specialNeeds: specialNeeds.trim() || null,
        description: description.trim(),
        status: readiness,
        listingType,
        fosterDuration: needsFosterDuration ? fosterDuration || null : null,
        vaccinated,
        neutered,
        photo: primaryPhoto,
        photos: uploadedUrls,
        tags,
        rescueReportId: selectedRescueId,
      });

      setLoading(false);
      navigation.navigate('MainTabs', { screen: 'MyAnimals' });
    } catch (err) {
      setLoading(false);
      showAlert({
        title: 'Error',
        message: 'An error occurred while saving: ' + err.message,
        type: 'error',
      });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />

      {/* ── Title-Only Clean Header ─────────────────────────── */}
      <View style={[styles.header, { paddingTop: safeTopPadding }]}>
        <Text style={styles.headerTitle}>New Animal Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Photo Gallery Section (Multiple Photos) ────────── */}
        <View style={styles.photoHeaderRow}>
          <Label text="ANIMAL PHOTOS" />
          <Text style={styles.photoSubLabel}>
            {photos.length > 0 ? `${photos.length} attached` : 'Multiple photos allowed'}
          </Text>
        </View>

        <View style={styles.photoSection}>
          {photos.length > 0 ? (
            <View style={styles.galleryContainer}>
              {/* Main Cover Preview */}
              <View style={styles.coverPreviewWrap}>
                <Image source={{ uri: photos[0].uri }} style={styles.coverPreview} />
                <View style={styles.coverBadge}>
                  <Ionicons name="star" size={11} color="#fff" style={{ marginRight: 3 }} />
                  <Text style={styles.coverBadgeText}>Cover Photo</Text>
                </View>

                <View style={styles.coverActionsOverlay}>
                  <TouchableOpacity
                    style={styles.coverActionBtn}
                    onPress={() => setActivePreviewIndex(0)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="expand" size={15} color="#fff" />
                    <Text style={styles.coverActionText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.coverAddMoreBtn}
                    onPress={() => setPhotoPickerVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={15} color="#fff" />
                    <Text style={styles.coverActionText}>Add More</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Horizontal Thumbnail Strip */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbScroll}
              >
                {photos.map((item, idx) => (
                  <View key={idx} style={styles.thumbItemWrap}>
                    <TouchableOpacity
                      style={[styles.thumbCard, idx === 0 && styles.thumbCardCover]}
                      onPress={() => setActivePreviewIndex(idx)}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: item.uri }} style={styles.thumbImage} resizeMode="cover" />
                      {idx === 0 ? (
                        <View style={styles.thumbStarBadge}>
                          <Ionicons name="star" size={10} color="#fff" />
                        </View>
                      ) : (
                        <View style={styles.thumbExpandBadge}>
                          <Ionicons name="expand" size={10} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.thumbRemoveBtn}
                      onPress={() => removePhoto(idx)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Dashed Add More Button at End of Strip */}
                {photos.length < 8 && (
                  <TouchableOpacity
                    style={styles.thumbAddMoreCard}
                    onPress={() => setPhotoPickerVisible(true)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="camera-outline" size={20} color={COLORS.primaryDeep} />
                    <Text style={styles.thumbAddMoreText}>+ Add</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              <View style={styles.galleryMetaRow}>
                <Text style={styles.galleryMetaText}>
                  Tap any photo to preview or set as cover
                </Text>
                <TouchableOpacity onPress={() => setPhotos([])}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.photoEmpty}
              onPress={() => setPhotoPickerVisible(true)}
              activeOpacity={0.85}
            >
              <View style={styles.photoBtnRow}>
                <TouchableOpacity style={styles.photoCircleBtn} onPress={takePhoto}>
                  <Ionicons name="camera" size={24} color={COLORS.primaryDeep} />
                  <Text style={styles.photoCircleText}>Camera</Text>
                </TouchableOpacity>
                <View style={styles.photoDivider} />
                <TouchableOpacity style={styles.photoCircleBtn} onPress={pickPhoto}>
                  <Ionicons name="images" size={24} color={COLORS.primaryDeep} />
                  <Text style={styles.photoCircleText}>Gallery</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.photoEmptyHint}>
                Add up to 8 photos for this profile
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Link to Rescue Case ───────────────────────────── */}
        <Label text="LINK TO RESCUE CASE (OPTIONAL)" />
        <LinkToRescueSection
          rescuedCases={rescuedCases}
          selectedRescueId={selectedRescueId}
          onSelectRescue={handleSelectRescue}
          showSelector={showRescueSelector}
          onToggleSelector={setShowRescueSelector}
        />

        {/* ── Basic info ─────────────────────────────────────── */}
        <Input
          label="Animal Name"
          placeholder="e.g. Meg, Kareena, Kriska, Trisha"
          value={name}
          onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: null })); }}
          autoCapitalize="words"
          error={errors.name}
        />

        <Label text="SPECIES" error={errors.species} />
        <View style={styles.scrollRow}>
          {(ANIMAL_SPECIES || ['Dog', 'Cat', 'Other']).map((s) => (
            <Chip key={s} label={s} active={species === s}
              onPress={() => {
                setSpecies((prev) => prev === s ? '' : s);
                setErrors((e) => ({ ...e, species: null }));
              }} />
          ))}
        </View>
        {species === 'Other' && (
          <Input placeholder="Please specify species..." value={otherSpecies}
            onChangeText={(t) => { setOtherSpecies(t); setErrors((e) => ({ ...e, species: null })); }}
            autoCapitalize="words" style={{ marginBottom: SIZES.paddingM }} />
        )}

        <Input label="Breed (optional)" placeholder="e.g. Aspin, Puspin" value={breed} onChangeText={setBreed} autoCapitalize="words" />
        <Input label="Estimated Age" placeholder="e.g. 2 years, 3 months" value={age} onChangeText={setAge} />

        <Label text="GENDER" error={errors.gender} />
        <View style={styles.scrollRow}>
          {GENDERS.map((g) => (
            <Chip key={g} label={g} active={gender === g}
              onPress={() => { setGender(g); setErrors((e) => ({ ...e, gender: null })); }} />
          ))}
        </View>

        <Label text="SIZE" error={errors.size} />
        <View style={styles.scrollRow}>
          {['Small', 'Medium', 'Large'].map((sz) => (
            <Chip key={sz} label={sz} active={size === sz}
              onPress={() => { setSize(sz); setErrors((e) => ({ ...e, size: null })); }} />
          ))}
        </View>

        <Input label="Color / Markings" placeholder="e.g. Brown and white" value={color} onChangeText={setColor} autoCapitalize="words" />
        <Input label="Current Condition" placeholder="e.g. Recovering, Healthy" value={condition} onChangeText={setCondition} autoCapitalize="words" />
        <Input label="Special Needs (optional)" placeholder="e.g. Requires daily medication" value={specialNeeds} onChangeText={setSpecialNeeds} autoCapitalize="sentences" />
        <Input label="Description" placeholder="Tell adopters about this animal's personality and story..." value={description}
          onChangeText={(t) => { setDescription(t); setErrors((e) => ({ ...e, desc: null })); }}
          multiline numberOfLines={4} autoCapitalize="sentences" error={errors.desc} />
        <Input label="Tags (comma-separated)" placeholder="e.g. Friendly, Good with kids, Indoor"
          value={tagsText} onChangeText={setTagsText} autoCapitalize="words" />

        {/* ── Health ─────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Health</Text>
          <ToggleRow label="Vaccinated" icon="shield-checkmark-outline" value={vaccinated} onToggle={setVaccinated} />
          <View style={styles.divider} />
          <ToggleRow label="Neutered / Spayed" icon="medkit-outline" value={neutered} onToggle={setNeutered} />
        </View>

        {/* ── Listing type ───────────────────────────────────── */}
        <Label text="WHAT ARE YOU LOOKING FOR?" />
        {LISTING_TYPES.map((lt) => (
          <TouchableOpacity
            key={lt.key}
            style={[styles.listingCard, listingType === lt.key && styles.listingCardOn]}
            onPress={() => setListingType(lt.key)}
            activeOpacity={0.85}
          >
            <View style={[styles.listingIcon, { backgroundColor: listingType === lt.key ? COLORS.primaryDeep + '18' : COLORS.inputBg }]}>
              <Ionicons name={lt.icon} size={20} color={listingType === lt.key ? COLORS.primaryDeep : COLORS.textMuted} />
            </View>
            <View style={styles.listingTextContainer}>
              <Text style={[styles.listingLabel, listingType === lt.key && { color: COLORS.primaryDeep }]} numberOfLines={1}>
                {lt.label}
              </Text>
              <Text style={styles.listingDesc} numberOfLines={2}>
                {lt.desc}
              </Text>
            </View>
            {listingType === lt.key && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primaryDeep} style={styles.listingCheck} />
            )}
          </TouchableOpacity>
        ))}

        {/* ── Foster duration (shown when foster is possible) ── */}
        {needsFosterDuration && (
          <>
            <Label text="SUGGESTED FOSTER DURATION" />
            <View style={styles.scrollRow}>
              {(FOSTER_DURATIONS || ['1 month', '2 months', '3 months', 'Flexible']).map((d) => (
                <Chip
                  key={d} label={d}
                  active={fosterDuration === d}
                  onPress={() => setFosterDuration(d)}
                  activeColor="#D97706"
                />
              ))}
            </View>
          </>
        )}

        {/* ── Readiness ──────────────────────────────────────── */}
        <Label text="IS THIS ANIMAL READY NOW?" />
        <View style={styles.readinessRow}>
          {READINESS.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[
                styles.readinessChip,
                readiness === r.key && { borderColor: r.color, backgroundColor: r.color + '14' },
              ]}
              onPress={() => setReadiness(r.key)}
              activeOpacity={0.8}
            >
              <Ionicons name={r.icon} size={16} color={readiness === r.key ? r.color : COLORS.textMuted} />
              <Text
                style={[
                  styles.readinessText,
                  readiness === r.key && { color: r.color, fontWeight: '700' },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && Boolean(uploadStatus) && (
          <View style={styles.uploadProgressRow}>
            <ActivityIndicator size="small" color={COLORS.primaryDeep} />
            <Text style={styles.uploadProgressText}>{uploadStatus}</Text>
          </View>
        )}

        <Button
          title="Save Animal Profile"
          onPress={handleSave}
          loading={loading}
          fullWidth
          style={styles.saveBtn}
          icon={<Ionicons name="paw" size={17} color="#fff" />}
        />
      </ScrollView>

      {/* Reusable ALAGA branded photo picker */}
      <PhotoPickerModal
        visible={photoPickerVisible}
        onClose={() => setPhotoPickerVisible(false)}
        onSelectCamera={takePhoto}
        onSelectGallery={pickPhoto}
        title="Add Animal Photos"
        subtitle="Select or capture photos for this profile"
      />

      {/* Full-Screen Photo Viewer / Cover Setter Modal */}
      <Modal
        visible={activePreviewIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePreviewIndex(null)}
      >
        <View style={styles.previewModalOverlay}>
          <StatusBar style="light" />

          <View style={styles.previewModalTopBar}>
            <TouchableOpacity
              style={styles.previewModalCloseBtn}
              onPress={() => setActivePreviewIndex(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.previewModalCount}>
              {activePreviewIndex !== null ? `${activePreviewIndex + 1} of ${photos.length}` : ''}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {activePreviewIndex !== null && photos[activePreviewIndex] && (
            <View style={styles.previewModalBody}>
              <Image
                source={{ uri: photos[activePreviewIndex].uri }}
                style={styles.previewModalImage}
                resizeMode="contain"
              />
            </View>
          )}

          <View style={styles.previewModalBottomBar}>
            {activePreviewIndex !== 0 ? (
              <TouchableOpacity
                style={styles.setCoverBtn}
                onPress={() => setCoverPhoto(activePreviewIndex)}
                activeOpacity={0.8}
              >
                <Ionicons name="star-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.setCoverText}>Set as Cover Photo</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.currentCoverPill}>
                <Ionicons name="star" size={16} color="#FFD166" style={{ marginRight: 6 }} />
                <Text style={styles.currentCoverText}>Current Cover Photo</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.previewDeleteBtn}
              onPress={() => removePhoto(activePreviewIndex)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
              <Text style={styles.previewDeleteText}>Delete Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ── Small reusable bits ──────────────────────────────────────────────────────
function Label({ text, error }) {
  return (
    <Text style={lbl.text}>
      {text}
      {error ? <Text style={lbl.err}> · {error}</Text> : null}
    </Text>
  );
}

function Chip({ label, active, onPress, activeColor }) {
  const ac = activeColor || COLORS.primaryDeep;
  return (
    <TouchableOpacity
      style={[ch.base, active && { backgroundColor: ac + '18', borderColor: ac }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[ch.text, active && { color: ac, fontWeight: '700' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ToggleRow({ label, icon, value, onToggle }) {
  return (
    <View style={tr.row}>
      <Ionicons name={icon} size={17} color={value ? COLORS.secondaryDark : COLORS.textMuted} />
      <Text style={tr.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.border, true: COLORS.secondaryDark }}
        thumbColor={value ? '#fff' : COLORS.textMuted}
      />
    </View>
  );
}

const lbl = StyleSheet.create({
  text: { fontSize: SIZES.xs, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: SIZES.sm8, marginTop: SIZES.xs4 },
  err: { color: COLORS.danger },
});
const ch = StyleSheet.create({
  base: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: SIZES.r12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
    shadowOpacity: 0.05,
    elevation: 1,
  },
  text: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary },
});
const tr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm8 },
  label: { flex: 1, fontSize: SIZES.body, fontWeight: '600', color: COLORS.textPrimary },
});

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },

  // ── Matched Clean Header (Title Only) ─────────────────────
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    ...FONTS.titleXl,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.brown,
  },

  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48 },

  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  photoSubLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  photoSection: { marginBottom: SIZES.md16 },

  galleryContainer: {
    marginBottom: SIZES.xs4,
  },
  coverPreviewWrap: {
    position: 'relative',
    borderRadius: SIZES.r16,
    overflow: 'hidden',
    height: 200,
    backgroundColor: '#000',
    marginBottom: 10,
    ...SHADOWS.md,
  },
  coverPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 21, 16, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  coverBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  coverActionsOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  coverActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(26, 21, 16, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  coverAddMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryDeep,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  coverActionText: {
    fontSize: SIZES.xs,
    fontWeight: '700',
    color: '#fff',
  },

  thumbScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingRight: 10,
  },
  thumbItemWrap: {
    position: 'relative',
  },
  thumbCard: {
    width: 74,
    height: 74,
    borderRadius: SIZES.r12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.sm,
  },
  thumbCardCover: {
    borderColor: COLORS.primaryDeep,
    borderWidth: 2,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbStarBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: COLORS.primaryDeep,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbExpandBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemoveBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.danger,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    elevation: 3,
  },
  thumbAddMoreCard: {
    width: 74,
    height: 74,
    borderRadius: SIZES.r12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.primaryDeep + '66',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  thumbAddMoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },

  galleryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  galleryMetaText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  clearAllText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '700',
  },

  photoEmpty: {
    height: 135,
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.r16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    marginBottom: SIZES.sm8,
  },
  photoBtnRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  photoCircleBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: SIZES.paddingM },
  photoCircleText: { fontSize: SIZES.small, fontWeight: '700', color: COLORS.textSecondary, marginTop: 6 },
  photoDivider: { width: 1.5, height: '55%', backgroundColor: COLORS.border },
  photoEmptyHint: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 },

  scrollRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SIZES.paddingM, marginTop: 4 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.r16,
    padding: SIZES.md16,
    marginBottom: SIZES.md16,
    borderWidth: 1,
    borderColor: COLORS.borderLight || '#E8DFC8',
    ...SHADOWS.card,
  },
  cardTitle: { fontSize: SIZES.body, fontWeight: '800', color: COLORS.brown, marginBottom: SIZES.sm8 },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SIZES.sm8 + 2 },

  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.r16,
    padding: SIZES.md16,
    marginBottom: SIZES.sm8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  listingCardOn: { borderColor: COLORS.primaryDeep, backgroundColor: COLORS.tagBg },
  listingIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  listingTextContainer: { flex: 1, marginRight: 6 },
  listingLabel: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.textPrimary },
  listingDesc: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2, lineHeight: 16 },
  listingCheck: { flexShrink: 0 },

  readinessRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SIZES.paddingM,
    marginTop: 4,
  },
  readinessChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: SIZES.r12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.card,
    shadowOpacity: 0.05,
    elevation: 1,
  },
  readinessText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },

  uploadProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 10,
  },
  uploadProgressText: {
    fontSize: SIZES.xs,
    color: COLORS.primaryDeep,
    fontWeight: '600',
  },

  saveBtn: { marginTop: SIZES.sm8 },

  rescueSection: { marginBottom: SIZES.md16 },
  rescueEmpty: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SIZES.sm8,
    backgroundColor: '#FBF8F2',
    borderRadius: SIZES.r12,
    padding: SIZES.md16,
  },
  rescueEmptyText: { flex: 1, fontSize: SIZES.sm, color: COLORS.textMuted, lineHeight: 19 },

  rescueLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.r16,
    padding: SIZES.md16,
    borderWidth: 1,
    borderColor: COLORS.borderLight || '#E8DFC8',
    ...SHADOWS.card,
  },
  rescueLinkLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 6,
  },
  rescueLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.tagBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rescueLinkTextContainer: {
    flex: 1,
  },
  rescueLinkTitle: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.brown, marginBottom: 2 },
  rescueLinkSub: { fontSize: SIZES.xs, color: COLORS.textSecondary, lineHeight: 16 },

  rescueSelected: {
    backgroundColor: '#D8F0E4',
    borderRadius: SIZES.r16,
    padding: SIZES.md16,
    borderWidth: 1,
    borderColor: '#A8D8BC',
  },
  rescueSelectedTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: SIZES.md16,
  },
  rescueIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  rescueSelectedInfo: { flex: 1, marginRight: 4 },
  rescueSelectedTitle: { fontSize: SIZES.body, fontWeight: '800', color: COLORS.success, marginBottom: 2 },
  rescueSelectedSub: { fontSize: SIZES.xs, color: '#2D6B3F', marginBottom: 2, lineHeight: 16 },
  rescueSelectedReporter: { fontSize: SIZES.xs, color: '#2D6B3F', fontStyle: 'italic' },
  rescueActions: { flexDirection: 'row', gap: SIZES.sm8 },
  rescueChangeBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: SIZES.r12,
    paddingVertical: SIZES.sm8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A8D8BC',
  },
  rescueChangeBtnText: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.success },
  rescueUnlinkBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: SIZES.r12,
    paddingVertical: SIZES.sm8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A8D8BC',
  },
  rescueUnlinkBtnText: { fontSize: SIZES.sm, fontWeight: '700', color: '#2D6B3F' },

  rescueSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.r16,
    borderWidth: 1,
    borderColor: COLORS.borderLight || '#E8DFC8',
    ...SHADOWS.card,
  },
  rescueSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  rescueSelectorTitle: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.brown },
  rescueSelectorCancel: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.primaryDeep },

  rescueOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.md16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  rescueOptionLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 8 },
  rescueOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D8F0E4',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rescueOptionInfo: { flex: 1, marginRight: 6 },
  rescueOptionTitle: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.brown, marginBottom: 2 },
  rescueOptionSub: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginBottom: 2, lineHeight: 16 },
  rescueOptionDate: { fontSize: SIZES.xs, color: COLORS.textMuted },

  previewModalOverlay: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'space-between',
  },
  previewModalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  previewModalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewModalCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  previewModalBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  previewModalImage: {
    width: '100%',
    height: '80%',
  },
  previewModalBottomBar: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    gap: 12,
  },
  setCoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDeep,
    paddingVertical: 14,
    borderRadius: SIZES.r14,
  },
  setCoverText: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: '#fff',
  },
  currentCoverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    borderRadius: SIZES.r14,
  },
  currentCoverText: {
    fontSize: SIZES.sm,
    fontWeight: '700',
    color: '#FFD166',
  },
  previewDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217, 79, 79, 0.2)',
    borderWidth: 1,
    borderColor: '#D94F4F',
    paddingVertical: 14,
    borderRadius: SIZES.r14,
    gap: 6,
  },
  previewDeleteText: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: '#FF6B6B',
  },
});

function LinkToRescueSection({ rescuedCases, selectedRescueId, onSelectRescue, showSelector, onToggleSelector }) {
  const selectedCase = rescuedCases.find((r) => r.id === selectedRescueId);

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (rescuedCases.length === 0) {
    return (
      <View style={styles.rescueSection}>
        <View style={styles.rescueEmpty}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.textMuted} />
          <Text style={styles.rescueEmptyText}>
            No rescued cases available. This animal profile will not be linked to a rescue case.
          </Text>
        </View>
      </View>
    );
  }

  if (selectedCase) {
    return (
      <View style={styles.rescueSection}>
        <View style={styles.rescueSelected}>
          <View style={styles.rescueSelectedTop}>
            <View style={styles.rescueIcon}>
              <Ionicons name="link" size={16} color="#fff" />
            </View>
            <View style={styles.rescueSelectedInfo}>
              <Text style={styles.rescueSelectedTitle} numberOfLines={1}>
                {selectedCase.animalType} · {selectedCase.condition}
              </Text>
              <Text style={styles.rescueSelectedSub} numberOfLines={2}>
                {selectedCase.location?.address || 'No location'} · {formatDate(selectedCase.updatedAt || selectedCase.createdAt)}
              </Text>
              <Text style={styles.rescueSelectedReporter} numberOfLines={1}>
                Reported by: {selectedCase.reporterName || 'Anonymous'}
              </Text>
            </View>
          </View>
          <View style={styles.rescueActions}>
            <TouchableOpacity
              style={styles.rescueChangeBtn}
              onPress={() => onToggleSelector(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.rescueChangeBtnText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rescueUnlinkBtn}
              onPress={() => onSelectRescue(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.rescueUnlinkBtnText}>Unlink</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (showSelector) {
    return (
      <View style={styles.rescueSection}>
        <View style={styles.rescueSelector}>
          <View style={styles.rescueSelectorHeader}>
            <Text style={styles.rescueSelectorTitle}>Choose a rescue case:</Text>
            <TouchableOpacity onPress={() => onToggleSelector(false)}>
              <Text style={styles.rescueSelectorCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
          {(rescuedCases || []).map((rescue) => (
            <TouchableOpacity
              key={rescue.id}
              style={styles.rescueOption}
              onPress={() => {
                onSelectRescue(rescue.id);
                onToggleSelector(false);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.rescueOptionLeft}>
                <View style={styles.rescueOptionIcon}>
                  <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
                </View>
                <View style={styles.rescueOptionInfo}>
                  <Text style={styles.rescueOptionTitle} numberOfLines={1}>
                    {rescue.animalType} · {rescue.condition}
                  </Text>
                  <Text style={styles.rescueOptionSub} numberOfLines={2}>
                    {rescue.location?.address || 'No location'}
                  </Text>
                  <Text style={styles.rescueOptionDate} numberOfLines={1}>
                    Rescued: {formatDate(rescue.updatedAt || rescue.createdAt)}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.rescueSection}>
      <TouchableOpacity
        style={styles.rescueLink}
        onPress={() => onToggleSelector(true)}
        activeOpacity={0.8}
      >
        <View style={styles.rescueLinkLeft}>
          <View style={styles.rescueLinkIcon}>
            <Ionicons name="link-outline" size={20} color={COLORS.primaryDeep} />
          </View>
          <View style={styles.rescueLinkTextContainer}>
            <Text style={styles.rescueLinkTitle} numberOfLines={1}>Link to rescue case</Text>
            <Text style={styles.rescueLinkSub} numberOfLines={2}>
              Connect this profile to a rescue you completed ({(rescuedCases || []).length} available)
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );
}