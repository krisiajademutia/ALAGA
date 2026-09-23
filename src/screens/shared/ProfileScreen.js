import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Switch,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import AlertModal from '../../components/AlertModal';
import PhotoPickerModal from '../../components/PhotoPickerModal';
import Avatar from '../../components/Avatar';
import { uploadImageToImgBB } from '../../services/storageService';

export default function ProfileScreen({ route, navigation }) {
  const {
    currentUser,
    logout,
    updateUser,
    getUserReports,
    getAdvocateResponses,
    getAdvocateAnimals,
    getUserRequests,
    getAdvocateRequests,
    getUserDonations,
  } = useApp();

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [viewAvatarVisible, setViewAvatarVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    primaryText: 'OK',
    onPrimaryPress: null,
    secondaryText: null,
    onSecondaryPress: null,
  });

  // Form states for profile modal
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editOrg, setEditOrg] = useState(currentUser?.organization || '');
  const [editLocation, setEditLocation] = useState(currentUser?.location || '');

  // Payout & Donation Accounts modal states
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);

  const [gcashEnabled, setGcashEnabled] = useState(false);
  const [gcashName, setGcashName] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');
  const [gcashQr, setGcashQr] = useState(null);

  const [mayaEnabled, setMayaEnabled] = useState(false);
  const [mayaName, setMayaName] = useState('');
  const [mayaNumber, setMayaNumber] = useState('');
  const [mayaQr, setMayaQr] = useState(null);

  const [bankEnabled, setBankEnabled] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  // Auto-open payout modal if requested via navigation (e.g. from DonateScreen)
  React.useEffect(() => {
    if (route?.params?.openPayoutModal) {
      setPayoutModalVisible(true);
    }
  }, [route?.params?.openPayoutModal]);

  // Load payout methods when currentUser changes
  React.useEffect(() => {
    if (currentUser?.payoutMethods) {
      const pm = currentUser.payoutMethods;
      if (pm.gcash) {
        setGcashEnabled(pm.gcash.enabled ?? Boolean(pm.gcash.accountNumber));
        setGcashName(pm.gcash.accountName || '');
        setGcashNumber(pm.gcash.accountNumber || '');
        setGcashQr(pm.gcash.qrPhoto || null);
      }
      if (pm.maya) {
        setMayaEnabled(pm.maya.enabled ?? Boolean(pm.maya.accountNumber));
        setMayaName(pm.maya.accountName || '');
        setMayaNumber(pm.maya.accountNumber || '');
        setMayaQr(pm.maya.qrPhoto || null);
      }
      if (pm.bank) {
        setBankEnabled(pm.bank.enabled ?? Boolean(pm.bank.accountNumber));
        setBankName(pm.bank.bankName || '');
        setBankAccountName(pm.bank.accountName || '');
        setBankAccountNumber(pm.bank.accountNumber || '');
      }
    }
  }, [currentUser]);

  const handlePickQr = async (target) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('warning', 'Permission Required', 'Please grant photo library access to upload your payment QR code.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.85,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        if (target === 'gcash') setGcashQr(result.assets[0].uri);
        if (target === 'maya') setMayaQr(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('[ProfileScreen] Pick QR error:', e);
    }
  };

  const handleSavePayoutMethods = async () => {
    setSavingPayout(true);
    try {
      let uploadedGcashQr = gcashQr;
      if (gcashQr && typeof gcashQr === 'string' && !gcashQr.startsWith('http') && !gcashQr.startsWith('data:')) {
        const url = await uploadImageToImgBB(gcashQr);
        if (url) uploadedGcashQr = url;
      }

      let uploadedMayaQr = mayaQr;
      if (mayaQr && typeof mayaQr === 'string' && !mayaQr.startsWith('http') && !mayaQr.startsWith('data:')) {
        const url = await uploadImageToImgBB(mayaQr);
        if (url) uploadedMayaQr = url;
      }

      const payoutMethods = {
        gcash: {
          enabled: gcashEnabled,
          accountName: gcashName.trim(),
          accountNumber: gcashNumber.trim(),
          qrPhoto: uploadedGcashQr,
        },
        maya: {
          enabled: mayaEnabled,
          accountName: mayaName.trim(),
          accountNumber: mayaNumber.trim(),
          qrPhoto: uploadedMayaQr,
        },
        bank: {
          enabled: bankEnabled,
          bankName: bankName.trim(),
          accountName: bankAccountName.trim(),
          accountNumber: bankAccountNumber.trim(),
        },
      };

      await updateUser({ payoutMethods });
      setSavingPayout(false);
      setPayoutModalVisible(false);
      showAlert(
        'success',
        'Accounts Saved',
        'Your donation & payout methods have been updated in real time. Community members will now see your verified payment details and QR code when donating to your animals.'
      );
    } catch (err) {
      setSavingPayout(false);
      showAlert('error', 'Save Failed', 'Could not save payment accounts. Please check your network and try again.');
    }
  };

  const showAlert = (type, title, message, onPrimary = null, primaryText = 'OK', secondaryText = null, onSecondary = null) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      primaryText,
      onPrimaryPress: onPrimary || (() => setAlertConfig((prev) => ({ ...prev, visible: false }))),
      secondaryText,
      onSecondaryPress: onSecondary,
    });
  };

  const isAdvocate = currentUser?.role === 'advocate';

  const stats = isAdvocate
    ? [
        {
          label: 'Responses',
          value: getAdvocateResponses().length,
          onPress: () => navigation.navigate('Activity', { tab: 'responses' }),
        },
        {
          label: 'My Animals',
          value: getAdvocateAnimals().length,
          onPress: () => navigation.navigate('MyAnimals'),
        },
        {
          label: 'Requests',
          value: getAdvocateRequests().length,
          onPress: () => navigation.navigate('Activity', { tab: 'requests' }),
        },
      ]
    : [
        {
          label: 'Reports',
          value: getUserReports().length,
          onPress: () => navigation.navigate('Activity', { tab: 'reports' }),
        },
        {
          label: 'Requests',
          value: getUserRequests().length,
          onPress: () => navigation.navigate('Activity', { tab: 'requests' }),
        },
        {
          label: 'Donations',
          value: getUserDonations().length,
          onPress: () => navigation.navigate('Activity', { tab: 'donations' }),
        },
      ];

  const menuItems = [
    {
      icon: 'time-outline',
      label: 'Activity Dashboard',
      desc: 'Track your reports, requests & responses',
      screen: 'Activity',
      color: '#2E7A99',
      bg: '#DDF1F8',
    },
    {
      icon: 'chatbubbles-outline',
      label: 'Direct Messages',
      desc: 'Chat with advocates, rescuers & shelters',
      screen: 'Messages',
      color: '#306B4D',
      bg: '#EBF4EF',
    },
    {
      icon: 'card-outline',
      label: 'Donation & Payout Accounts',
      desc: 'Set up your GCash, Maya, Bank & QR code to receive support',
      onPress: () => setPayoutModalVisible(true),
      color: '#007DFE',
      bg: '#EBF4FF',
    },
    {
      icon: 'gift-outline',
      label: 'Donations & Support',
      desc: 'View your verified contributions',
      screen: 'Activity',
      params: { tab: 'donations' },
      color: '#B45309',
      bg: '#FEF3DC',
    },
    ...(isAdvocate
      ? [
          {
            icon: 'paw-outline',
            label: 'Manage Animals',
            desc: 'Post & update adoption listings',
            screen: 'MyAnimals',
            color: '#2E7A99',
            bg: '#DDF1F8',
          },
          {
            icon: 'heart-outline',
            label: 'Adoption & Foster Requests',
            desc: 'Review, approve & coordinate pet requests',
            screen: 'Activity',
            params: { tab: 'requests' },
            color: '#B45309',
            bg: '#FEF3DC',
          },
          {
            icon: 'notifications-outline',
            label: 'Rescue Alerts Hub',
            desc: 'Emergency reports in your area',
            screen: 'RescueAlerts',
            color: '#D94F4F',
            bg: '#FCE8E8',
          },
          {
            icon: 'person-outline',
            label: 'Preview Public Profile',
            desc: 'See how community members view your profile & rescues',
            screen: 'PublicProfile',
            params: {
              userId: currentUser?.id || currentUser?.uid,
              advocateId: currentUser?.id || currentUser?.uid,
            },
            color: '#306B4D',
            bg: '#EBF4EF',
          },
        ]
      : [
          {
            icon: 'alert-circle-outline',
            label: 'Report an Animal in Need',
            desc: 'Submit a new rescue report',
            screen: 'ReportRescue',
            color: '#D94F4F',
            bg: '#FCE8E8',
          },
          {
            icon: 'search-outline',
            label: 'Adopt or Foster',
            desc: 'Browse animals waiting for a home',
            screen: 'Listings',
            color: '#2E7A99',
            bg: '#DDF1F8',
          },
          {
            icon: 'person-outline',
            label: 'Preview Public Profile',
            desc: 'See how your profile & reports appear to others',
            screen: 'PublicProfile',
            params: {
              userId: currentUser?.id || currentUser?.uid,
              advocateId: currentUser?.id || currentUser?.uid,
            },
            color: '#306B4D',
            bg: '#EBF4EF',
          },
        ]),
  ];

  const pickImage = async (source) => {
    setPhotoPickerVisible(false);
    let result;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert('warning', 'Permission Needed', 'Allow camera access to take a photo.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.85,
        base64: true,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('warning', 'Permission Needed', 'Allow photo library access.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.85,
        base64: true,
      });
    }
    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      setUploadingPhoto(true);
      try {
        const cloudUrl = await uploadImageToImgBB({ uri: asset.uri, base64: asset.base64 });
        const finalUrl = cloudUrl || (asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null);
        if (finalUrl) {
          await updateUser({ avatar: finalUrl, photoURL: finalUrl });
          showAlert('success', 'Profile Photo Updated', 'Your profile picture has been updated.');
        } else {
          showAlert('error', 'Upload Error', 'Could not upload photo. Please check your network connection.');
        }
      } catch (err) {
        console.error('Avatar upload error:', err);
        const fallbackUrl = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null;
        if (fallbackUrl) {
          await updateUser({ avatar: fallbackUrl, photoURL: fallbackUrl });
        } else {
          showAlert('error', 'Upload Error', 'Could not upload photo: ' + (err?.message || 'Network error'));
        }
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleChangePhoto = () => {
    setPhotoPickerVisible(true);
  };

  const handleSaveProfile = () => {
    updateUser({
      name: editName.trim() || currentUser?.name,
      organization: editOrg.trim(),
      location: editLocation.trim(),
    });
    setEditModalVisible(false);
    showAlert('success', 'Profile Updated', 'Your profile details have been saved.');
  };

  const handleLogout = () => {
    showAlert(
      'warning',
      'Log Out',
      'Are you sure you want to log out of your ALAGA account?',
      () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        logout();
      },
      'Log Out',
      'Cancel',
      () => setAlertConfig((prev) => ({ ...prev, visible: false }))
    );
  };

  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'ios' ? Math.max(insets.top, 16) + 4 : (insets.top > 24 ? insets.top + 6 : 14);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* ── Seamless Organic Header ───────────────────────── */}
        <View style={[styles.profileHeader, { paddingTop: safeTopPadding }]}>
          
          {/* Avatar with Camera Badge */}
          <TouchableOpacity style={styles.avatarWrap} onPress={handleChangePhoto} activeOpacity={0.85}>
            {uploadingPhoto ? (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <ActivityIndicator color="#2E7A99" />
              </View>
            ) : (
              <Avatar
                name={currentUser?.name || 'Community Member'}
                uri={currentUser?.avatar}
                userId={currentUser?.id}
                size={86}
                style={styles.avatar}
              />
            )}
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera" size={13} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* User Name */}
          <Text style={styles.userName}>{currentUser?.name || 'Kareena Jane'}</Text>

          {/* Role Pill */}
          <View style={[styles.rolePill, { backgroundColor: isAdvocate ? '#B8D3C3' : '#B8E4E5' }]}>
            <Ionicons
              name={isAdvocate ? 'shield-checkmark' : 'heart'}
              size={12}
              color="#473018"
            />
            <Text style={styles.rolePillText}>
              {isAdvocate ? 'Verified Animal Advocate' : 'Community Rescuer'}
            </Text>
          </View>

          {/* Org & Location Info */}
          {currentUser?.organization ? (
            <Text style={styles.userOrg}>{currentUser.organization}</Text>
          ) : null}

          <View style={styles.metaRow}>
            {currentUser?.location ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={13} color="#8C7D6A" style={{ flexShrink: 0 }} />
                <Text style={styles.metaText} numberOfLines={1}>{currentUser.location}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Ionicons name="mail-outline" size={13} color="#8C7D6A" style={{ flexShrink: 0 }} />
              <Text style={styles.metaText} numberOfLines={1}>{currentUser?.email}</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              setEditName(currentUser?.name || '');
              setEditOrg(currentUser?.organization || '');
              setEditLocation(currentUser?.location || '');
              setEditModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={14} color="#473018" />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ── Single Unified Stats Bar ──────────────────────── */}
        <View style={styles.statsCard}>
          {stats.map((s, idx) => (
            <React.Fragment key={s.label}>
              {idx > 0 && <View style={styles.statsDivider} />}
              <TouchableOpacity style={styles.statCol} onPress={s.onPress} activeOpacity={0.7}>
                <Text style={styles.statNum}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* ── Unified Clean Menu List ───────────────────────── */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuRow, idx === menuItems.length - 1 && styles.menuRowLast]}
              onPress={() => (item.onPress ? item.onPress() : navigation.navigate(item.screen, item.params))}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.label}</Text>
                <Text style={styles.menuSubtitle}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#947E68" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Clean Logout Action ───────────────────────────── */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color="#D94F4F" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>ALAGA · Where every life deserves alaga · v1.0</Text>
      </ScrollView>

      {/* ── Edit Profile Modal Sheet ─────────────────────────── */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#8C7D6A" />
              </TouchableOpacity>
            </View>

            <View style={styles.formItem}>
              <Text style={styles.formLabel}>FULL NAME</Text>
              <TextInput
                style={styles.formTextInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your full name"
                placeholderTextColor="#947E68"
              />
            </View>

            {isAdvocate && (
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>ORGANIZATION / SHELTER</Text>
                <TextInput
                  style={styles.formTextInput}
                  value={editOrg}
                  onChangeText={setEditOrg}
                  placeholder="e.g. PAWS Advocates / Independent Shelter"
                  placeholderTextColor="#947E68"
                />
              </View>
            )}

            <View style={styles.formItem}>
              <Text style={styles.formLabel}>LOCATION / CITY</Text>
              <TextInput
                style={styles.formTextInput}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="e.g. Quezon City, Metro Manila"
                placeholderTextColor="#947E68"
              />
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveProfile} activeOpacity={0.85}>
              <Text style={styles.modalSaveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Branded Photo Picker Modal ───────────────────────── */}
      <PhotoPickerModal
        visible={photoPickerVisible}
        onClose={() => setPhotoPickerVisible(false)}
        onSelectCamera={() => pickImage('camera')}
        onSelectGallery={() => pickImage('gallery')}
        onViewPhoto={() => {
          setPhotoPickerVisible(false);
          setViewAvatarVisible(true);
        }}
        hasExistingPhoto={Boolean(currentUser?.avatar)}
        onRemovePhoto={() => {
          setPhotoPickerVisible(false);
          updateUser({ avatar: null });
        }}
        title="Profile Photo"
        subtitle="Choose an image for your profile"
      />

      {/* ── Full-Screen Avatar Viewer Modal ─────────────────── */}
      <Modal
        visible={viewAvatarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewAvatarVisible(false)}
      >
        <View style={styles.previewModalOverlay}>
          <View style={[styles.previewTopHeader, { paddingTop: safeTopPadding }]}>
            <TouchableOpacity
              style={styles.previewHeaderBtn}
              onPress={() => setViewAvatarVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.previewCounterText}>Profile Photo</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.previewImageArea}>
            {currentUser?.avatar && (
              <Image
                source={{ uri: currentUser.avatar }}
                style={styles.previewFullImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ── Donation & Payout Accounts Modal Sheet ───────────── */}
      <Modal
        visible={payoutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPayoutModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Donation & Payout Accounts</Text>
                <Text style={styles.payoutModalSub}>
                  Set up where community supporters can transfer funds directly to you when donating.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPayoutModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#8C7D6A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {/* ── GCASH SECTION ───────────────────────── */}
              <View style={styles.payoutSectionCard}>
                <View style={styles.payoutSectionHeader}>
                  <View style={styles.payoutSectionTitleRow}>
                    <View style={[styles.methodDot, { backgroundColor: '#007DFE' }]} />
                    <Text style={styles.payoutSectionTitle}>GCash Account</Text>
                  </View>
                  <Switch
                    value={gcashEnabled}
                    onValueChange={setGcashEnabled}
                    trackColor={{ false: '#E8DFC8', true: '#007DFE' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {gcashEnabled && (
                  <View style={styles.payoutFieldsWrap}>
                    <Text style={styles.formLabel}>GCASH ACCOUNT NAME</Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={gcashName}
                      onChangeText={setGcashName}
                      placeholder="e.g. Maria Santos"
                      placeholderTextColor="#947E68"
                    />

                    <Text style={[styles.formLabel, { marginTop: 10 }]}>GCASH MOBILE NUMBER</Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={gcashNumber}
                      onChangeText={setGcashNumber}
                      placeholder="e.g. 0917 123 4567"
                      placeholderTextColor="#947E68"
                      keyboardType="phone-pad"
                    />

                    <Text style={[styles.formLabel, { marginTop: 10 }]}>GCASH QR CODE</Text>
                    {gcashQr ? (
                      <View style={styles.qrPreviewWrap}>
                        <Image source={{ uri: gcashQr }} style={styles.qrThumbImage} resizeMode="contain" />
                        <View style={styles.qrPreviewMeta}>
                          <Text style={styles.qrAttachedText}>QR Code Attached</Text>
                          <View style={styles.qrBtnRow}>
                            <TouchableOpacity onPress={() => handlePickQr('gcash')}>
                              <Text style={styles.qrChangeBtnText}>Change Photo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setGcashQr(null)}>
                              <Text style={styles.qrRemoveBtnText}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.uploadQrBox}
                        onPress={() => handlePickQr('gcash')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="qr-code-outline" size={20} color="#007DFE" style={{ marginRight: 6 }} />
                        <Text style={styles.uploadQrText}>Upload GCash QR Screenshot</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* ── MAYA SECTION ────────────────────────── */}
              <View style={styles.payoutSectionCard}>
                <View style={styles.payoutSectionHeader}>
                  <View style={styles.payoutSectionTitleRow}>
                    <View style={[styles.methodDot, { backgroundColor: '#22B573' }]} />
                    <Text style={styles.payoutSectionTitle}>Maya Account</Text>
                  </View>
                  <Switch
                    value={mayaEnabled}
                    onValueChange={setMayaEnabled}
                    trackColor={{ false: '#E8DFC8', true: '#22B573' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {mayaEnabled && (
                  <View style={styles.payoutFieldsWrap}>
                    <Text style={styles.formLabel}>MAYA ACCOUNT NAME</Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={mayaName}
                      onChangeText={setMayaName}
                      placeholder="e.g. Maria Santos"
                      placeholderTextColor="#947E68"
                    />

                    <Text style={[styles.formLabel, { marginTop: 10 }]}>MAYA MOBILE NUMBER</Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={mayaNumber}
                      onChangeText={setMayaNumber}
                      placeholder="e.g. 0917 123 4567"
                      placeholderTextColor="#947E68"
                      keyboardType="phone-pad"
                    />

                    <Text style={[styles.formLabel, { marginTop: 10 }]}>MAYA QR CODE</Text>
                    {mayaQr ? (
                      <View style={styles.qrPreviewWrap}>
                        <Image source={{ uri: mayaQr }} style={styles.qrThumbImage} resizeMode="contain" />
                        <View style={styles.qrPreviewMeta}>
                          <Text style={styles.qrAttachedText}>QR Code Attached</Text>
                          <View style={styles.qrBtnRow}>
                            <TouchableOpacity onPress={() => handlePickQr('maya')}>
                              <Text style={styles.qrChangeBtnText}>Change Photo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setMayaQr(null)}>
                              <Text style={styles.qrRemoveBtnText}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.uploadQrBox}
                        onPress={() => handlePickQr('maya')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="qr-code-outline" size={20} color="#22B573" style={{ marginRight: 6 }} />
                        <Text style={[styles.uploadQrText, { color: '#22B573' }]}>Upload Maya QR Screenshot</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* ── BANK TRANSFER SECTION ───────────────── */}
              <View style={styles.payoutSectionCard}>
                <View style={styles.payoutSectionHeader}>
                  <View style={styles.payoutSectionTitleRow}>
                    <View style={[styles.methodDot, { backgroundColor: '#0D3B66' }]} />
                    <Text style={styles.payoutSectionTitle}>Bank Account Transfer</Text>
                  </View>
                  <Switch
                    value={bankEnabled}
                    onValueChange={setBankEnabled}
                    trackColor={{ false: '#E8DFC8', true: '#0D3B66' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {bankEnabled && (
                  <View style={styles.payoutFieldsWrap}>
                    <Text style={styles.formLabel}>BANK NAME</Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={bankName}
                      onChangeText={setBankName}
                      placeholder="e.g. BDO Unibank / BPI / UnionBank"
                      placeholderTextColor="#947E68"
                    />

                    <Text style={[styles.formLabel, { marginTop: 10 }]}>ACCOUNT HOLDER NAME</Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={bankAccountName}
                      onChangeText={setBankAccountName}
                      placeholder="e.g. Maria Santos"
                      placeholderTextColor="#947E68"
                    />

                    <Text style={[styles.formLabel, { marginTop: 10 }]}>ACCOUNT NUMBER</Text>
                    <TextInput
                      style={styles.formTextInput}
                      value={bankAccountNumber}
                      onChangeText={setBankAccountNumber}
                      placeholder="e.g. 0012 3456 7890"
                      placeholderTextColor="#947E68"
                      keyboardType="number-pad"
                    />
                  </View>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalSaveBtn, savingPayout && { opacity: 0.7 }]}
              onPress={handleSavePayoutMethods}
              disabled={savingPayout}
              activeOpacity={0.85}
            >
              {savingPayout ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Save Payout Accounts</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Branded Alert Modal ──────────────────────────────── */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        primaryText={alertConfig.primaryText}
        onPrimaryPress={alertConfig.onPrimaryPress}
        secondaryText={alertConfig.secondaryText}
        onSecondaryPress={alertConfig.onSecondaryPress}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    paddingBottom: 110,
  },

  // ── Seamless Organic Header ───────────────────────────
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
    marginTop: 6,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#EBF4EF',
    shadowColor: '#473018',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2E7A99',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#473018',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },
  rolePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  userOrg: {
    fontSize: 13,
    color: '#306B4D',
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#685038',
    fontFamily: 'PlusJakartaSans_500Medium',
  },

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8DEC5',
    shadowColor: '#473018',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // ── Unified Single Stats Card ─────────────────────────
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E8DEC5',
    marginBottom: 16,
    shadowColor: '#473018',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  statLabel: {
    fontSize: 11.5,
    color: '#8C7D6A',
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#F4EDE0',
    alignSelf: 'center',
  },

  // ── Clean Unified Menu List ───────────────────────────
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8DEC5',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#473018',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F4EDE0',
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  menuSubtitle: {
    fontSize: 11.5,
    color: '#8C7D6A',
    marginTop: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
  },

  // ── Clean Logout ──────────────────────────────────────
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D94F4F',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#947E68',
    marginBottom: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
  },

  // ── Modal Sheet ───────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 31, 18, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
    borderTopWidth: 1,
    borderColor: '#E8DFC8',
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8DFC8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  modalCloseBtn: {
    padding: 4,
  },
  formItem: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C7D6A',
    marginBottom: 6,
    letterSpacing: 0.6,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  formTextInput: {
    backgroundColor: '#FFFDF6',
    borderWidth: 1,
    borderColor: '#E8DFC8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: '#473018',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  modalSaveBtn: {
    backgroundColor: '#92CDE5',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...SHADOWS.sm,
  },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // ── Payout Modal Styles ──────────────────────────────────
  payoutModalSub: {
    fontSize: 12,
    color: '#8C7D6A',
    marginTop: 2,
    lineHeight: 16,
  },
  payoutSectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DFC8',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  payoutSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payoutSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  payoutSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  payoutFieldsWrap: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0E8D6',
  },
  uploadQrBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FBFD',
    borderWidth: 1.5,
    borderColor: '#92CDE5',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
  },
  uploadQrText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007DFE',
  },
  qrPreviewWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F6EE',
    borderWidth: 1,
    borderColor: '#E8DFC8',
    borderRadius: 12,
    padding: 10,
    gap: 12,
  },
  qrThumbImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  qrPreviewMeta: {
    flex: 1,
  },
  qrAttachedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  qrBtnRow: {
    flexDirection: 'row',
    gap: 14,
  },
  qrChangeBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2E7A99',
  },
  qrRemoveBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#D94F4F',
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
    fontFamily: 'PlusJakartaSans_700Bold',
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
});
