import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, Modal, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import StatusPill from '../../components/StatusPill';
import EmptyState from '../../components/EmptyState';

const STATUS_FILTERS = ['All', 'Available', 'Being Fostered', 'Adopted', 'Under Care'];
const STATUS_EMOJI   = { All: '🐾', Available: '✅', 'Being Fostered': '💛', Adopted: '🏠', 'Under Care': '🩺' };

export default function MyAnimalsScreen({ navigation }) {
  const { getAdvocateAnimals, returnAnimalToListings, markAnimalAdopted, updateAnimal } = useApp();
  const [filterStatus, setFilterStatus] = useState('All');
  const [actionAnimal, setActionAnimal] = useState(null); // animal for the action modal

  const animals  = getAdvocateAnimals();
  const filtered = filterStatus === 'All'
    ? animals
    : animals.filter((a) => a.status === filterStatus);

  const handleReturn = (animal) => {
    Alert.alert(
      'Return to Listings',
      `Move ${animal.name} back to the available listings? They will be visible to the community again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Return',
          onPress: () => {
            returnAnimalToListings(animal.id);
            setActionAnimal(null);
          },
        },
      ]
    );
  };

  const handleMarkAdopted = (animal) => {
    Alert.alert(
      'Mark as Adopted',
      `Confirm that ${animal.name} has been permanently adopted? This will remove them from all listings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            markAnimalAdopted(animal.id);
            setActionAnimal(null);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.brown} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>My Animals</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddAnimal', {})}
        >
          <Ionicons name="add" size={22} color={COLORS.primaryDeep} />
        </TouchableOpacity>
      </View>

      {/* Status filter */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterTab, filterStatus === s && styles.filterTabOn]}
            onPress={() => setFilterStatus(s)}
          >
            <Text style={[styles.filterText, filterStatus === s && styles.filterTextOn]}>
              {STATUS_EMOJI[s]} {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="paw-outline"
            title="No animals here"
            subtitle="Add a rescued animal to get started."
          />
        }
        renderItem={({ item }) => (
          <AnimalManageCard
            animal={item}
            onPress={() => navigation.navigate('AnimalDetail', { animalId: item.id })}
            onActions={() => setActionAnimal(item)}
          />
        )}
      />

      {/* ── Actions modal ─────────────────────────────────── */}
      <Modal visible={!!actionAnimal} animationType="slide" transparent>
        <TouchableOpacity style={styles.overlay} onPress={() => setActionAnimal(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          {actionAnimal && (
            <>
              <Text style={styles.sheetAnimal}>{actionAnimal.name}</Text>
              <Text style={styles.sheetStatus}>
                Current status: <Text style={{ fontWeight: '700' }}>{actionAnimal.status}</Text>
              </Text>

              {/* ── Being Fostered actions ─────────────── */}
              {actionAnimal.status === 'Being Fostered' && (
                <>
                  <View style={styles.fosterInfo}>
                    <Ionicons name="person-circle-outline" size={16} color={COLORS.textMuted} />
                    <Text style={styles.fosterInfoText}>
                      Currently fostered by <Text style={{ fontWeight: '700' }}>{actionAnimal.fosterName || 'someone'}</Text>
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleReturn(actionAnimal)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: COLORS.tagBg }]}>
                      <Ionicons name="arrow-undo" size={20} color={COLORS.primaryDeep} />
                    </View>
                    <View style={styles.actionText}>
                      <Text style={styles.actionTitle}>Return to Listings</Text>
                      <Text style={styles.actionDesc}>
                        Foster period ended — make {actionAnimal.name} available again for adoption or fostering.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.sheetDivider} />

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleMarkAdopted(actionAnimal)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: '#D8F0E4' }]}>
                      <Ionicons name="home" size={20} color={COLORS.success} />
                    </View>
                    <View style={styles.actionText}>
                      <Text style={[styles.actionTitle, { color: COLORS.success }]}>Mark as Adopted</Text>
                      <Text style={styles.actionDesc}>
                        The foster carer has decided to adopt {actionAnimal.name} permanently.
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}

              {/* ── Available actions ──────────────────── */}
              {actionAnimal.status === 'Available' && (
                <>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      setActionAnimal(null);
                      navigation.navigate('AnimalDetail', { animalId: actionAnimal.id });
                    }}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: COLORS.tagBg }]}>
                      <Ionicons name="eye-outline" size={20} color={COLORS.primaryDeep} />
                    </View>
                    <View style={styles.actionText}>
                      <Text style={styles.actionTitle}>View Profile</Text>
                      <Text style={styles.actionDesc}>See how {actionAnimal.name}'s listing appears to the community.</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.sheetDivider} />
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      setActionAnimal(null);
                      updateAnimal(actionAnimal.id, { status: 'Under Care' });
                    }}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: '#FEF3DC' }]}>
                      <Ionicons name="eye-off-outline" size={20} color={COLORS.warning} />
                    </View>
                    <View style={styles.actionText}>
                      <Text style={[styles.actionTitle, { color: COLORS.warning }]}>Hide from Listings</Text>
                      <Text style={styles.actionDesc}>Temporarily remove {actionAnimal.name} from the public listings.</Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}

              {/* ── Under Care actions ─────────────────── */}
              {actionAnimal.status === 'Under Care' && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    setActionAnimal(null);
                    updateAnimal(actionAnimal.id, { status: 'Available' });
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#D8F0E4' }]}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.success} />
                  </View>
                  <View style={styles.actionText}>
                    <Text style={[styles.actionTitle, { color: COLORS.success }]}>Mark as Available</Text>
                    <Text style={styles.actionDesc}>{actionAnimal.name} is ready — add them to the public listings.</Text>
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.cancelSheetBtn} onPress={() => setActionAnimal(null)}>
                <Text style={styles.cancelSheetText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

function AnimalManageCard({ animal, onPress, onActions }) {
  const isFostered = animal.status === 'Being Fostered';
  const isAdopted  = animal.status === 'Adopted';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.cardPhotoWrap}>
        {animal.photo ? (
          <Image source={{ uri: animal.photo }} style={styles.cardPhoto} resizeMode="cover" />
        ) : (
          <View style={styles.cardPhotoFallback}>
            <Ionicons name="paw-outline" size={28} color={COLORS.primaryLight} />
          </View>
        )}
        <View style={styles.cardStatusPos}>
          <StatusPill status={animal.status} />
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{animal.name}</Text>
            <Text style={styles.cardSub} numberOfLines={1}>
              {animal.species} · {animal.breed} · {animal.gender}
            </Text>
          </View>
          {/* Actions button — not shown for adopted */}
          {!isAdopted && (
            <TouchableOpacity
              style={styles.actionsBtn}
              onPress={(e) => { e.stopPropagation(); onActions(); }}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Foster carer info */}
        {isFostered && animal.fosterName && (
          <View style={styles.fosterRow}>
            <Ionicons name="heart" size={12} color="#B45309" />
            <Text style={styles.fosterRowText}>Fostered by {animal.fosterName}</Text>
          </View>
        )}

        {/* Foster duration */}
        {animal.fosterDuration && (animal.listingType === 'Foster' || animal.listingType === 'Both') && (
          <View style={styles.durationRow}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.durationText}>Suggested: {animal.fosterDuration}</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.listingTypePill}>
            <Ionicons
              name={animal.listingType === 'Adoption' ? 'home-outline' : animal.listingType === 'Foster' ? 'heart-outline' : 'paw-outline'}
              size={11}
              color={COLORS.primaryDeep}
            />
            <Text style={styles.listingTypeText}>
              {animal.listingType === 'Both' ? 'Adoption / Foster' : animal.listingType}
            </Text>
          </View>
          <Text style={styles.cardDate}>
            {new Date(animal.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg24, paddingTop: Platform.OS === 'ios' ? 52 : 28, paddingBottom: SIZES.md16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  backBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.brown },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.tagBg, alignItems: 'center', justifyContent: 'center',
  },

  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.xs4 + 2,
    paddingHorizontal: SIZES.md16, paddingVertical: SIZES.sm8 + 2,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  filterTab: {
    paddingHorizontal: SIZES.sm8 + 2, paddingVertical: SIZES.xs4 + 3,
    borderRadius: SIZES.r999, backgroundColor: COLORS.inputBg,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  filterTabOn:  { backgroundColor: COLORS.primaryDeep, borderColor: COLORS.primaryDeep },
  filterText:   { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.textSecondary },
  filterTextOn: { color: '#fff' },

  list: { padding: SIZES.md16, paddingBottom: 110 },

  // Animal card
  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.r16,
    overflow: 'hidden', marginBottom: SIZES.md16, ...SHADOWS.card,
  },
  cardPhotoWrap: { position: 'relative' },
  cardPhoto:     { width: '100%', height: 150 },
  cardPhotoFallback: {
    width: '100%', height: 100, backgroundColor: COLORS.tagBg,
    alignItems: 'center', justifyContent: 'center',
  },
  cardStatusPos: { position: 'absolute', top: SIZES.sm8, right: SIZES.sm8 },
  cardBody:      { padding: SIZES.md16 },
  cardTopRow:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.xs4 + 2 },
  cardName:      { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.brown },
  cardSub:       { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  actionsBtn:    { padding: SIZES.xs4, marginLeft: SIZES.sm8 },

  fosterRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.xs4,
    marginBottom: SIZES.xs4 + 2,
  },
  fosterRowText: { fontSize: SIZES.xs, color: '#B45309', fontWeight: '600' },
  durationRow:   { flexDirection: 'row', alignItems: 'center', gap: SIZES.xs4, marginBottom: SIZES.xs4 + 2 },
  durationText:  { fontSize: SIZES.xs, color: COLORS.textMuted },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: SIZES.xs4 + 2, borderTopWidth: 1, borderTopColor: COLORS.divider,
    marginTop: SIZES.xs4 + 2,
  },
  listingTypePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.tagBg, paddingHorizontal: SIZES.xs4 + 4,
    paddingVertical: 2, borderRadius: SIZES.r999,
  },
  listingTypeText: { fontSize: SIZES.xs, fontWeight: '700', color: COLORS.primaryDeep },
  cardDate:        { fontSize: SIZES.xs, color: COLORS.textMuted },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: SIZES.lg24, paddingBottom: 40,
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  sheetHandle: {
    width: 44, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SIZES.md16,
  },
  sheetAnimal: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.brown, marginBottom: 4 },
  sheetStatus: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: SIZES.md16 },

  fosterInfo: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.xs4 + 2,
    backgroundColor: '#FEF3DC', borderRadius: SIZES.r12,
    padding: SIZES.sm8 + 2, marginBottom: SIZES.md16,
  },
  fosterInfoText: { fontSize: SIZES.sm, color: '#92400E' },

  actionBtn: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.md16,
    paddingVertical: SIZES.sm8 + 4,
  },
  actionIcon: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  actionText:  { flex: 1, paddingTop: 2 },
  actionTitle: { fontSize: SIZES.body, fontWeight: '800', color: COLORS.brown, marginBottom: 3 },
  actionDesc:  { fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 18 },
  sheetDivider:{ height: 1, backgroundColor: COLORS.divider, marginVertical: SIZES.xs4 },

  cancelSheetBtn: {
    marginTop: SIZES.md16, paddingVertical: SIZES.sm8 + 4,
    borderRadius: SIZES.r12, borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelSheetText: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.textSecondary },
});
