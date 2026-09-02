import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

function fmtTime(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800)return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

// Group notifications into Today / Earlier
function groupNotifications(notifs) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const groups = { Today: [], Earlier: [] };
  notifs.forEach((n) => {
    const d = new Date(n.createdAt);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups.Today.push(n);
    else groups.Earlier.push(n);
  });
  return groups;
}

export default function NotificationScreen({ navigation }) {
  const {
    getUserNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();

  const notifs      = getUserNotifications();
  const unreadCount = getUnreadCount();
  const groups      = groupNotifications(notifs);

  // Build flat list data with section headers
  const listData = [];
  if (groups.Today.length > 0) {
    listData.push({ type: 'header', label: 'Today' });
    groups.Today.forEach((n) => listData.push({ type: 'notif', ...n }));
  }
  if (groups.Earlier.length > 0) {
    listData.push({ type: 'header', label: 'Earlier' });
    groups.Earlier.forEach((n) => listData.push({ type: 'notif', ...n }));
  }

  const handleTap = (item) => {
    // Mark as read first
    markNotificationRead(item.id);
    // Navigate to the target screen
    if (item.navTarget?.screen) {
      navigation.navigate(item.navTarget.screen, item.navTarget.params || {});
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Navbar ──────────────────────────────────────────── */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.brown} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={markAllNotificationsRead}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.markAllBtn}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 72 }} />
        )}
      </View>

      {notifs.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={38} color={COLORS.primaryDeep} />
          </View>
          <Text style={styles.emptyTitle}>You're all caught up!</Text>
          <Text style={styles.emptySub}>No notifications yet. We'll let you know when something happens.</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, i) => item.id || `header-${i}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>{item.label}</Text>
                </View>
              );
            }

            return (
              <TouchableOpacity
                style={[styles.notifCard, !item.read && styles.notifCardUnread]}
                onPress={() => handleTap(item)}
                activeOpacity={0.85}
              >
                {/* Unread dot */}
                {!item.read && <View style={styles.unreadDot} />}

                {/* Icon */}
                <View style={[styles.notifIcon, { backgroundColor: item.iconBg || COLORS.tagBg }]}>
                  <Ionicons
                    name={item.icon || 'notifications'}
                    size={20}
                    color={item.iconColor || COLORS.primaryDeep}
                  />
                </View>

                {/* Content */}
                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
                    {item.title}
                  </Text>
                  <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
                  <Text style={styles.notifTime}>{fmtTime(item.createdAt)}</Text>
                </View>

                {/* Chevron */}
                <Ionicons name="chevron-forward" size={15} color={COLORS.textMuted} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg24,
    paddingTop: Platform.OS === 'ios' ? 52 : 28,
    paddingBottom: SIZES.md16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navCenter:{ flexDirection: 'row', alignItems: 'center', gap: SIZES.xs4 + 2 },
  navTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.brown },
  unreadBadge: {
    backgroundColor: COLORS.danger,
    borderRadius: SIZES.r999,
    paddingHorizontal: SIZES.xs4 + 2,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: { fontSize: SIZES.xs, color: '#fff', fontWeight: '800' },
  markAllBtn: { fontSize: SIZES.xs, fontWeight: '700', color: COLORS.primaryDeep },

  // Empty state
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SIZES.xl40,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.tagBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SIZES.md16,
  },
  emptyTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.brown, marginBottom: SIZES.xs4 + 2, textAlign: 'center' },
  emptySub:   { fontSize: SIZES.body, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },

  list: { paddingVertical: SIZES.sm8, paddingBottom: 110 },

  sectionHeader: {
    paddingHorizontal: SIZES.lg24,
    paddingVertical: SIZES.sm8,
    marginTop: SIZES.xs4,
  },
  sectionLabel: {
    fontSize: SIZES.xs, fontWeight: '800',
    color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
  },

  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md16,
    paddingHorizontal: SIZES.lg24,
    paddingVertical: SIZES.md16,
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.md16,
    marginBottom: SIZES.xs4 + 2,
    borderRadius: SIZES.r16,
    position: 'relative',
    ...SHADOWS.sm,
  },
  notifCardUnread: {
    backgroundColor: '#F0F8FC',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryDeep,
  },

  unreadDot: {
    position: 'absolute',
    top: SIZES.md16,
    left: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primaryDeep,
  },

  notifIcon: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  notifContent: { flex: 1 },
  notifTitle: {
    fontSize: SIZES.body, fontWeight: '600',
    color: COLORS.textSecondary, marginBottom: 3,
  },
  notifTitleUnread: { fontWeight: '800', color: COLORS.brown },
  notifBody: {
    fontSize: SIZES.sm, color: COLORS.textSecondary,
    lineHeight: 18, marginBottom: 4,
  },
  notifTime: { fontSize: SIZES.xs, color: COLORS.textMuted, fontWeight: '500' },
});
