import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import StatusPill from '../../components/StatusPill';
import EmptyState from '../../components/EmptyState';

const STATUS_FILTERS = ['All', 'Available', 'Being Fostered', 'Under Care', 'Adopted'];

export default function MyAnimalsScreen({ navigation }) {
  const {
    getAdvocateAnimals,
    returnAnimalToListings,
    markAnimalAdopted,
    updateAnimal,
    rescueReports,
    showAlert,
  } = useApp();

  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionAnimal, setActionAnimal] = useState(null);

  const animals = getAdvocateAnimals();
  const filtered = animals.filter((a) => {
    if (filterStatus !== 'All' && a.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.name?.toLowerCase().includes(q) ||
        a.breed?.toLowerCase().includes(q) ||
        a.species?.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q) ||
        a.story?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleReturn = (animal) => {
    showAlert({
      title: 'Return to Listings',
      message: `Move ${animal.name} back to the available listings? They will be visible to the community again.`,
      type: 'info',
      customIcon: 'paw',
      secondaryText: 'Cancel',
      primaryText: 'Yes, Return',
      onPrimaryPress: () => {
        returnAnimalToListings(animal.id);
        setActionAnimal(null);
      },
    });
  };

  const handleMarkAdopted = (animal) => {
    showAlert({
      title: 'Mark as Adopted',
      message: `Confirm that ${animal.name} has been permanently adopted? This will remove them from all listings.`,
      type: 'warning',
      customIcon: 'paw',
      secondaryText: 'Cancel',
      primaryText: 'Confirm',
      onPrimaryPress: () => {
        markAnimalAdopted(animal.id);
        setActionAnimal(null);
      },
    });
  };

  const insets = useSafeAreaInsets();
  const safeTopPadding =
    Platform.OS === 'ios'
      ? Math.max(insets.top, 16) + 4
      : insets.top > 24
        ? insets.top + 6
        : 14;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* ── Title-Only Clean Header ─────────────────────────── */}
      <View style={[styles.header, { paddingTop: safeTopPadding }]}>
        <Text style={styles.headerTitle}>My Animals</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your animals by name, breed, or location..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#8C7D6A" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {STATUS_FILTERS.map((s) => {
            const isActive = filterStatus === s;
            return (
              <TouchableOpacity
                key={s}
                style={[
                  styles.filterChip,
                  isActive ? styles.filterChipActive : styles.filterChipInactive,
                ]}
                onPress={() => setFilterStatus(s)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive ? styles.filterChipTextActive : styles.filterChipTextInactive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── List of Animals ─────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="paw-outline"
            title="No animals found"
            subtitle={
              searchQuery
                ? 'No animals match your search query.'
                : 'Add a rescued animal to get started.'
            }
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

      {/* ── Floating Add Button ────────────────────────────── */}
      <TouchableOpacity
        style={styles.fabBtn}
        onPress={() => navigation.navigate('AddAnimal', {})}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

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

              {actionAnimal.rescueReportId &&
                (() => {
                  const rescueCase = rescueReports.find(
                    (r) => r.id === actionAnimal.rescueReportId
                  );
                  return rescueCase ? (
                    <View style={styles.rescueInfo}>
                      <Ionicons name="link" size={16} color={COLORS.primaryDeep} />
                      <View style={styles.rescueInfoText}>
                        <Text style={styles.rescueInfoTitle}>Linked to rescue case</Text>
                        <Text style={styles.rescueInfoDesc}>
                          {rescueCase.animalType} · {rescueCase.condition} ·{' '}
                          {rescueCase.location?.address || 'No location'}
                        </Text>
                      </View>
                    </View>
                  ) : null;
                })()}

              {actionAnimal.status === 'Being Fostered' && (
                <>
                  <View style={styles.fosterInfo}>
                    <Ionicons name="person-circle-outline" size={16} color={COLORS.textMuted} />
                    <Text style={styles.fosterInfoText}>
                      Currently fostered by{' '}
                      <Text style={{ fontWeight: '700' }}>
                        {actionAnimal.fosterName || 'someone'}
                      </Text>
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
                      <Text style={[styles.actionTitle, { color: COLORS.success }]}>
                        Mark as Adopted
                      </Text>
                      <Text style={styles.actionDesc}>
                        The foster carer has decided to adopt {actionAnimal.name} permanently.
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}

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
                      <Text style={styles.actionDesc}>
                        See how {actionAnimal.name}'s listing appears to the community.
                      </Text>
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
                      <Text style={[styles.actionTitle, { color: COLORS.warning }]}>
                        Hide from Listings
                      </Text>
                      <Text style={styles.actionDesc}>
                        Temporarily remove {actionAnimal.name} from the public listings.
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}

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
                    <Text style={[styles.actionTitle, { color: COLORS.success }]}>
                      Mark as Available
                    </Text>
                    <Text style={styles.actionDesc}>
                      {actionAnimal.name} is ready — add them to the public listings.
                    </Text>
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
  const isAdopted = animal.status === 'Adopted';

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
        {Boolean(animal.photos && animal.photos.length > 1) && (
          <View style={styles.photoCountBadge}>
            <Ionicons name="images" size={10} color="#fff" style={{ marginRight: 3 }} />
            <Text style={styles.photoCountText}>{animal.photos.length}</Text>
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
          {!isAdopted && (
            <TouchableOpacity
              style={styles.actionsBtn}
              onPress={(e) => {
                e.stopPropagation();
                onActions();
              }}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {isFostered && animal.fosterName && (
          <View style={styles.fosterRow}>
            <Ionicons name="heart" size={12} color="#B45309" />
            <Text style={styles.fosterRowText}>Fostered by {animal.fosterName}</Text>
          </View>
        )}

        {animal.fosterDuration &&
          (animal.listingType === 'Foster' || animal.listingType === 'Both') && (
            <View style={styles.durationRow}>
              <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.durationText}>Suggested: {animal.fosterDuration}</Text>
            </View>
          )}

        {animal.rescueReportId && (
          <View style={styles.rescueLinkRow}>
            <Ionicons name="link" size={12} color={COLORS.primaryDeep} />
            <Text style={styles.rescueLinkText}>Linked to rescue case</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.listingTypePill}>
            <Ionicons
              name={
                animal.listingType === 'Adoption'
                  ? 'home-outline'
                  : animal.listingType === 'Foster'
                    ? 'heart-outline'
                    : 'paw-outline'
              }
              size={11}
              color={COLORS.primaryDeep}
            />
            <Text style={styles.listingTypeText}>
              {animal.listingType === 'Both' ? 'Adoption / Foster' : animal.listingType}
            </Text>
          </View>
          <Text style={styles.cardDate}>
            {new Date(animal.createdAt).toLocaleDateString('en-PH', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* ── Matched Clean Header ── */
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.r24,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    paddingHorizontal: 14,
    height: 48,
    marginTop: 12,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.brown,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: SIZES.r20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  filterChipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight || '#E8DFC8',
  },
  filterChipText: {
    ...FONTS.subheading,
    fontSize: 13,
  },
  filterChipTextActive: {
    color: COLORS.primaryDeep,
  },
  filterChipTextInactive: {
    color: COLORS.textMuted,
  },

  /* ── Content & Cards ── */
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
    backgroundColor: '#FFFFFF',
  },
  fabBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
    zIndex: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.r16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight || '#E8DFC8',
    ...SHADOWS.card,
  },
  cardPhotoWrap: { position: 'relative' },
  cardPhoto: { width: '100%', height: 150 },
  cardPhotoFallback: {
    width: '100%',
    height: 100,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStatusPos: { position: 'absolute', top: SIZES.sm8, right: SIZES.sm8 },
  photoCountBadge: {
    position: 'absolute',
    bottom: SIZES.sm8,
    right: SIZES.sm8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 21, 16, 0.75)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: SIZES.r12,
  },
  photoCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  cardBody: { padding: SIZES.md16 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.xs4 + 2,
  },
  cardName: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.brown },
  cardSub: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  actionsBtn: { padding: SIZES.xs4, marginLeft: SIZES.sm8 },
  fosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs4,
    marginBottom: SIZES.xs4 + 2,
  },
  fosterRowText: { fontSize: SIZES.xs, color: '#B45309', fontWeight: '600' },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs4,
    marginBottom: SIZES.xs4 + 2,
  },
  durationText: { fontSize: SIZES.xs, color: COLORS.textMuted },
  rescueLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs4,
    marginBottom: SIZES.xs4 + 2,
  },
  rescueLinkText: { fontSize: SIZES.xs, color: COLORS.primaryDeep, fontWeight: '600' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SIZES.xs4 + 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    marginTop: SIZES.xs4 + 2,
  },
  listingTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.tagBg,
    paddingHorizontal: SIZES.xs4 + 4,
    paddingVertical: 2,
    borderRadius: SIZES.r999,
  },
  listingTypeText: { fontSize: SIZES.xs, fontWeight: '700', color: COLORS.primaryDeep },
  cardDate: { fontSize: SIZES.xs, color: COLORS.textMuted },

  /* ── Modal ── */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 31, 18, 0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 38 : 28,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderColor: '#E8DFC8',
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8DFC8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetAnimal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#473018',
    marginBottom: 3,
  },
  sheetStatus: {
    fontSize: 12,
    color: '#685038',
    marginBottom: 16,
  },
  fosterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  fosterInfoText: {
    fontSize: 12,
    color: '#92400E',
  },
  rescueInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EBF7FA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#CCEAF3',
  },
  rescueInfoText: {
    flex: 1,
  },
  rescueInfoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7A99',
    marginBottom: 2,
  },
  rescueInfoDesc: {
    fontSize: 11,
    color: '#685038',
    lineHeight: 15,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#473018',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 12,
    color: '#8C7D6A',
    lineHeight: 16,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#F4EDE0',
    marginVertical: 4,
  },
  cancelSheetBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FAF5E8',
    borderWidth: 1,
    borderColor: '#E8DFC8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSheetText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#685038',
  },
});