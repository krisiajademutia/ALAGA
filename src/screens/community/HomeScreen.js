import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import RescueCard from '../../components/RescueCard';
import SectionHeader from '../../components/SectionHeader';
import EmptyState from '../../components/EmptyState';
import Avatar from '../../components/Avatar';

const W = Dimensions.get('window').width;

// Simple, clean pet illustration using emoji + shapes
function HeroIllustration() {
  return (
    <View style={ill.wrap}>
      <View style={ill.bubble}>
        <Text style={ill.pet}>🐶</Text>
      </View>
      <View style={[ill.bubble, ill.bubble2]}>
        <Text style={ill.pet}>🐱</Text>
      </View>
      <View style={ill.starRow}>
        <Text style={ill.star}>✦</Text>
        <Text style={[ill.star, { fontSize: 8, opacity: 0.5 }]}>✦</Text>
        <Text style={[ill.star, { fontSize: 6, opacity: 0.4 }]}>✦</Text>
      </View>
    </View>
  );
}

export default function CommunityHomeScreen({ navigation }) {
  const { currentUser, rescueReports, getUnreadCount } = useApp();
  const recent        = rescueReports.slice(0, 10);
  const openCount     = rescueReports.filter((r) => r.status === 'Open').length;
  const respondedCount= rescueReports.filter((r) => r.status === 'Responded').length;
  const rescuedCount  = rescueReports.filter((r) => r.status === 'Rescued').length;
  const unreadNotifs  = getUnreadCount();

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
              <Text style={styles.heroGreet}>
                Hello, {currentUser?.name?.split(' ')[0]}! 👋
              </Text>
              <Text style={styles.heroSub}>Ready to help an animal today?</Text>
            </View>
            <View style={styles.heroActions}>
              {/* Notification bell */}
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

          <View style={styles.heroMid}>
            <HeroIllustration />
            <View style={styles.taglineCol}>
              <Text style={styles.tagline1}>Every animal</Text>
              <Text style={styles.tagline2}>deserves ALAGA.</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <Stat icon="alert-circle"     value={openCount}      label="Needs Help"  color={COLORS.danger}  bg="#FCE8E8" />
            <View style={styles.statDiv} />
            <Stat icon="shield-half"      value={respondedCount} label="Responding"  color={COLORS.warning} bg="#FEF3DC" />
            <View style={styles.statDiv} />
            <Stat icon="checkmark-circle" value={rescuedCount}   label="Rescued"     color={COLORS.success} bg="#D8F0E4" />
          </View>
        </View>

        {/* ── Report CTA ─────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.navigate('ReportRescue')}
          activeOpacity={0.86}
        >
          <View style={styles.ctaIconWrap}>
            <Ionicons name="alert-circle" size={22} color="#fff" />
          </View>
          <View style={styles.ctaTextCol}>
            <Text style={styles.ctaTitle}>Spotted an animal in need?</Text>
            <Text style={styles.ctaSub}>File a rescue report — takes 30 seconds</Text>
          </View>
          <View style={styles.ctaArrow}>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primaryDeep} />
          </View>
        </TouchableOpacity>

        {/* ── Feed ───────────────────────────────────────────── */}
        <SectionHeader
          title="Recent Rescue Reports"
          actionLabel="See All"
          onAction={() => navigation.navigate('AllReports')}
          style={styles.sectionHeader}
        />

        {recent.length === 0 ? (
          <EmptyState
            icon="paw-outline"
            title="No reports yet"
            subtitle="Be the first to report an animal in need."
            style={styles.empty}
          />
        ) : (
          <View style={styles.feed}>
            {recent.map((r) => (
              <RescueCard
                key={r.id}
                report={r}
                onPress={() => navigation.navigate('ReportDetail', { reportId: r.id })}
              />
            ))}
          </View>
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

const ill = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', position: 'relative', gap: 6 },
  bubble: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
  },
  bubble2: { width: 40, height: 40, borderRadius: 20, marginBottom: 6 },
  pet:  { fontSize: 26 },
  starRow: { flexDirection: 'column', alignItems: 'center', gap: 2, paddingBottom: 4 },
  star: { fontSize: 11, color: COLORS.accentDark, fontWeight: '800' },
});

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 110 },

  // Hero
  hero: {
    margin: SIZES.md16,
    borderRadius: SIZES.r20,
    padding: SIZES.lg24,
    paddingBottom: SIZES.md16,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.hero,
  },
  heroBlob1: {
    position: 'absolute', width: W * 0.45, height: W * 0.45,
    borderRadius: W * 0.225,
    backgroundColor: COLORS.primaryLight, opacity: 0.45,
    top: -W * 0.1, right: -W * 0.08,
  },
  heroBlob2: {
    position: 'absolute', width: W * 0.3, height: W * 0.3,
    borderRadius: W * 0.15,
    backgroundColor: COLORS.accent, opacity: 0.28,
    bottom: -W * 0.06, left: -W * 0.06,
  },

  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: SIZES.md16, zIndex: 1,
  },
  heroGreetCol: { flex: 1, paddingRight: SIZES.sm8 },
  heroGreet: {
    fontSize: SIZES.xl, fontWeight: '800',
    color: COLORS.brown, letterSpacing: -0.3,
  },
  heroSub: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 3 },
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
  avatarWrap: { ...SHADOWS.sm },

  heroMid: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: SIZES.md16, zIndex: 1,
  },
  taglineCol: { flex: 1, alignItems: 'flex-end' },
  tagline1: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.textSecondary, lineHeight: 21 },
  tagline2: { fontSize: SIZES.md + 1, fontWeight: '900', color: COLORS.primaryDeep, lineHeight: 21 },

  statsRow: {
    flexDirection: 'row', zIndex: 1,
    backgroundColor: 'rgba(240,248,251,0.7)',
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

  // CTA
  cta: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.md16,
    marginHorizontal: SIZES.md16, marginBottom: SIZES.lg24,
    padding: SIZES.md16, borderRadius: SIZES.r16,
    backgroundColor: COLORS.primaryDeep,
    ...SHADOWS.button,
  },
  ctaIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaTextCol: { flex: 1 },
  ctaTitle:   { fontSize: SIZES.body, fontWeight: '800', color: '#fff' },
  ctaSub:     { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.78)', marginTop: 2 },
  ctaArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },

  sectionHeader: {
    paddingHorizontal: SIZES.md16,
    marginBottom: SIZES.md16,
  },
  feed:  { paddingHorizontal: SIZES.md16 },
  empty: { marginHorizontal: SIZES.md16 },
});
