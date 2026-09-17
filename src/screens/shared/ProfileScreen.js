import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image,
  ActivityIndicator, Platform, Modal, TextInput, KeyboardAvoidingView,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

export default function ProfileScreen({ navigation }) {
  const {
    currentUser, logout, updateUser,
    getUserReports, getAdvocateResponses,
    getAdvocateAnimals, getUserRequests, getAdvocateRequests, getUserDonations,
  } = useApp();

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Form states for profile modal
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editOrg, setEditOrg] = useState(currentUser?.organization || '');
  const [editLocation, setEditLocation] = useState(currentUser?.location || '');

  const isAdvocate = currentUser?.role === 'advocate';

  const stats = isAdvocate
    ? [
        { label: 'Responses', value: getAdvocateResponses().length, icon: 'shield-checkmark', color: COLORS.secondaryDark, bg: '#D8F0E4', onPress: () => navigation.navigate('Activity', { tab: 'responses' }) },
        { label: 'My Animals', value: getAdvocateAnimals().length,   icon: 'paw',              color: COLORS.primaryDeep, bg: COLORS.tagBg, onPress: () => navigation.navigate('MyAnimals') },
        { label: 'Requests',  value: getAdvocateRequests().length,  icon: 'heart',            color: '#7C3AED',          bg: '#F3EEFF', onPress: () => navigation.navigate('Activity', { tab: 'requests' }) },
      ]
    : [
        { label: 'Reports',  value: getUserReports().length,  icon: 'alert-circle', color: COLORS.danger,      bg: '#FCE8E8', onPress: () => navigation.navigate('Activity', { tab: 'reports' }) },
        { label: 'Requests', value: getUserRequests().length, icon: 'heart',        color: '#7C3AED',          bg: '#F3EEFF', onPress: () => navigation.navigate('Activity', { tab: 'requests' }) },
        { label: 'Donations',value: getUserDonations().length,icon: 'gift',         color: COLORS.secondaryDark, bg: COLORS.advocateBadge, onPress: () => navigation.navigate('Activity', { tab: 'donations' }) },
      ];

  const mainActions = [
    { icon: 'time-outline',        label: 'Activity Dashboard', screen: 'Activity',      color: COLORS.primaryDeep, desc: 'View reports, responses & requests' },
    { icon: 'chatbubbles-outline', label: 'Direct Messages',     screen: 'Messages',      color: COLORS.secondaryDark, desc: 'Chat with advocates & rescuers' },
    { icon: 'gift-outline',        label: 'Donation History',   screen: 'Activity',      color: COLORS.warning,     desc: 'Track financial contributions' },
  ];

  const roleActions = isAdvocate
    ? [
        { icon: 'paw-outline',           label: 'Manage Animals',  screen: 'MyAnimals',   color: COLORS.primaryDeep, desc: 'Post and manage adoption/foster animals' },
        { icon: 'notifications-outline', label: 'Rescue Alerts',   screen: 'RescueAlerts', color: COLORS.danger,      desc: 'Active emergency alerts in your area' },
      ]
    : [
        { icon: 'alert-circle-outline', label: 'Report Rescue',    screen: 'ReportRescue', color: COLORS.danger,      desc: 'Submit a new stray or injured animal report' },
        { icon: 'search-outline',       label: 'Adopt or Foster',  screen: 'Listings',     color: COLORS.info,        desc: 'Browse animals waiting for a home' },
      ];

  // ── Photo picker ────────────────────────────────────────────────────────
  const handleChangePhoto = () => {
    Alert.alert('Profile Photo', 'Choose an option', [
      { text: 'Take Photo',          onPress: () => pickImage('camera') },
      { text: 'Choose from Gallery', onPress: () => pickImage('gallery') },
      ...(currentUser?.avatar ? [{ text: 'Remove Photo', style: 'destructive', onPress: () => updateUser({ avatar: null }) }] : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickImage = async (source) => {
    let result;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Allow camera access to take a photo.'); return; }
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access.'); return; }
      result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    }
    if (!result.canceled) {
      setUploadingPhoto(true);
      setTimeout(() => {
        updateUser({ avatar: result.assets[0].uri });
        setUploadingPhoto(false);
      }, 600);
    }
  };

  const handleSaveProfile = () => {
    updateUser({
      name: editName.trim() || currentUser?.name,
      organization: editOrg.trim(),
      location: editLocation.trim(),
    });
    setEditModalVisible(false);
    Alert.alert('Success', 'Profile information updated!');
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of ALAGA?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'ios' ? Math.max(insets.top, 16) + 4 : (insets.top > 24 ? insets.top + 6 : 14);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero Banner Card ──────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={[styles.heroBannerBg, { height: 90 + safeTopPadding }]}>
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
          </View>

          {/* Profile Header Contents */}
          <View style={styles.profileHeaderContent}>
            {/* Avatar */}
            <TouchableOpacity style={styles.avatarContainer} onPress={handleChangePhoto} activeOpacity={0.88}>
              {uploadingPhoto ? (
                <View style={styles.avatarImg}>
                  <ActivityIndicator color={COLORS.primaryDeep} />
                </View>
              ) : currentUser?.avatar ? (
                <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitials}>
                    {currentUser?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Name & Role */}
            <Text style={styles.name}>{currentUser?.name}</Text>
            
            <View style={[styles.roleTag, { backgroundColor: isAdvocate ? COLORS.advocateBadge : COLORS.tagBg }]}>
              <Ionicons
                name={isAdvocate ? 'shield-checkmark' : 'heart'}
                size={13}
                color={isAdvocate ? COLORS.secondaryDark : COLORS.primaryDeep}
              />
              <Text style={[styles.roleText, { color: isAdvocate ? COLORS.secondaryDark : COLORS.primaryDeep }]}>
                {isAdvocate ? 'Animal Advocate' : 'Community Guardian'}
              </Text>
            </View>

            {currentUser?.organization ? (
              <Text style={styles.orgText}>{currentUser.organization}</Text>
            ) : null}

            {/* Info Chips */}
            <View style={styles.infoChipsRow}>
              {currentUser?.location ? (
                <View style={styles.infoChip}>
                  <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.infoChipText}>{currentUser.location}</Text>
                </View>
              ) : null}
              <View style={styles.infoChip}>
                <Ionicons name="mail-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.infoChipText}>{currentUser?.email}</Text>
              </View>
            </View>

            {/* Edit Profile Button */}
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => {
                setEditName(currentUser?.name || '');
                setEditOrg(currentUser?.organization || '');
                setEditLocation(currentUser?.location || '');
                setEditModalVisible(true);
              }}
            >
              <Ionicons name="create-outline" size={14} color={COLORS.brown} />
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Metric Stats Cards ────────────────────────────── */}
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <TouchableOpacity key={s.label} style={styles.statCard} onPress={s.onPress} activeOpacity={0.75}>
              <View style={[styles.statIconCircle, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={16} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Main Activity Section ──────────────────────────── */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionTitle}>Overview & Activity</Text>
        </View>

        <View style={styles.cardGroup}>
          {mainActions.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.groupItem, idx === mainActions.length - 1 && styles.groupItemLast]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.8}
            >
              <View style={[styles.itemIconWrap, { backgroundColor: item.color + '14' }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.label}</Text>
                <Text style={styles.itemDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Role Features Section ──────────────────────────── */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionTitle}>
            {isAdvocate ? 'Advocate Toolkit' : 'Community Services'}
          </Text>
        </View>

        <View style={styles.cardGroup}>
          {roleActions.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.groupItem, idx === roleActions.length - 1 && styles.groupItemLast]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.8}
            >
              <View style={[styles.itemIconWrap, { backgroundColor: item.color + '14' }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.label}</Text>
                <Text style={styles.itemDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Account Options ────────────────────────────────── */}
        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.logoutCardText}>Log Out Account</Text>
        </TouchableOpacity>

        <Text style={styles.appFooter}>ALAGA · Where every life deserves alaga · v1.0</Text>
      </ScrollView>

      {/* ── Edit Profile Modal ───────────────────────────────── */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Info</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>FULL NAME</Text>
              <TextInput
                style={styles.formInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your full name"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {isAdvocate && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>ORGANIZATION / SHELTER</Text>
                <TextInput
                  style={styles.formInput}
                  value={editOrg}
                  onChangeText={setEditOrg}
                  placeholder="e.g. PAWS Advocates / Independent Shelter"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>LOCATION</Text>
              <TextInput
                style={styles.formInput}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="e.g. Quezon City, Metro Manila"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 110 },

  // Hero Card
  heroCard: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    overflow: 'hidden', marginBottom: 14,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  heroBannerBg: {
    height: 90, backgroundColor: COLORS.primaryDeep,
    position: 'relative', overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)', top: -40, right: -20,
  },
  decorCircle2: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.08)', bottom: -20, left: 10,
  },

  profileHeaderContent: {
    alignItems: 'center', marginTop: -42, paddingBottom: SIZES.md16,
    paddingHorizontal: SIZES.lg24,
  },
  avatarContainer: { position: 'relative', marginBottom: 10 },
  avatarImg: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 4, borderColor: COLORS.surface,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.tagBg, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 30, fontWeight: '800', color: COLORS.primaryDeep },
  cameraBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.primaryDeep,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.surface,
  },

  name: { fontSize: 20, fontWeight: '800', color: COLORS.brown, marginBottom: 3 },
  roleTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: SIZES.radiusFull, marginBottom: 6,
  },
  roleText: { fontSize: 11, fontWeight: '700' },
  orgText: { fontSize: 13, color: COLORS.secondaryDark, fontWeight: '700', marginBottom: 6 },

  infoChipsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: SIZES.radiusFull, backgroundColor: COLORS.inputBg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  infoChipText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },

  editProfileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: SIZES.radiusFull, backgroundColor: COLORS.inputBg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  editProfileBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.brown },

  // Stats grid (Compact & Interactive)
  statsGrid: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: SIZES.md16, marginBottom: 14,
  },
  statCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface, borderRadius: 14,
    paddingVertical: 10, paddingHorizontal: 6,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  statIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700', marginTop: 1 },

  // Grouped cards
  sectionHeaderWrap: { paddingHorizontal: SIZES.md16, marginBottom: 6 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },

  cardGroup: {
    marginHorizontal: SIZES.md16, backgroundColor: COLORS.surface,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 14, overflow: 'hidden',
    ...SHADOWS.card,
  },
  groupItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  groupItemLast: { borderBottomWidth: 0 },
  itemIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  itemTitle: { fontSize: 14, fontWeight: '700', color: COLORS.brown },
  itemDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  // Logout card
  logoutCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: SIZES.md16, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1, borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2', marginBottom: 14,
  },
  logoutCardText: { fontSize: 14, fontWeight: '800', color: COLORS.danger },

  appFooter: { textAlign: 'center', fontSize: 11, color: COLORS.textMuted, marginBottom: 12 },

  // Edit Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SIZES.lg24, paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SIZES.md16,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SIZES.lg24,
  },
  modalTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.brown },
  modalClose: { padding: 4 },
  formGroup: { marginBottom: SIZES.md16 },
  formLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, marginBottom: 6, letterSpacing: 0.5 },
  formInput: {
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: COLORS.brown, fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: COLORS.primaryDeep, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
