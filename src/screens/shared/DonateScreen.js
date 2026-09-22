import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import AlertModal from '../../components/AlertModal';
import PhotoPickerModal from '../../components/PhotoPickerModal';
import StatusPill from '../../components/StatusPill';

const PRESET_AMOUNTS = ['100', '250', '500', '1,000', '2,500'];

export default function DonateScreen({ route, navigation }) {
  const {
    animalId: initialAnimalId,
    animalName: initialAnimalName,
    advocateId: initialAdvocateId,
  } = route.params || {};

  const {
    animals,
    donations,
    currentUser,
    submitDonation,
    getUserProfile,
    startConversation,
    showAlert,
  } = useApp();

  const [selectedAnimalId, setSelectedAnimalId] = useState(
    initialAnimalId || (animals.length > 0 ? animals[0].id : null)
  );

  const selectedAnimal = useMemo(() => {
    if (selectedAnimalId) {
      const found = animals.find((a) => a.id === selectedAnimalId);
      if (found) return found;
    }
    if (initialAnimalName) {
      const found = animals.find((a) => a.name?.toLowerCase() === initialAnimalName.toLowerCase());
      if (found) return found;
    }
    return animals.length > 0 ? animals[0] : null;
  }, [selectedAnimalId, initialAnimalName, animals]);

  const targetDisplayName = selectedAnimal?.name || initialAnimalName || 'Rescue Patient';
  const targetAdvocateId = selectedAnimal?.advocateId || initialAdvocateId || null;
  const isOwner = Boolean(currentUser?.id && targetAdvocateId === currentUser.id);

  const [advocateProfile, setAdvocateProfile] = useState(null);
  const [loadingAdvocate, setLoadingAdvocate] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (targetAdvocateId) {
      setLoadingAdvocate(true);
      getUserProfile(targetAdvocateId)
        .then((profile) => {
          if (isMounted) {
            setAdvocateProfile(profile);
            setLoadingAdvocate(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoadingAdvocate(false);
        });
    } else {
      setAdvocateProfile(null);
    }
    return () => {
      isMounted = false;
    };
  }, [targetAdvocateId]);

  const [amount, setAmount] = useState('500');
  const [method, setMethod] = useState('');
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(false);

  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [recipientModalVisible, setRecipientModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    primaryText: 'OK',
    onPrimaryPress: null,
  });

  const targetDonations = useMemo(() => {
    if (!Array.isArray(donations) || !selectedAnimal) return [];
    return donations.filter(
      (d) =>
        (d.animalId && d.animalId === selectedAnimal.id) ||
        (d.animalName && d.animalName.toLowerCase() === selectedAnimal.name.toLowerCase())
    );
  }, [donations, selectedAnimal]);

  const totalRaisedForTarget = useMemo(() => {
    return targetDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [targetDonations]);

  const payoutMethodsKey = JSON.stringify(advocateProfile?.payoutMethods);
  const paymentMethods = useMemo(() => {
    const list = [];
    const pm = advocateProfile?.payoutMethods;

    if (pm) {
      if (pm.gcash?.enabled && pm.gcash?.accountNumber) {
        list.push({
          id: 'GCash',
          label: 'GCash',
          icon: 'phone-portrait-outline',
          accountName: pm.gcash.accountName || advocateProfile?.name || 'Advocate Caretaker',
          accountNumber: pm.gcash.accountNumber,
          qrPhoto: pm.gcash.qrPhoto || null,
          type: 'Mobile Wallet',
          brandColor: '#007DFE',
          brandBg: '#EBF4FF',
        });
      }

      if (pm.maya?.enabled && pm.maya?.accountNumber) {
        list.push({
          id: 'Maya',
          label: 'Maya',
          icon: 'card-outline',
          accountName: pm.maya.accountName || advocateProfile?.name || 'Advocate Caretaker',
          accountNumber: pm.maya.accountNumber,
          qrPhoto: pm.maya.qrPhoto || null,
          type: 'Mobile Wallet',
          brandColor: '#22B573',
          brandBg: '#EDF9F2',
        });
      }

      if (pm.bank?.enabled && pm.bank?.accountNumber) {
        list.push({
          id: 'Bank Transfer',
          label: 'Bank Transfer',
          icon: 'business-outline',
          bankName: pm.bank.bankName || 'Commercial Bank',
          accountName: pm.bank.accountName || advocateProfile?.name || 'Advocate Caretaker',
          accountNumber: pm.bank.accountNumber,
          qrPhoto: null,
          type: 'Bank Account',
          brandColor: '#0D3B66',
          brandBg: '#EAF0F6',
        });
      }
    }

    list.push({
      id: 'Cash',
      label: 'In-Person / Cash',
      icon: 'cash-outline',
      accountName: advocateProfile?.name || 'Caretaker / Foster Rescuer',
      accountNumber: 'Coordinate in-person handover or pet food/supplies drop-off',
      type: 'Direct Handover',
      brandColor: '#B45309',
      brandBg: '#FEF3DC',
    });

    return list;
  }, [advocateProfile?.id, advocateProfile?.name, payoutMethodsKey]);

  useEffect(() => {
    if (paymentMethods.length > 0) {
      setMethod((currentMethod) => {
        const stillValid = paymentMethods.some((m) => m.id === currentMethod);
        return stillValid ? currentMethod : paymentMethods[0].id;
      });
    }
  }, [paymentMethods]);

  const activeMethod = useMemo(() => {
    return paymentMethods.find((m) => m.id === method) || paymentMethods[0] || null;
  }, [paymentMethods, method]);

  const hasDigitalMethods = useMemo(() => {
    return paymentMethods.some((m) => m.id !== 'Cash');
  }, [paymentMethods]);

  const numericAmount = useMemo(() => {
    const clean = String(amount || '').replace(/[^0-9.]/g, '');
    return parseFloat(clean) || 0;
  }, [amount]);

  const impactDescription = useMemo(() => {
    if (numericAmount <= 0) return 'Enter an amount to see how your gift directly saves lives.';
    if (numericAmount < 250) {
      return 'Provides 2 full days of nutritious recovery meals & clean drinking water.';
    }
    if (numericAmount < 500) {
      return 'Supplies essential vitamins, deworming meds, and anti-tick/flea care.';
    }
    if (numericAmount < 1000) {
      return 'Helps the rescuer cover emergency medical care, wound treatments, and pain relief.';
    }
    if (numericAmount < 2500) {
      return 'Sponsors core 5-in-1 / 4-in-1 vaccinations and vital rabies immunization shots.';
    }
    return 'Directly finances lifesaving surgery, foster medical boarding, and ongoing physical therapy.';
  }, [numericAmount]);

  const handleCopyAccount = async (textToCopy, label) => {
    try {
      await Clipboard.setStringAsync(textToCopy);
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch (e) {
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const pickProofCamera = async () => {
    setPhotoPickerVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert({
        title: 'Camera Permission Needed',
        message: 'Please grant camera access to photograph your transfer receipt.',
        type: 'warning',
      });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setProof(result.assets[0].uri);
    }
  };

  const pickProofGallery = async () => {
    setPhotoPickerVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert({
        title: 'Gallery Permission Needed',
        message: 'Please grant photo library access to upload your transfer receipt.',
        type: 'warning',
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setProof(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (numericAmount <= 0) {
      showAlert({
        title: 'Invalid Amount',
        message: 'Please select or enter a valid donation amount greater than ₱0.',
        type: 'warning',
      });
      return;
    }

    if (activeMethod?.id !== 'Cash' && !reference.trim()) {
      showAlert({
        title: 'Reference Number Required',
        message: `Please enter the transaction reference number or last 6 digits from your ${activeMethod?.label || 'online'} payment so advocates can verify it.`,
        type: 'warning',
      });
      return;
    }

    setLoading(true);

    try {
      await submitDonation({
        animalId: selectedAnimal?.id || null,
        animalName: targetDisplayName,
        advocateId: targetAdvocateId,
        amount: numericAmount,
        amountDisplay: `₱${numericAmount.toLocaleString()}`,
        method: activeMethod?.label || 'Cash',
        referenceNumber: reference.trim().toUpperCase() || (activeMethod?.id === 'Cash' ? 'CASH-IN-PERSON' : 'PENDING-VERIFY'),
        proofPhoto: proof,
        message: message.trim(),
      });

      setLoading(false);

      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Donation Submitted! 🎉',
        message: `Thank you, ${currentUser?.name || 'kind supporter'}! Your sponsorship of ₱${numericAmount.toLocaleString()} for ${targetDisplayName} has been submitted in real time and queued for caretaker verification.`,
        primaryText: 'View Activity Dashboard',
        onPrimaryPress: () => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          navigation.navigate('Activity', { tab: 'donations' });
        },
      });
    } catch (err) {
      setLoading(false);
      showAlert({
        title: 'Submission Issue',
        message: 'We could not submit your donation at this moment. Please check your network connection and try again.',
        type: 'error',
      });
    }
  };

  const insets = useSafeAreaInsets();
  const safeTopPadding =
    Platform.OS === 'ios'
      ? Math.max(insets.top, 16) + 4
      : insets.top > 24
        ? insets.top + 6
        : 14;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      {/* ── Matched Clean Header (Matches Messages Screen Layout) ── */}
      <View style={[styles.headerWrap, { paddingTop: safeTopPadding }]}>
        <View style={styles.topRow}>
          <Text style={styles.headerTitle}>Support Animal Care</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 1. Patient Profile Header ────────────────────────── */}
        <View style={styles.heroSection}>
          <View style={styles.heroRow}>
            {selectedAnimal?.photo || selectedAnimal?.photos?.[0] ? (
              <Image
                source={{ uri: selectedAnimal.photo || selectedAnimal.photos[0] }}
                style={styles.heroAvatar}
              />
            ) : (
              <View style={styles.heroAvatarPlaceholder}>
                <Ionicons name="paw" size={28} color="#2E7A99" />
              </View>
            )}

            <View style={styles.heroTextCol}>
              <View style={styles.heroTagRow}>
                <View style={styles.heroTagBadge}>
                  <Text style={styles.heroTagText}>PATIENT SPONSORSHIP</Text>
                </View>
                {selectedAnimal?.species && (
                  <Text style={styles.heroSpeciesText}>• {selectedAnimal.species}</Text>
                )}
              </View>

              <Text style={styles.heroPatientName} numberOfLines={2}>
                {targetDisplayName}
              </Text>

              <Text style={styles.heroCaretakerText} numberOfLines={1}>
                {advocateProfile?.name
                  ? `Cared for by ${advocateProfile.name}`
                  : selectedAnimal?.advocateName
                    ? `Cared for by ${selectedAnimal.advocateName}`
                    : 'Rescue Patient Under Care'}
              </Text>
            </View>

            {animals.length > 1 && (
              <TouchableOpacity
                style={styles.switchPetBtn}
                onPress={() => setRecipientModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="swap-horizontal" size={14} color="#2E7A99" />
                <Text style={styles.switchPetText}>Switch</Text>
              </TouchableOpacity>
            )}
          </View>

          {targetDonations.length > 0 && (
            <View style={styles.inlineStatsRow}>
              <Ionicons name="heart" size={13} color="#E8622A" style={{ marginRight: 4 }} />
              <Text style={styles.inlineStatsText}>
                <Text style={styles.inlineStatsBold}>₱{totalRaisedForTarget.toLocaleString()}</Text> raised so far by {targetDonations.length} {targetDonations.length === 1 ? 'supporter' : 'supporters'}
              </Text>
            </View>
          )}
        </View>

        {/* ── 2. Amount Selector ───────────────────────────────── */}
        <View style={styles.amountSection}>
          <Text style={styles.minimalSectionLabel}>SPONSORSHIP AMOUNT (₱)</Text>

          <View style={styles.heroAmountRow}>
            <Text style={styles.heroCurrencySymbol}>₱</Text>
            <TextInput
              style={styles.heroAmountInput}
              value={amount}
              onChangeText={(val) => {
                const sanitized = val.replace(/[^0-9.]/g, '');
                setAmount(sanitized);
              }}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#BDB2A3"
            />
            {Boolean(amount) && (
              <TouchableOpacity
                onPress={() => setAmount('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearAmountBtn}
              >
                <Ionicons name="close-circle" size={18} color="#9C8D7B" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.presetChipsRow}>
            {PRESET_AMOUNTS.map((a) => {
              const cleanStr = a.replace(/,/g, '');
              const active = amount.replace(/,/g, '') === cleanStr;
              return (
                <TouchableOpacity
                  key={a}
                  style={[styles.presetChip, active && styles.presetChipActive]}
                  onPress={() => setAmount(cleanStr)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.presetChipText, active && styles.presetChipTextActive]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    ₱{a}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.impactInlineRow}>
            <Ionicons name="medkit-outline" size={15} color="#2E7A99" style={{ marginRight: 6, marginTop: 1 }} />
            <Text style={styles.impactInlineText}>{impactDescription}</Text>
          </View>
        </View>

        {/* ── 3. Notice if Digital Payouts Unconfigured ───────── */}
        {!loadingAdvocate && !hasDigitalMethods && (
          <View style={styles.unconfiguredNoticeRow}>
            <Ionicons
              name={isOwner ? 'alert-circle' : 'information-circle'}
              size={20}
              color={isOwner ? '#007DFE' : '#B45309'}
              style={{ marginRight: 8, marginTop: 2 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.unconfiguredTitle, isOwner && { color: '#0D3B66' }]}>
                {isOwner ? 'Set Up Your Payout Accounts' : 'No Digital Payment Accounts Listed'}
              </Text>
              <Text style={[styles.unconfiguredSub, isOwner && { color: '#2C4F6B' }]}>
                {isOwner
                  ? "You haven't added your GCash, Maya, or Bank account yet. Set them up in your profile so other community members can donate to help you care for this pet!"
                  : `${advocateProfile?.name || 'The caretaker'} has not yet added GCash, Maya, or Bank accounts to their profile.`}
              </Text>
              {isOwner ? (
                <TouchableOpacity
                  style={styles.setupPayoutBtn}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Profile', params: { openPayoutModal: true } })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="card-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.setupPayoutBtnText}>Set Up Payout Accounts</Text>
                </TouchableOpacity>
              ) : targetAdvocateId ? (
                <TouchableOpacity
                  style={styles.chatAdvocateInlineBtn}
                  onPress={() => {
                    const convId = startConversation(targetAdvocateId, advocateProfile?.name || 'Caretaker');
                    navigation.navigate('Chat', {
                      conversationId: convId,
                      otherName: advocateProfile?.name || 'Caretaker',
                      otherId: targetAdvocateId,
                      initialDraft: `Hi! I would love to donate ₱${numericAmount > 0 ? numericAmount.toLocaleString() : '500'} to help you care for ${targetDisplayName}. Which payment account can I transfer it to?`,
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chatbubbles" size={13} color="#2E7A99" style={{ marginRight: 4 }} />
                  <Text style={styles.chatAdvocateInlineText}>
                    Message {advocateProfile?.name ? advocateProfile.name.split(' ')[0] : 'Caretaker'} on Chat
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}

        {/* ── 4. Payment Method Options ────────────────────────── */}
        <View style={styles.methodSection}>
          <Text style={styles.minimalSectionLabel}>SELECT PAYMENT METHOD</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.methodPillsRow}
          >
            {paymentMethods.map((m) => {
              const active = activeMethod?.id === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.methodPill,
                    active && styles.methodPillActive,
                    active && { borderColor: m.brandColor },
                  ]}
                  onPress={() => setMethod(m.id)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.methodPillDot, { backgroundColor: m.brandColor }]} />
                  <Text style={[styles.methodPillText, active && styles.methodPillTextActive]}>
                    {m.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={14} color="#2E7A99" style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 5. Advocate Credentials Surface ─────────────────── */}
        {activeMethod && (
          <View style={styles.accountCredentialsSurface}>
            <View style={styles.accountCredentialsHeader}>
              <View style={styles.accountCredentialsTitleRow}>
                <Ionicons name={activeMethod.icon} size={16} color="#2E7A99" style={{ marginRight: 6 }} />
                <Text style={styles.accountCredentialsTitle}>
                  {activeMethod.id === 'Cash'
                    ? 'In-Person Coordination'
                    : `${activeMethod.label} Transfer Details`}
                </Text>
              </View>

              {activeMethod.qrPhoto && activeMethod.id !== 'Cash' && (
                <TouchableOpacity
                  style={styles.viewQrPill}
                  onPress={() => setQrModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="qr-code-outline" size={13} color="#2E7A99" style={{ marginRight: 4 }} />
                  <Text style={styles.viewQrText}>View QR Code</Text>
                </TouchableOpacity>
              )}
            </View>

            {activeMethod.bankName && (
              <View style={styles.credRow}>
                <Text style={styles.credLabel}>Bank Name</Text>
                <Text style={styles.credValue}>{activeMethod.bankName}</Text>
              </View>
            )}

            <View style={styles.credRow}>
              <Text style={styles.credLabel}>Account Name</Text>
              <Text style={styles.credValue}>{activeMethod.accountName}</Text>
            </View>

            {activeMethod.id !== 'Cash' ? (
              <View style={styles.credNumberBlock}>
                <Text style={styles.credLabel}>
                  {activeMethod.id === 'Bank Transfer' ? 'Account Number' : 'Mobile Number'}
                </Text>
                <View style={styles.credNumberRow}>
                  <Text style={styles.credNumberHighlight} selectable numberOfLines={1} ellipsizeMode="middle">
                    {activeMethod.accountNumber}
                  </Text>
                  <TouchableOpacity
                    style={[styles.copyPillBtn, copiedKey === 'number' && styles.copyPillBtnCopied]}
                    onPress={() => handleCopyAccount(activeMethod.accountNumber.replace(/\s+/g, ''), 'number')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={copiedKey === 'number' ? 'checkmark' : 'copy-outline'}
                      size={13}
                      color={copiedKey === 'number' ? '#2E7D32' : '#2E7A99'}
                    />
                    <Text style={[styles.copyPillText, copiedKey === 'number' && styles.copyPillTextCopied]}>
                      {copiedKey === 'number' ? 'Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.cashNoticeBox}>
                <Ionicons name="chatbubbles-outline" size={16} color="#B45309" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.cashNoticeText}>
                  In-person care assistance and pet food/supplies drop-offs can be coordinated directly with the caretaker via direct in-app chat.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── 6. Transaction Reference & Proof ─────────────────── */}
        {activeMethod?.id !== 'Cash' && (
          <View style={styles.fieldsSection}>
            <Text style={styles.minimalSectionLabel}>TRANSACTION REFERENCE NUMBER *</Text>
            <View style={styles.minimalInputRow}>
              <Ionicons name="receipt-outline" size={16} color="#8C7D6A" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.minimalTextInput}
                value={reference}
                onChangeText={setReference}
                placeholder="e.g. 1002 9845 2841 or last 6 digits"
                placeholderTextColor="#A89A88"
                autoCapitalize="characters"
              />
            </View>
          </View>
        )}

        <View style={styles.fieldsSection}>
          <Text style={styles.minimalSectionLabel}>ENCOURAGING NOTE FOR RESCUERS (OPTIONAL)</Text>
          <View style={[styles.minimalInputRow, { height: 68, alignItems: 'flex-start', paddingTop: 8 }]}>
            <TextInput
              style={[styles.minimalTextInput, { height: '100%', textAlignVertical: 'top' }]}
              value={message}
              onChangeText={setMessage}
              placeholder="Leave a short warm note for the rescuers or pet..."
              placeholderTextColor="#A89A88"
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        <View style={styles.fieldsSection}>
          <Text style={styles.minimalSectionLabel}>TRANSFER RECEIPT (RECOMMENDED)</Text>

          {proof ? (
            <View style={styles.proofAttachedRow}>
              <Image source={{ uri: proof }} style={styles.proofThumbnail} resizeMode="cover" />
              <View style={{ flex: 1 }}>
                <View style={styles.proofStatusRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#2E7D32" style={{ marginRight: 4 }} />
                  <Text style={styles.proofStatusText}>Screenshot Attached</Text>
                </View>
                <View style={styles.proofActionRow}>
                  <TouchableOpacity onPress={() => setPhotoPickerVisible(true)}>
                    <Text style={styles.proofChangeLink}>Change Photo</Text>
                  </TouchableOpacity>
                  <Text style={styles.proofDot}>•</Text>
                  <TouchableOpacity onPress={() => setProof(null)}>
                    <Text style={styles.proofRemoveLink}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.attachReceiptBtn}
              onPress={() => setPhotoPickerVisible(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="camera-outline" size={18} color="#2E7A99" style={{ marginRight: 8 }} />
              <Text style={styles.attachReceiptText}>Attach Screenshot / Proof of Payment</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 7. Primary Action Button ─────────────────────────── */}
        <TouchableOpacity
          style={[styles.primaryDonateBtn, loading && { opacity: 0.75 }]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.primaryDonateInner}>
              <Ionicons name="heart" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryDonateText} numberOfLines={1} ellipsizeMode="tail">
                Sponsor {targetDisplayName ? targetDisplayName.split(' ')[0] : 'Patient'} · ₱{numericAmount > 0 ? numericAmount.toLocaleString() : '0'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimerFootnote}>
          🔒 100% of your contribution directly supports this patient under advocate care.
        </Text>
      </ScrollView>

      {/* ── Patient Selector Modal ───────────────────────────── */}
      <Modal
        visible={recipientModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRecipientModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setRecipientModalVisible(false)}
        >
          <View style={styles.recipientModalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalSheetTitle}>Select Rescue Patient</Text>
              <TouchableOpacity onPress={() => setRecipientModalVisible(false)}>
                <Ionicons name="close-circle" size={22} color="#8C7D6A" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSheetSub}>
              Choose which rescued animal you want to support with medical & foster care:
            </Text>

            <ScrollView style={styles.modalAnimalList} showsVerticalScrollIndicator={false}>
              {animals.length > 0 ? (
                animals.map((a) => {
                  const isSelected = selectedAnimal?.id === a.id;
                  const photoUrl = a.photo || a.photos?.[0];
                  return (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.animalOptionRow, isSelected && styles.animalOptionRowSelected]}
                      onPress={() => {
                        setSelectedAnimalId(a.id);
                        setRecipientModalVisible(false);
                      }}
                      activeOpacity={0.75}
                    >
                      {photoUrl ? (
                        <Image source={{ uri: photoUrl }} style={styles.animalOptionThumb} />
                      ) : (
                        <View style={styles.animalOptionPlaceholder}>
                          <Ionicons name="paw" size={20} color="#2E7A99" />
                        </View>
                      )}
                      <View style={styles.animalOptionTextCol}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.animalOptionName}>{a.name}</Text>
                          {a.status && <StatusPill status={a.status} />}
                        </View>
                        <Text style={styles.animalOptionMeta}>
                          {a.species} • {a.breed || 'Rescue'} • Cared for by {a.advocateName || 'Advocate'}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color="#2E7A99" />
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyPatientsWrap}>
                  <Ionicons name="paw-outline" size={32} color="#C4B8A5" />
                  <Text style={styles.emptyPatientsText}>No rescue patients currently registered.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── QR Modal ─────────────────────────────────────────── */}
      <Modal
        visible={qrModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setQrModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setQrModalVisible(false)}
        >
          <View style={styles.qrCardModal}>
            <View style={styles.qrHeaderRow}>
              <Text style={styles.qrTitle}>{activeMethod?.label} QR Code</Text>
              <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                <Ionicons name="close" size={20} color="#473018" />
              </TouchableOpacity>
            </View>

            <Text style={styles.qrSub}>
              Scan with your {activeMethod?.label} app to transfer directly to {activeMethod?.accountName}.
            </Text>

            <View style={styles.qrPhotoFrame}>
              {activeMethod?.qrPhoto ? (
                <Image
                  source={{ uri: activeMethod.qrPhoto }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.qrNoPhotoBox}>
                  <Ionicons name="qr-code-outline" size={60} color="#C4B8A5" />
                  <Text style={styles.qrNoPhotoText}>No QR image uploaded by advocate.</Text>
                </View>
              )}
            </View>

            <View style={styles.qrAccountMeta}>
              <Text style={styles.qrAccountNameText}>{activeMethod?.accountName}</Text>
              <Text style={styles.qrAccountNumberText}>{activeMethod?.accountNumber}</Text>
            </View>

            {activeMethod?.accountNumber && activeMethod.id !== 'Cash' && (
              <TouchableOpacity
                style={styles.qrActionCopyBtn}
                onPress={() => {
                  handleCopyAccount(activeMethod.accountNumber.replace(/\s+/g, ''), 'qrNumber');
                  setQrModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="copy-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.qrActionCopyText}>Copy {activeMethod.label} Number</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Photo Picker Modal ───────────────────────────────── */}
      <PhotoPickerModal
        visible={photoPickerVisible}
        onClose={() => setPhotoPickerVisible(false)}
        onSelectCamera={pickProofCamera}
        onSelectGallery={pickProofGallery}
        title="Upload Transfer Receipt"
        subtitle="Attach screenshot of your online payment transfer"
      />

      {/* ── Alert Modal ──────────────────────────────────────── */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        primaryText={alertConfig.primaryText}
        onPrimaryPress={alertConfig.onPrimaryPress}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── Header (Matched to MessagesScreen_2.js) ─────────────
  headerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    ...FONTS.titleXl,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.brown,
    letterSpacing: -0.3,
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 48,
  },

  heroSection: {
    paddingVertical: 10,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7DA',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...SHADOWS.sm,
  },
  heroAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  heroTextCol: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  heroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  heroTagBadge: {
    backgroundColor: '#FEF3DC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  heroTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
  },
  heroSpeciesText: {
    fontSize: 11,
    color: '#8C7D6A',
    fontWeight: '600',
  },
  heroPatientName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#473018',
    lineHeight: 25,
  },
  heroCaretakerText: {
    fontSize: 12,
    color: '#8C7D6A',
    marginTop: 2,
  },
  switchPetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2D9C8',
  },
  switchPetText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2E7A99',
  },
  inlineStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EFE7DA',
  },
  inlineStatsText: {
    fontSize: 11.5,
    color: '#6E5C46',
  },
  inlineStatsBold: {
    fontWeight: '800',
    color: '#2E7A99',
  },

  amountSection: {
    marginBottom: 20,
  },
  minimalSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C7D6A',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginBottom: 12,
  },
  heroCurrencySymbol: {
    fontSize: 28,
    fontWeight: '800',
    color: '#8C7D6A',
    marginRight: 6,
  },
  heroAmountInput: {
    fontSize: 36,
    fontWeight: '800',
    color: '#473018',
    minWidth: 80,
    textAlign: 'center',
  },
  clearAmountBtn: {
    marginLeft: 6,
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 2,
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D9C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {
    backgroundColor: '#2E7A99',
    borderColor: '#2E7A99',
  },
  presetChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#473018',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  impactInlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  impactInlineText: {
    flex: 1,
    fontSize: 12,
    color: '#705E49',
    lineHeight: 16.5,
  },

  unconfiguredNoticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3DC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  unconfiguredTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#92400E',
  },
  unconfiguredSub: {
    fontSize: 11.5,
    color: '#78350F',
    lineHeight: 15,
    marginTop: 2,
    marginBottom: 6,
  },
  chatAdvocateInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F6D28B',
  },
  chatAdvocateInlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7A99',
  },

  methodSection: {
    marginBottom: 14,
  },
  methodPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 2,
  },
  methodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D9C8',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  methodPillActive: {
    backgroundColor: '#F0F8FA',
    borderWidth: 1.5,
  },
  methodPillDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  methodPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#473018',
  },
  methodPillTextActive: {
    color: '#2E7A99',
    fontWeight: '800',
  },

  accountCredentialsSurface: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAE1D1',
    marginBottom: 18,
    ...SHADOWS.sm,
  },
  accountCredentialsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE4',
    marginBottom: 10,
  },
  accountCredentialsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  accountCredentialsTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#473018',
  },
  viewQrPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexShrink: 0,
  },
  viewQrText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7A99',
  },
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  credLabel: {
    fontSize: 11.5,
    color: '#8C7D6A',
    fontWeight: '500',
    flexShrink: 0,
    marginRight: 10,
  },
  credValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12.5,
    fontWeight: '700',
    color: '#473018',
  },
  credNumberBlock: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5EFE4',
  },
  credNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  credNumberHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E7A99',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 8,
  },
  copyPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    flexShrink: 0,
  },
  copyPillBtnCopied: {
    backgroundColor: '#E8F5E9',
  },
  copyPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2E7A99',
  },
  copyPillTextCopied: {
    color: '#2E7D32',
  },
  cashNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3DC',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
  },
  cashNoticeText: {
    flex: 1,
    fontSize: 11.5,
    color: '#92400E',
    lineHeight: 16,
  },
  setupPayoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#007DFE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginTop: 6,
  },
  setupPayoutBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  fieldsSection: {
    marginBottom: 14,
  },
  minimalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D9C8',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
  },
  minimalTextInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#473018',
  },
  attachReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#92CDE5',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 12,
  },
  attachReceiptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7A99',
  },
  proofAttachedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D9C8',
    borderRadius: 14,
    padding: 8,
    gap: 10,
  },
  proofThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F0E8D6',
  },
  proofStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  proofStatusText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2E7D32',
  },
  proofActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proofChangeLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7A99',
  },
  proofDot: {
    fontSize: 11,
    color: '#8C7D6A',
  },
  proofRemoveLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D94F4F',
  },

  primaryDonateBtn: {
    backgroundColor: '#2E7A99',
    borderRadius: 22,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 16,
    ...SHADOWS.md,
  },
  primaryDonateInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryDonateText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    flexShrink: 1,
    textAlign: 'center',
  },
  disclaimerFootnote: {
    fontSize: 10.5,
    color: '#8C7D6A',
    textAlign: 'center',
    lineHeight: 15,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  recipientModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD6CA',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalSheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#473018',
  },
  modalSheetSub: {
    fontSize: 12,
    color: '#8C7D6A',
    marginTop: 2,
    marginBottom: 12,
  },
  modalAnimalList: {
    marginBottom: 24,
  },
  animalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D9C8',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  animalOptionRowSelected: {
    borderColor: '#2E7A99',
    backgroundColor: '#F0F8FA',
  },
  animalOptionThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  animalOptionPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animalOptionTextCol: {
    flex: 1,
  },
  animalOptionName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#473018',
  },
  animalOptionMeta: {
    fontSize: 11,
    color: '#8C7D6A',
    marginTop: 1,
  },
  emptyPatientsWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyPatientsText: {
    fontSize: 12,
    color: '#8C7D6A',
    marginTop: 6,
  },

  qrCardModal: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 28,
    marginVertical: 'auto',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  qrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#473018',
  },
  qrSub: {
    fontSize: 11.5,
    color: '#8C7D6A',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  qrPhotoFrame: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2D9C8',
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 6,
  },
  qrNoPhotoBox: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrNoPhotoText: {
    fontSize: 11,
    color: '#8C7D6A',
    marginTop: 8,
    textAlign: 'center',
  },
  qrAccountMeta: {
    alignItems: 'center',
    marginBottom: 12,
  },
  qrAccountNameText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#473018',
  },
  qrAccountNumberText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E7A99',
    marginTop: 2,
  },
  qrActionCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7A99',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    width: '100%',
    justifyContent: 'center',
  },
  qrActionCopyText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});