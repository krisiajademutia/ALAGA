import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

export default function ProfileScreen({ navigation }) {
  const {
    currentUser, logout, updateUser,
    getUserReports, getAdvocateResponses,
    getAdvocateAnimals, getUserRequests, getAdvocateRequests,
  } = useApp();

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const isAdvocate = currentUser?.role === 'advocate';

  const stats = isAdvocate
    ? [
        { label: 'Responses', value: getAdvocateResponses().length, icon: 'shield-checkmark', color: COLORS.secondaryDark },
        { label: 'Animals',   value: getAdvocateAnimals().length,   icon: 'paw',              color: COLORS.primaryDeep },
        { label: 'Requests',  value: getAdvocateRequests().length,  icon: 'heart',            color: '#7C3AED' },
      ]
    : [
        { label: 'Reports',  value: getUserReports().length,  icon: 'alert-circle', color: COLORS.danger },
        { label: 'Requests', value: getUserRequests().length, icon: 'heart',        color: '#7C3AED' },
        { label: 'Rescued',  value: 0,                        icon: 'paw',          color: COLORS.success },
      ];

  const menuItems = [
    { icon: 'time-outline',        label: 'Activity History',  screen: 'Activity',          color: COLORS.primaryDeep },
    { icon: 'chatbubbles-outline', label: 'Messages',           screen: 'Messages',          color: COLORS.secondaryDark },
    { icon: 'heart-outline',       label: isAdvocate ? 'Adoption & Foster Requests' : 'My Requests',
                                                                screen: isAdvocate ? 'AdvocateRequests' : 'Activity', color: '#7C3AED' },
    { icon: 'gift-outline',        label: 'Donate',             screen: 'Donate',            color: COLORS.warning },
    ...(isAdvocate
      ? [
          { icon: 'paw-outline',           label: 'My Animals',    screen: 'MyAnimals',   color: COLORS.primaryDeep },
          { icon: 'notifications-outline', label: 'Rescue Alerts', screen: 'RescueAlerts', color: COLORS.danger },
        ]
      : [
          { icon: 'alert-circle-outline', label: 'Report an Animal', screen: 'ReportRescue', color: COLORS.danger },
          { icon: 'search-outline',       label: 'Browse Listings',  screen: 'Listings',     color: COLORS.info },
        ]),
  ];

  // ── Photo picker ────────────────────────────────────────────────────────
  const handleChangePhoto = () => {
    Alert.alert('Profile Photo', 'Choose an option', [
      { text: 'Take Photo',        onPress: () => pickImage('camera') },
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

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero ──────────────────────────────────────────── */}
        <View style={styles.heroBg}>
          <View style={styles.heroBlob1} />
          <View style={styles.heroBlob2} />

          {/* Avatar with edit button */}
          <TouchableOpacity style={styles.avatarWrap} onPress={handleChangePhoto} activeOpacity={0.85}>
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
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{currentUser?.name}</Text>

          {/* Role pill */}
          <View style={[styles.rolePill, { backgroundColor: isAdvocate ? COLORS.advocateBadge : COLORS.tagBg }]}>
            <Ionicons
              name={isAdvocate ? 'shield-checkmark' : 'person'}
              size={13}
              color={isAdvocate ? COLORS.secondaryDark : COLORS.primaryDeep}
            />
            <Text style={[styles.roleText, { color: isAdvocate ? COLORS.secondaryDark : COLORS.primaryDeep }]}>
              {isAdvocate ? 'Animal Advocate' : 'Community User'}
            </Text>
          </View>

          {currentUser?.organization && (
            <Text style={styles.org}>{currentUser.organization}</Text>
          )}

          <View style={styles.metaRow}>
            {currentUser?.location && (
              <View style={styles.metaChip}>
                <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{currentUser.location}</Text>
              </View>
            )}
            <View style={styles.metaChip}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText}>
                Joined {new Date(currentUser?.joinedAt).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })}
              </Text>
            </View>
          </View>

          <View style={styles.metaChip} >
            <Ionicons name="mail-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{currentUser?.email}</Text>
          </View>
        </View>

        {/* ── Stats ─────────────────────────────────────────── */}
        <View style={styles.statsCard}>
          {stats.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statItem}>
                <View style={[styles.statIconWrap, { backgroundColor: s.color + '18' }]}>
                  <Ionicons name={s.icon} size={17} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* ── Advocate animals shortcut ──────────────────────── */}
        {isAdvocate && getAdvocateAnimals().length > 0 && (
          <TouchableOpacity
            style={styles.animalsTeaser}
            onPress={() => navigation.navigate('MyAnimals')}
            activeOpacity={0.88}
          >
            <View style={styles.animalsTeaserLeft}>
              <Ionicons name="paw" size={20} color={COLORS.primaryDeep} />
              <View>
                <Text style={styles.animalsTeaserTitle}>My Animals</Text>
                <Text style={styles.animalsTeaserSub}>{getAdvocateAnimals().length} listed for adoption / foster</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}

        {/* ── Menu ──────────────────────────────────────────── */}
        <View style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={15} color={COLORS.textMuted} />
              </TouchableOpacity>
              {i < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── Logout ────────────────────────────────────────── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={19} color={COLORS.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>ALAGA · Alert. Respond. Alaga. · v1.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 60 },

  // Hero
  heroBg: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 52 : 28,
    paddingBottom: SIZES.paddingXL,
    paddingHorizontal: SIZES.paddingL,
    marginBottom: SIZES.paddingM,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.card,
  },
  heroBlob1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: COLORS.primaryLight, opacity: 0.35,
    top: -60, right: -60,
  },
  heroBlob2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: COLORS.accent, opacity: 0.2,
    bottom: -40, left: -40,
  },

  avatarWrap: { position: 'relative', marginBottom: 14, zIndex: 1 },
  avatarImg: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.tagBg,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 34, fontWeight: '800', color: COLORS.primaryDeep },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryDeep,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.surface,
  },

  name: {
    fontSize: SIZES.xlarge, fontWeight: '800',
    color: COLORS.brown, marginBottom: 8, zIndex: 1,
  },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: SIZES.radiusFull, marginBottom: 8, zIndex: 1,
  },
  roleText: { fontSize: SIZES.small, fontWeight: '700' },
  org: { fontSize: SIZES.body, color: COLORS.secondaryDark, fontWeight: '700', marginBottom: 8, zIndex: 1 },

  metaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center', zIndex: 1 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: SIZES.radiusFull, backgroundColor: COLORS.inputBg,
    marginTop: 6, zIndex: 1,
  },
  metaText: { fontSize: SIZES.small, color: COLORS.textSecondary, fontWeight: '500' },

  // Stats
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: SIZES.paddingL,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.paddingM,
    marginBottom: SIZES.paddingM,
    ...SHADOWS.card,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 5 },
  statDivider: { width: 1, backgroundColor: COLORS.divider, marginVertical: 4 },
  statIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: SIZES.xlarge, fontWeight: '800' },
  statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },

  // Animals teaser
  animalsTeaser: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: SIZES.paddingL, marginBottom: SIZES.paddingM,
    backgroundColor: COLORS.tagBg, borderRadius: SIZES.radius,
    padding: SIZES.paddingM, borderWidth: 1.5, borderColor: COLORS.primaryLight,
    ...SHADOWS.card,
  },
  animalsTeaserLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  animalsTeaserTitle: { fontSize: SIZES.body, fontWeight: '800', color: COLORS.primaryDeep },
  animalsTeaserSub: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: 2 },

  // Menu
  menuCard: {
    marginHorizontal: SIZES.paddingL,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    marginBottom: SIZES.paddingM,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: SIZES.paddingM, paddingVertical: 15,
  },
  menuIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: SIZES.body, fontWeight: '600', color: COLORS.textPrimary },
  menuDivider: { height: 1, backgroundColor: COLORS.divider, marginLeft: 64 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: SIZES.paddingL, paddingVertical: 14,
    borderRadius: SIZES.radiusLg, borderWidth: 1.5, borderColor: COLORS.danger,
    backgroundColor: '#FDE8E8', marginBottom: SIZES.paddingM,
  },
  logoutText: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.danger },

  version: { textAlign: 'center', fontSize: SIZES.xsmall, color: COLORS.textMuted, marginBottom: 8 },
});
