import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

export default function NotificationScreen({ navigation }) {
  const {
    currentUser,
    getUserNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();

  const notifs = getUserNotifications();
  const unreadCount = getUnreadCount() || 2;

  // Group into TODAY and EARLIER
  const todayNotifs = notifs.filter((n) => n.section === 'TODAY' || !n.read);
  const earlierNotifs = notifs.filter((n) => n.section === 'EARLIER' && n.read);

  const listData = [];
  if (todayNotifs.length > 0) {
    listData.push({ type: 'header', label: 'TODAY' });
    todayNotifs.forEach((n) => listData.push({ type: 'item', ...n }));
  }
  if (earlierNotifs.length > 0) {
    listData.push({ type: 'header', label: 'EARLIER' });
    earlierNotifs.forEach((n) => listData.push({ type: 'item', ...n }));
  }

  const handleTap = (item) => {
    markNotificationRead(item.id);
    if (item.navTarget?.screen) {
      navigation.navigate(item.navTarget.screen, item.navTarget.params || {});
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color="#473018" />
        </TouchableOpacity>

        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={markAllNotificationsRead}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.markAllBtn}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item, i) => item.id || `h-${i}`}
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

          const hasBlueStrip = !item.read;

          return (
            <TouchableOpacity
              style={[
                styles.notifCard,
                hasBlueStrip && styles.notifCardActive,
              ]}
              onPress={() => handleTap(item)}
              activeOpacity={0.88}
            >
              {/* Blue strip indicator */}
              {hasBlueStrip && <View style={styles.activeStrip} />}

              {/* Icon */}
              <View style={[styles.iconBox, { backgroundColor: item.iconBg || '#E0F2FA' }]}>
                <Ionicons name={item.icon || 'notifications'} size={20} color="#206B82" />
              </View>

              {/* Text content */}
              <View style={styles.textBox}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemBody} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={styles.itemTime}>{item.timeAgo || '25m ago'}</Text>
              </View>

              <Ionicons name="chevron-forward" size={16} color="#8C7D6A" />
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
    backgroundColor: '#F8FAF9',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4F7',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F4F7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#473018',
  },
  unreadBadge: {
    backgroundColor: '#D94F4F',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  markAllBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7A99',
  },

  list: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C7D6A',
    letterSpacing: 0.6,
  },

  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F2F6',
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.sm,
  },
  notifCardActive: {
    backgroundColor: '#F3F9FC',
  },
  activeStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: '#2E7A99',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textBox: {
    flex: 1,
    marginRight: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#473018',
    marginBottom: 3,
  },
  itemBody: {
    fontSize: 12,
    color: '#5C4E3A',
    lineHeight: 16,
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 11,
    color: '#8C7D6A',
  },
});
