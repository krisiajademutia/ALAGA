import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { ANIMAL_SPECIES, FOSTER_DURATIONS } from '../../data/mockData';

const GENDERS       = ['Male', 'Female', 'Unknown'];
const LISTING_TYPES = [
  { key: 'Adoption', label: 'Adoption only',  icon: 'home-outline',  desc: 'Looking for a permanent home' },
  { key: 'Foster',   label: 'Foster only',    icon: 'heart-outline', desc: 'Need temporary care' },
  { key: 'Both',     label: 'Open to either', icon: 'paw-outline',   desc: 'Adoption or foster welcome' },
];
const READINESS = [
  { key: 'Available',   label: 'Available now',   icon: 'checkmark-circle', color: COLORS.success },
  { key: 'Under Care',  label: 'Not ready yet',   icon: 'time',             color: COLORS.warning },
];

export default function AddAnimalScreen({ route, navigation }) {
  const { addAnimal } = useApp();
  const rescueReportId = route.params?.rescueReportId || null;

  const [name, setName]               = useState('');
  const [species, setSpecies]         = useState('');
  const [breed, setBreed]             = useState('');
  const [age, setAge]                 = useState('');
  const [gender, setGender]           = useState('');
  const [color, setColor]             = useState('');
  const [condition, setCondition]     = useState('');
  const [description, setDescription] = useState('');
  const [listingType, setListingType] = useState('Adoption');
  const [readiness, setReadiness]     = useState('Available');
  const [fosterDuration, setFosterDuration] = useState('');
  const [vaccinated, setVaccinated]   = useState(false);
  const [neutered, setNeutered]       = useState(false);
  const [photo, setPhoto]             = useState(null);
  const [tagsText, setTagsText]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState({});

  const needsFosterDuration = listingType === 'Foster' || listingType === 'Both';

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7 });
    if (!r.canceled) setPhoto(r.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7 });
    if (!r.canceled) setPhoto(r.assets[0].uri);
  };

  const validate = () => {
    const e = {};
    if (!name.trim())        e.name    = 'Animal name is required.';
    if (!species)            e.species = 'Select the species.';
    if (!gender)             e.gender  = 'Select gender.';
    if (!description.trim()) e.desc    = 'Add a description.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = () => {
    if (!validate()) return;
    setLoading(true);
    const tags = tagsText.split(',').map((t) => t.trim()).filter(Boolean);
    setTimeout(() => {
      addAnimal({
        name: name.trim(),
        species,
        breed:    breed.trim()    || 'Unknown',
        age:      age.trim()      || 'Unknown',
        gender,
        color:    color.trim()    || 'Unknown',
        condition:condition.trim()|| 'Healthy',
        description: description.trim(),
        status: readiness,
        listingType,
        fosterDuration: needsFosterDuration ? fosterDuration || null : null,
        vaccinated,
        neutered,
        photo,
        tags,
        rescueReportId,
      });
      setLoading(false);
      Alert.alert(
        'Animal Profile Created! 🐾',
        `${name} has been added as "${readiness}" — ${
          listingType === 'Adoption' ? 'open for adoption' :
          listingType === 'Foster'   ? 'open for fostering' : 'open for adoption or fostering'
        }.`,
        [{ text: 'View My Animals', onPress: () => navigation.navigate('MyAnimals') }]
      );
    }, 800);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />

      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.brown} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>New Animal Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Photo ─────────────────────────────────────────── */}
        <View style={styles.photoSection}>
          {photo ? (
            <View style={styles.photoPreviewWrap}>
              <Image source={{ uri: photo }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.removePhoto} onPress={() => setPhoto(null)}>
                <Ionicons name="close-circle" size={24} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoEmpty}>
              <Ionicons name="camera-outline" size={30} color={COLORS.textMuted} />
              <Text style={styles.photoHint}>Add a photo</Text>
            </View>
          )}
          <View style={styles.photoBtns}>
            <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
              <Ionicons name="camera" size={18} color={COLORS.primaryDeep} />
              <Text style={styles.photoBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
              <Ionicons name="image" size={18} color={COLORS.primaryDeep} />
              <Text style={styles.photoBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Basic info ─────────────────────────────────────── */}
        <Input
          label="Animal Name"
          placeholder="e.g. Bantay, Mimi"
          value={name}
          onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: null })); }}
          autoCapitalize="words"
          error={errors.name}
        />

        <Label text="SPECIES" error={errors.species} />
        <View style={styles.chipRow}>
          {ANIMAL_SPECIES.map((s) => (
            <Chip key={s} label={s} active={species === s}
              onPress={() => { setSpecies(s); setErrors((e) => ({ ...e, species: null })); }} />
          ))}
        </View>

        <Input label="Breed (optional)" placeholder="e.g. Aspin, Puspin" value={breed} onChangeText={setBreed} autoCapitalize="words" />
        <Input label="Estimated Age"   placeholder="e.g. ~2 years, 3 months" value={age} onChangeText={setAge} />

        <Label text="GENDER" error={errors.gender} />
        <View style={styles.chipRow}>
          {GENDERS.map((g) => (
            <Chip key={g} label={g} active={gender === g}
              onPress={() => { setGender(g); setErrors((e) => ({ ...e, gender: null })); }} />
          ))}
        </View>

        <Input label="Color / Markings"  placeholder="e.g. Brown and white"  value={color}     onChangeText={setColor}     autoCapitalize="words" />
        <Input label="Current Condition" placeholder="e.g. Recovering, Healthy" value={condition} onChangeText={setCondition} autoCapitalize="words" />
        <Input label="Description" placeholder="Tell adopters about this animal's personality and story..." value={description}
          onChangeText={(t) => { setDescription(t); setErrors((e) => ({ ...e, desc: null })); }}
          multiline numberOfLines={4} autoCapitalize="sentences" error={errors.desc} />
        <Input label="Tags (comma-separated)" placeholder="e.g. Friendly, Good with kids, Indoor"
          value={tagsText} onChangeText={setTagsText} autoCapitalize="words" />

        {/* ── Health ─────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Health</Text>
          <ToggleRow label="Vaccinated"     icon="shield-checkmark-outline" value={vaccinated} onToggle={setVaccinated} />
          <View style={styles.divider} />
          <ToggleRow label="Neutered / Spayed" icon="medkit-outline"       value={neutered}   onToggle={setNeutered} />
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
            <View style={{ flex: 1 }}>
              <Text style={[styles.listingLabel, listingType === lt.key && { color: COLORS.primaryDeep }]}>{lt.label}</Text>
              <Text style={styles.listingDesc}>{lt.desc}</Text>
            </View>
            {listingType === lt.key && <Ionicons name="checkmark-circle" size={20} color={COLORS.primaryDeep} />}
          </TouchableOpacity>
        ))}

        {/* ── Foster duration (shown when foster is possible) ── */}
        {needsFosterDuration && (
          <>
            <Label text="SUGGESTED FOSTER DURATION" />
            <View style={styles.chipRow}>
              {FOSTER_DURATIONS.map((d) => (
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
        <View style={styles.chipRow}>
          {READINESS.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[styles.readinessChip, readiness === r.key && { borderColor: r.color, backgroundColor: r.color + '14' }]}
              onPress={() => setReadiness(r.key)}
            >
              <Ionicons name={r.icon} size={14} color={readiness === r.key ? r.color : COLORS.textMuted} />
              <Text style={[styles.readinessText, readiness === r.key && { color: r.color, fontWeight: '700' }]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Save Animal Profile"
          onPress={handleSave}
          loading={loading}
          fullWidth
          style={styles.saveBtn}
          icon={<Ionicons name="paw" size={17} color="#fff" />}
        />
      </ScrollView>
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
  err:  { color: COLORS.danger },
});
const ch = StyleSheet.create({
  base: { paddingHorizontal: SIZES.sm8 + 4, paddingVertical: SIZES.xs4 + 4, borderRadius: SIZES.r999, backgroundColor: COLORS.inputBg, borderWidth: 1.5, borderColor: COLORS.border },
  text: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary },
});
const tr = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm8 },
  label: { flex: 1, fontSize: SIZES.body, fontWeight: '600', color: COLORS.textPrimary },
});

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg24, paddingTop: Platform.OS === 'ios' ? 52 : 28, paddingBottom: SIZES.md16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navTitle:{ fontSize: SIZES.lg, fontWeight: '700', color: COLORS.brown },
  scroll:  { paddingHorizontal: SIZES.lg24, paddingTop: SIZES.md16, paddingBottom: 48 },

  photoSection: { marginBottom: SIZES.md16 },
  photoPreviewWrap: { position: 'relative', borderRadius: SIZES.r16, overflow: 'hidden', marginBottom: SIZES.sm8 },
  photoPreview: { width: '100%', height: 200, resizeMode: 'cover' },
  removePhoto: { position: 'absolute', top: SIZES.sm8, right: SIZES.sm8 },
  photoEmpty: {
    height: 140, backgroundColor: COLORS.inputBg, borderRadius: SIZES.r16,
    alignItems: 'center', justifyContent: 'center', gap: SIZES.xs4,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.border,
    marginBottom: SIZES.sm8,
  },
  photoHint: { fontSize: SIZES.sm, color: COLORS.textMuted },
  photoBtns: { flexDirection: 'row', gap: SIZES.sm8 },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SIZES.xs4 + 2, paddingVertical: SIZES.sm8 + 2,
    borderRadius: SIZES.r12, backgroundColor: COLORS.tagBg,
    borderWidth: 1.5, borderColor: COLORS.primaryLight,
  },
  photoBtnText: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.primaryDeep },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.xs4 + 2, marginBottom: SIZES.md16 },

  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.r16,
    padding: SIZES.md16, marginBottom: SIZES.md16, ...SHADOWS.card,
  },
  cardTitle: { fontSize: SIZES.body, fontWeight: '800', color: COLORS.brown, marginBottom: SIZES.sm8 },
  divider:   { height: 1, backgroundColor: COLORS.divider, marginVertical: SIZES.sm8 + 2 },

  listingCard: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.md16,
    backgroundColor: COLORS.surface, borderRadius: SIZES.r16,
    padding: SIZES.md16, marginBottom: SIZES.sm8,
    borderWidth: 1.5, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  listingCardOn:  { borderColor: COLORS.primaryDeep, backgroundColor: COLORS.tagBg },
  listingIcon:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  listingLabel:   { fontSize: SIZES.body, fontWeight: '700', color: COLORS.textPrimary },
  listingDesc:    { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 },

  readinessChip: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.xs4 + 2,
    paddingHorizontal: SIZES.sm8 + 4, paddingVertical: SIZES.xs4 + 4,
    borderRadius: SIZES.r999, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  readinessText: { fontSize: SIZES.sm, color: COLORS.textMuted },

  saveBtn: { marginTop: SIZES.sm8 },
});
