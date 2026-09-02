import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import AnimalCard from '../../components/AnimalCard';
import EmptyState from '../../components/EmptyState';
import StatusPill from '../../components/StatusPill';

export default function PublicProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const { users, animals, rescueReports, currentUser, startConversation, getAnimalsByAdvocate } = useApp();

  const user = users.find((u) => u.id === userId);
  if (!user) return null;

  const isAdvocate  = user.role === 'advocate';
  const isOwnProfile = currentUser?.id === userId;

  const userAnimals   = getAnimalsByAdvocate(userId);
  const listedAnimals = userAnimals.filter(
    (a) => a.status === 'Available'
  );
  const userReports   = rescueReports.filter((r) => r.responderId === userId && r.status === 'Rescued');

  const handleMessage = () => {
    const convId = startConversation(
      userId,
      user.name,
      `Hi ${user.name}! I found your profile on ALAGA.`
    );
    navigation.navigate('Chat', { conversationId: convId, otherName: user.name });
  };

  // Pair animals for 2-col grid
  const rows = [];
  for (let i = 0; i < listedAnimals.length; i += 2) {
    rows.push([listedAnimals[i], listedAnimals[i + 1] || null]);
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* ── Navbar ──────────────────────────────────────────── */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.brown} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero card ──────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.blob1} />
          <View style={styles.blob2} />

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>
                  {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{user.name}</Text>

          {/* Role pill */}
          <View style={[
            styles.rolePill,
            { backgroundColor: isAdvocate ? COLORS.advocateBadge : COLORS.tagBg },
          ]}>
            <Ionicons
              name={isAdvocate ? 'shield-checkmark' : 'person'}
              size={13}
              color={isAdvocate ? COLORS.secondaryDark : COLORS.primaryDeep}
            />
            <Text style={[
              styles.roleText,
              { color: isAdvocate ? COLORS.secondaryDark : COLORS.primaryDeep },
            ]}>
              {isAdvocate ? 'Animal Advocate' : 'Community User'}
            </Text>
          </View>

          {user.organization && (
            <Text style={styles.org}>{user.organization}</Text>
          )}

          {/* Location / join date */}
          <View style={styles.metaRow}>
            {user.location ? (
              <View style={styles.metaChip}>
                <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{user.location}</Text>
              </View>
            ) : null}
            <View style={styles.metaChip}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText}>
                Since {new Date(user.joinedAt).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })}
              </Text>
            </View>
          </View>

          {/* Action buttons — only shown to other users */}
          {!isOwnProfile && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.msgBtn} onPress={handleMessage} activeOpacity={0.85}>
                <Ionicons name="chatbubble-ellipses" size={17} color="#fff" />
                <Text style={styles.msgBtnText}>Message</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Stats ─────────────────────────────────────────── */}
        <View style={styles.statsCard}>
          {isAdvocate ? (
            <>
              <StatItem icon="paw" label="Animals" value={userAnimals.length} color={COLORS.primaryDeep} />
              <View style={styles.statDiv} />
              <StatItem icon="checkmark-circle" label="Rescued" value={userReports.length} color={COLORS.success} />
              <View style={styles.statDiv} />
              <StatItem icon="heart" label="Listed" value={listedAnimals.length} color="#7C3AED" />
            </>
          ) : (
            <>
              <StatItem
                icon="alert-circle"
                label="Reports"
                value={rescueReports.filter((r) => r.reporterId === userId).length}
                color={COLORS.danger}
              />
              <View style={styles.statDiv} />
              <StatItem icon="people" label="Community" value={1} color={COLORS.primaryDeep} />
              <View style={styles.statDiv} />
              <StatItem icon="star" label="Contributor" value={'✓'} color={COLORS.warning} />
            </>
          )}
        </View>

        {/* ── Animal listings (advocate only) ───────────────── */}
        {isAdvocate && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {listedAnimals.length > 0
                  ? `Animals for Adoption / Foster (${listedAnimals.length})`
                  : 'No Animals Listed Yet'}
              </Text>
            </View>

            {listedAnimals.length === 0 ? (
              <EmptyState
                icon="paw-outline"
                title="No listings"
                subtitle={`${user.name} has no animals listed for adoption or foster right now.`}
                style={styles.empty}
              />
            ) : (
              rows.map((row, i) => (
                <View key={i} style={styles.gridRow}>
                  <AnimalCard
                    animal={row[0]}
                    horizontal
                    style={styles.gridCard}
                    onPress={() => navigation.navigate('AnimalDetail', { animalId: row[0].id })}
                  />
                  {row[1] ? (
                    <AnimalCard
                      animal={row[1]}
                      horizontal
                      style={styles.gridCard}
                      onPress={() => navigation.navigate('AnimalDetail', { animalId: row[1].id })}
                    />
                  ) : (
                    <View style={styles.gridCard} />
                  )}
                </View>
              ))
            )}

            {/* All animals (including under care) */}
            {userAnimals.filter((a) => a.status === 'Under Care').length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Under Care</Text>
                </View>
                {userAnimals
                  .filter((a) => a.status === 'Under Care')
                  .map((animal) => (
                    <AnimalCard
                      key={animal.id}
                      animal={animal}
                      onPress={() => navigation.navigate('AnimalDetail', { animalId: animal.id })}
                    />
                  ))}
              </>
            )}
          </>
        )}

        {/* ── Recent rescue activity (community user) ────────── */}
        {!isAdvocate && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rescue Reports Filed</Text>
            </View>
            {rescueReports.filter((r) => r.reporterId === userId).length === 0 ? (
              <EmptyState
                icon="alert-circle-outline"
                title="No reports yet"
                style={styles.empty}
              />
            ) : (
              rescueReports
                .filter((r) => r.reporterId === userId)
                .slice(0, 5)
                .map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={styles.reportRow}
                    onPress={() => navigation.navigate('ReportDetail', { reportId: r.id })}
                    activeOpacity={0.85}
                  >
                    <View style={styles.reportIcon}>
                      <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
                    </View>
                    <View style={styles.reportInfo}>
                      <Text style={styles.reportTitle}>{r.animalType} · {r.condition}</Text>
                      <Text style={styles.reportAddr} numberOfLines={1}>{r.location?.address}</Text>
                    </View>
                    <StatusPill status={r.status} />
                  </TouchableOpacity>
                ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatItem({ icon, label, value, color }) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.paddingL, paddingTop: Platform.OS === 'ios' ? 52 : 28, paddingBottom: SIZES.paddingM,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: SIZES.large, fontWeight: '700', color: COLORS.brown },

  scroll: { paddingBottom: 80 },

  // Hero
  heroCard: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    paddingTop: SIZES.paddingXL,
    paddingBottom: SIZES.paddingXL,
    paddingHorizontal: SIZES.paddingL,
    marginBottom: SIZES.paddingM,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.card,
  },
  blob1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: COLORS.primaryLight, opacity: 0.3,
    top: -60, right: -60,
  },
  blob2: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    backgroundColor: COLORS.accent, opacity: 0.2,
    bottom: -40, left: -30,
  },

  avatarWrap: { marginBottom: 14, zIndex: 1 },
  avatarImg: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.tagBg, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 30, fontWeight: '800', color: COLORS.primaryDeep },

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
  org: {
    fontSize: SIZES.body, color: COLORS.secondaryDark,
    fontWeight: '700', marginBottom: 8, zIndex: 1,
  },
  metaRow: {
    flexDirection: 'row', gap: 8, flexWrap: 'wrap',
    justifyContent: 'center', zIndex: 1, marginBottom: 4,
  },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: SIZES.radiusFull, backgroundColor: COLORS.inputBg,
    marginTop: 6,
  },
  metaText: { fontSize: SIZES.small, color: COLORS.textSecondary, fontWeight: '500' },

  actionRow: { marginTop: SIZES.paddingM, zIndex: 1 },
  msgBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primaryDeep,
    paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: SIZES.radiusFull,
    ...SHADOWS.button,
  },
  msgBtnText: { fontSize: SIZES.body, fontWeight: '700', color: '#fff' },

  // Stats
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: SIZES.paddingL,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.paddingM,
    marginBottom: SIZES.paddingL,
    ...SHADOWS.card,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDiv: { width: 1, backgroundColor: COLORS.divider, marginVertical: 4 },
  statIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: SIZES.xlarge, fontWeight: '800' },
  statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },

  // Section headers
  sectionHeader: {
    paddingHorizontal: SIZES.paddingL, marginBottom: SIZES.paddingM,
  },
  sectionTitle: { fontSize: SIZES.medium, fontWeight: '800', color: COLORS.brown },

  // Animal grid
  gridRow: {
    flexDirection: 'row', gap: SIZES.paddingM,
    paddingHorizontal: SIZES.paddingL, marginBottom: SIZES.paddingM,
  },
  gridCard: { flex: 1 },
  empty: { marginHorizontal: SIZES.paddingL, marginBottom: SIZES.paddingL },

  // Report rows (community user)
  reportRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: SIZES.paddingL, marginBottom: SIZES.paddingM,
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    padding: SIZES.paddingM, ...SHADOWS.card,
  },
  reportIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FDE8E8', alignItems: 'center', justifyContent: 'center',
  },
  reportInfo: { flex: 1 },
  reportTitle: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.brown },
  reportAddr: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: 2 },
});
