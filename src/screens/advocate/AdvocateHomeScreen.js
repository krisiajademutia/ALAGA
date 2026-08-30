import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import RescueCard from '../../components/RescueCard';
import SectionHeader from '../../components/SectionHeader';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';

const W = Dimensions.get('window').width;

export default function AdvocateHomeScreen({ navigation }) {
  const { currentUser, rescueReports, getAdvocateAnimals, getAdvocateRequests, getUnreadCount } = useApp();

  const openAlerts      = rescueReports.filter((r) => r.status === 'Open');
  const myResponses     = rescueReports.filter((r) => r.responderId === currentUser?.id);
  const myAnimals       = getAdvocateAnimals();
  const pendingRequests = getAdvocateRequests().filter((r) => r.status === 'Pending');
  const unreadNotifs    = getUnreadCount();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero ──────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroBlob1} />
          <View style={styles.heroBlob2} />

          <View style={styles.heroTop}>
            <View style={styles.heroGreetCol}>
              <Text style={styles.heroGreet}>Hi, {currentUser?.name?.split(' ')[0]}! 🐾</Text>
              <Text style={styles.heroOrg}>{currentUser?.organization || 'Animal Advocate'}</Text>
            </View>
            <View style={styles.heroActions}>
              {/* Notification bell — badge shows pending requests */}
              <TouchableOpacity
                style={styles.notifBtn}
                onPress={() => navigation.navigate('Notifications')}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications-outline" size={22} color={COLORS.brown} />
                {unreadNotifs > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>
                      {unreadNotifs > 9 ? '9+' : unreadNotifs}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Avatar */}
              <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarWrap}>
                <Avatar name={currentUser?.name} uri={currentUser?.avatar} size={44} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Illustration */}
          <View style={styles.illRow}>
            <View style={styles.illBubbles}>
              <View style={styles.illBubble}><Text style={styles.illEmoji}>🛡️</Text></View>
              <View style={[styles.illBubble, styles.illBubble2]}><Text style={styles.illEmoji2}>🐾</Text></View>
            </View>
            <View style={styles.taglineCol}>
              <Text style={styles.tagline1}>Rescue.</Text>
              <Text style={styles.tagline2}>Rehabilitate.</Text>
              <Text style={styles.tagline2}>Rehome.</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <Stat icon="alert-circle"     value={openAlerts.length}    label="Needs Help"  color={COLORS.danger}       bg="#FCE8E8" />
            <View style={styles.statDiv} />
            <Stat icon="shield-checkmark" value={myResponses.length}   label="Responding"  color={COLORS.success}      bg="#D8F0E4" />
            <View style={styles.statDiv} />
            <Stat icon="paw"              value={myAnimals.length}     label="Animals"     color={COLORS.primaryDeep}  bg={COLORS.tagBg} />
          </View>
        </View>

        {/* Pending requests banner */}
        {pendingRequests.length > 0 && (
          <TouchableOpacity
            style={styles.requestsBanner}
            onPress={() => navigation.navigate('AdvocateRequests')}
            activeOpacity={0.86}
          >
            <View style={styles.requestsIcon}>
              <Text style={{ fontSize: 18 }}>💜</Text>
            </View>
            <View style={styles.requestsText}>
              <Text style={styles.requestsTitle}>
                {pendingRequests.length} pending request{pendingRequests.length > 1 ? 's' : ''}
              </Text>
              <Text style={styles.requestsSub}>Review adoption & foster requests</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}

        {/* Open alerts feed */}
        <SectionHeader
          title="Open Rescue Alerts"
          actionLabel="See All"
          onAction={() => navigation.navigate('RescueAlerts')}
          style={styles.sectionHeader}
        />
        {openAlerts.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title="All clear!"
            subtitle="No open rescue reports right now. Great job! 🎉"
            style={styles.empty}
          />
        ) : (
          <View style={styles.feed}>
            {openAlerts.slice(0, 5).map((r) => (
              <RescueCard
                key={r.id}
                report={r}
                onPress={() => navigation.navigate('RescueAlertDetail', { reportId: r.id })}
              />
            ))}
          </View>
        )}

        {/* My active cases */}
        {myResponses.filter((r) => r.status === 'Responded').length > 0 && (
          <>
            <SectionHeader title="My Active Cases" style={styles.sectionHeader} />
            <View style={styles.feed}>
              {myResponses
                .filter((r) => r.status === 'Responded')
                .map((r) => (
                  <RescueCard
                    key={r.id}
                    report={r}
                    onPress={() => navigation.navigate('RescueAlertDetail', { reportId: r.id })}
                  />
                ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ icon, value, label, color, bg }) {
  return (
    <View style={[styles.stat, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 110 },

  hero: {
    margin: SIZES.md16,
    borderRadius: SIZES.r20,
    padding: SIZES.lg24,
    paddingBottom: SIZES.md16,
    backgroundColor: COLORS.surface,
    overflow: 'hidden', position: 'relative',
    ...SHADOWS.hero,
  },
  heroBlob1: {
    position: 'absolute', width: W * 0.45, height: W * 0.45,
    borderRadius: W * 0.225,
    backgroundColor: COLORS.secondaryLight, opacity: 0.5,
    top: -W * 0.1, right: -W * 0.08,
  },
  heroBlob2: {
    position: 'absolute', width: W * 0.3, height: W * 0.3,
    borderRadius: W * 0.15,
    backgroundColor: COLORS.teal, opacity: 0.22,
    bottom: -W * 0.06, left: -W * 0.06,
  },

  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: SIZES.md16, zIndex: 1,
  },
  heroGreetCol: { flex: 1, paddingRight: SIZES.sm8 },
  heroGreet: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.brown, letterSpacing: -0.3 },
  heroOrg:   { fontSize: SIZES.sm, color: COLORS.secondaryDark, fontWeight: '700', marginTop: 3 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm8 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
    ...SHADOWS.sm,
  },
  notifBadge: {
    position: 'absolute', top: 5, right: 5,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: COLORS.danger,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.surface,
  },
  notifBadgeText: { fontSize: 8, color: '#fff', fontWeight: '800' },
  avatarWrap:{ ...SHADOWS.sm },

  illRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: SIZES.md16, zIndex: 1,
  },
  illBubbles: { flexDirection: 'row', alignItems: 'flex-end', gap: SIZES.xs4 + 2 },
  illBubble: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  illBubble2: { width: 38, height: 38, borderRadius: 19, marginBottom: 6 },
  illEmoji:   { fontSize: 26 },
  illEmoji2:  { fontSize: 18 },

  taglineCol: { flex: 1, alignItems: 'flex-end' },
  tagline1: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.textSecondary, lineHeight: 20 },
  tagline2: { fontSize: SIZES.md + 1, fontWeight: '900', color: COLORS.secondaryDark, lineHeight: 20 },

  statsRow: {
    flexDirection: 'row', zIndex: 1,
    backgroundColor: 'rgba(240,248,251,0.65)',
    borderRadius: SIZES.r12, paddingVertical: SIZES.sm8,
  },
  stat: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SIZES.xs4,
    paddingVertical: SIZES.xs4 + 2, borderRadius: SIZES.r12,
  },
  statDiv:   { width: 1, backgroundColor: COLORS.divider, marginVertical: SIZES.xs4 },
  statVal:   { fontSize: SIZES.md, fontWeight: '800' },
  statLabel: { fontSize: SIZES.xs, fontWeight: '600' },

  requestsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.md16,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.r16,
    padding: SIZES.md16,
    marginHorizontal: SIZES.md16, marginBottom: SIZES.lg24,
    borderLeftWidth: 4, borderLeftColor: '#9B6DD4',
    ...SHADOWS.card,
  },
  requestsIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F3EEFF',
    alignItems: 'center', justifyContent: 'center',
  },
  requestsText:  { flex: 1 },
  requestsTitle: { fontSize: SIZES.body, fontWeight: '800', color: '#6D3FC2' },
  requestsSub:   { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },

  sectionHeader: { paddingHorizontal: SIZES.md16, marginBottom: SIZES.md16, marginTop: SIZES.xs4 },
  feed:          { paddingHorizontal: SIZES.md16 },
  empty:         { marginHorizontal: SIZES.md16 },
});
