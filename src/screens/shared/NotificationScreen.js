import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, FONTS } from '../../constants/theme';

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Recently';
  let date;
  if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    date = new Date(timestamp);
  }
  if (!date || isNaN(date.getTime())) return 'Recently';
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'Just now';
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'rescue', label: 'Alerts' },
  { key: 'updates', label: 'Updates' },
];

export default function NotificationScreen({ navigation }) {
  const {
    currentUser,
    getUserNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState('all');

  const notifs = getUserNotifications ? getUserNotifications() : [];
  const unreadCount = getUnreadCount ? getUnreadCount() : 0;

  // Filter items based on active tab
  const filteredNotifs = useMemo(() => {
    return notifs.filter((n) => {
      if (activeFilter === 'unread') return !n.read;
      if (activeFilter === 'rescue') return n.type === 'rescue';
      if (activeFilter === 'updates') return n.type !== 'rescue';
      return true;
    });
  }, [notifs, activeFilter]);

  // Group into TODAY and EARLIER
  const listData = useMemo(() => {
    const today = [];
    const earlier = [];

    filteredNotifs.forEach((n) => {
      const isToday =
        !n.createdAt ||
        (Date.now() - new Date(n.createdAt).getTime()) / (1000 * 60 * 60) < 24;

      if (isToday) {
        today.push(n);
      } else {
        earlier.push(n);
      }
    });

    const sections = [];
    if (today.length > 0) {
      sections.push({ type: 'header', label: 'TODAY' });
      today.forEach((item) => sections.push({ type: 'item', ...item }));
    }
    if (earlier.length > 0) {
      sections.push({ type: 'header', label: 'EARLIER' });
      earlier.forEach((item) => sections.push({ type: 'item', ...item }));
    }

    if (sections.length === 0 && filteredNotifs.length > 0) {
      filteredNotifs.forEach((item) => sections.push({ type: 'item', ...item }));
    }

    return sections;
  }, [filteredNotifs]);

  const handleTap = (item) => {
    markNotificationRead(item.id);

    if (item.navTarget?.screen) {
      navigation.navigate(item.navTarget.screen, item.navTarget.params || {});
    } else if (item.type === 'donation' || item.donationId) {
      navigation.navigate('Activity', { tab: 'donations' });
    } else if (item.type === 'adoption' || item.requestId) {
      navigation.navigate('Activity', { tab: 'requests' });
    } else if (item.reportId) {
      navigation.navigate(
        currentUser?.role === 'advocate' ? 'RescueAlertDetail' : 'ReportDetail',
        { reportId: item.reportId }
      );
    } else if (item.conversationId) {
      navigation.navigate('Chat', {
        conversationId: item.conversationId,
        userName: item.senderName || 'Advocate',
      });
    }
  };

  const renderIcon = (type, iconName, iconColor, iconBg) => {
    let name = iconName || 'notifications-outline';
    let color = iconColor || '#2E7A99';
    let bg = iconBg || '#EBF4F8';

    if (type === 'rescue') {
      name = 'shield-outline';
      color = '#C23E3E';
      bg = '#FDF0ED';
    } else if (type === 'chat') {
      name = 'chatbubble-outline';
      color = '#2A728F';
      bg = '#EBF4F8';
    } else if (type === 'adoption') {
      name = 'paw-outline';
      color = '#2B8259';
      bg = '#EDF6F1';
    }

    return (
      <View style={[styles.iconContainer, { backgroundColor: bg }]}>
        <Ionicons name={name} size={18} color={color} />
      </View>
    );
  };

  const insets = useSafeAreaInsets();
  const safeTopPadding =
    Platform.OS === 'ios'
      ? Math.max(insets.top, 16) + 4
      : insets.top > 24
        ? insets.top + 6
        : 14;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: safeTopPadding }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => {
              if (navigation?.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Home');
              }
            }}
            style={styles.backBtn}
            activeOpacity={0.78}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.brown} />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {unreadCount > 0 ? (
            <TouchableOpacity
              onPress={markAllNotificationsRead}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
              style={styles.markReadBtn}
            >
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key;
            const showCount = tab.key === 'unread' && unreadCount > 0;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(tab.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
                {showCount && (
                  <View
                    style={[
                      styles.chipBadge,
                      isActive ? styles.chipBadgeActive : styles.chipBadgeInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipBadgeText,
                        isActive ? styles.chipBadgeTextActive : styles.chipBadgeTextInactive,
                      ]}
                    >
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Notification Stream */}
      <FlatList
        data={listData}
        keyExtractor={(item, index) => item.id || `h-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-outline" size={34} color="#8C7D6A" />
            </View>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyDesc}>
              {activeFilter === 'unread'
                ? 'All notifications have been reviewed.'
                : 'Alerts, community updates, and messages will appear here.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{item.label}</Text>
              </View>
            );
          }

          const isUnread = !item.read;

          return (
            <TouchableOpacity
              style={[styles.rowItem, isUnread && styles.rowItemUnread]}
              onPress={() => handleTap(item)}
              activeOpacity={0.75}
            >
              <View style={styles.dotSlot}>
                {isUnread && <View style={styles.unreadDot} />}
              </View>

              {renderIcon(item.type, item.icon, item.iconColor, item.iconBg)}

              <View style={styles.contentWrap}>
                <View style={styles.titleRow}>
                  <Text
                    style={[styles.titleText, isUnread && styles.titleTextUnread]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.timeText}>
                    {formatTimeAgo(item.createdAt)}
                  </Text>
                </View>

                <Text style={styles.bodyText} numberOfLines={2}>
                  {item.body || item.message || ''}
                </Text>

                {item.type === 'donation' && item.animalPhoto ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      if (item.animalId) {
                        markNotificationRead(item.id);
                        navigation.navigate('AnimalDetail', { animalId: item.animalId });
                      }
                    }}
                    style={styles.animalThumbRow}
                  >
                    <Image
                      source={{ uri: item.animalPhoto }}
                      style={styles.animalThumb}
                      resizeMode="cover"
                    />
                    <Text style={styles.animalThumbLabel}>View animal profile →</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── Header ───────────────────────────────────────────────
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.borderLight || '#F4EDE0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    ...FONTS.titleXl,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.brown,
    textAlign: 'center',
  },
  markReadBtn: {
    minWidth: 38,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  unreadBadge: {
    backgroundColor: '#C23E3E',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  markReadText: {
    ...FONTS.button,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },

  // Filter Row
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: SIZES.r20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight || '#E8DFC8',
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    ...FONTS.subheading,
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterChipTextActive: {
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  chipBadge: {
    marginLeft: 6,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  chipBadgeActive: {
    backgroundColor: COLORS.primaryDeep,
  },
  chipBadgeInactive: {
    backgroundColor: '#E8DFC8',
  },
  chipBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  chipBadgeTextActive: {
    color: '#FFFFFF',
  },
  chipBadgeTextInactive: {
    color: '#685038',
  },

  // Stream List
  listContent: {
    flexGrow: 1,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#947E68',
    letterSpacing: 0.8,
  },

  rowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EDE5DC',
  },
  rowItemUnread: {
    backgroundColor: '#F5FAF7',
  },
  dotSlot: {
    width: 10,
    alignItems: 'center',
    paddingTop: 11,
    marginRight: 4,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7A99',
  },

  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },

  contentWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#473018',
    flex: 1,
    marginRight: 8,
  },
  titleTextUnread: {
    fontWeight: '700',
    color: '#261B0E',
  },
  timeText: {
    fontSize: 11.5,
    color: '#947E68',
  },
  bodyText: {
    fontSize: 12.5,
    color: '#685038',
    lineHeight: 17,
  },
  animalThumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  animalThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E8DEC5',
  },
  animalThumbLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7A99',
    textDecorationLine: 'underline',
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 90,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FAF5E8',
    borderWidth: 1,
    borderColor: '#E8DFC8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#473018',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#8C7D6A',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
});