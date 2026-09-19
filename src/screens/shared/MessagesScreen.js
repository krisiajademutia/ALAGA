import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Modal,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import Avatar from '../../components/Avatar';

export default function MessagesScreen({ navigation }) {
  const { getUserConversations, currentUser, getAllKnownUsers, startConversation, markConversationRead } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatVisible, setNewChatVisible] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const convos = getUserConversations();

  const sorted = [...convos].sort(
    (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
  );

  const filtered = sorted.filter((item) => {
    if (!searchQuery.trim()) return true;
    const otherId = item.participants?.find((p) => p !== currentUser?.id);
    const otherName = (item.participantNames?.[otherId] || '').toLowerCase();
    const lastMsg = (item.lastMessage || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return otherName.includes(q) || lastMsg.includes(q);
  });

  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'ios' ? Math.max(insets.top, 16) + 4 : (insets.top > 24 ? insets.top + 6 : 14);

  // Extract active contacts for Messenger horizontal story / active row
  const activeContacts = sorted.slice(0, 8).map((c) => {
    const otherId = c.participants?.find((p) => p !== currentUser?.id);
    return {
      id: c.id,
      name: c.participantNames?.[otherId] || 'Member',
      otherId,
    };
  });

  const allUsers = getAllKnownUsers();
  const filteredUsers = allUsers.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (!newChatSearch.trim()) return true;
    const q = newChatSearch.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.location || '').toLowerCase().includes(q);
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* ── Messenger-Style Header Bar ─────────────────────── */}
      <View style={[styles.headerWrap, { paddingTop: safeTopPadding }]}>
        <View style={styles.topRow}>
          <View style={styles.titleGroup}>
            <Text style={styles.messengerTitle}>Chats</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionCircleBtn}
              onPress={() => setNewChatVisible(true)}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={20} color="#473018" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar (Messenger Pill) */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={17} color="#8C7D6A" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#8C7D6A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#8C7D6A" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Main Chat Feed / Empty State ───────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          activeContacts.length > 0 && !searchQuery.trim() ? (
            <View style={styles.storiesWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesScroll}
              >
                {activeContacts.map((contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    style={styles.storyItem}
                    onPress={() => {
                      if (markConversationRead) markConversationRead(contact.id);
                      navigation.navigate('Chat', {
                        conversationId: contact.id,
                        otherName: contact.name,
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.storyAvatarRing}>
                      <Avatar name={contact.name} size={50} />
                    </View>
                    <Text style={styles.storyName} numberOfLines={1}>
                      {contact.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="chatbubbles-outline" size={42} color="#2E7A99" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery.trim() ? 'No matching conversations' : 'No chats yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? 'Check the spelling or try searching for another name.'
                : 'Connect with advocates, fosters, and volunteers directly. Messages you start from animal profiles and rescue alerts will appear here.'}
            </Text>

            {!searchQuery.trim() && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate(currentUser?.role === 'advocate' ? 'RescueAlerts' : 'Listings')}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyBtnText}>
                  {currentUser?.role === 'advocate' ? 'Explore Rescue Alerts' : 'Explore Animals for Adoption'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const otherId = item.participants?.find((p) => p !== currentUser?.id);
          const otherName = item.participantNames?.[otherId] || 'Community Member';
          const lastMsg = item.lastMessage || 'Sent a message';
          const time = formatTime(item.lastMessageTime);
          const uId = currentUser?.id;
          const isFromOther = item.lastSenderId && item.lastSenderId !== uId;
          const userUnreadCount =
            item.unreadCounts && typeof item.unreadCounts[uId] === 'number'
              ? item.unreadCounts[uId]
              : (isFromOther && item.unread ? (item.unreadCount || 1) : 0);
          const unreadCount = userUnreadCount;
          const isUnread = unreadCount > 0;

          return (
            <TouchableOpacity
              style={styles.chatRow}
              onPress={() => {
                if (markConversationRead) markConversationRead(item.id);
                navigation.navigate('Chat', {
                  conversationId: item.id,
                  otherName,
                  otherId,
                });
              }}
              activeOpacity={0.72}
            >
              <View style={styles.rowAvatarWrap}>
                <Avatar name={otherName} size={54} />
              </View>

              <View style={styles.rowContentWrap}>
                <View style={styles.rowTopBar}>
                  <Text style={[styles.userNameText, isUnread && styles.userNameUnread]} numberOfLines={1}>
                    {otherName}
                  </Text>
                </View>

                <View style={styles.rowBottomBar}>
                  <Text
                    style={[styles.messageSnippet, isUnread && styles.messageSnippetUnread]}
                    numberOfLines={1}
                  >
                    {lastMsg}
                  </Text>
                  <Text style={styles.timeDot}>·</Text>
                  <Text style={[styles.timeText, isUnread && styles.timeTextUnread]}>{time}</Text>
                </View>
              </View>

              <View style={styles.rowEndWrap}>
                {unreadCount > 0 ? (
                  <View style={styles.unreadBadgePill}>
                    <Text style={styles.unreadBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                ) : isUnread ? (
                  <View style={styles.unreadDot} />
                ) : (
                  <Ionicons name="checkmark-done" size={15} color="#A89985" />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
      />

      {/* ── New Message Modal ───────────────────────────────── */}
      <Modal
        visible={newChatVisible}
        animationType="slide"
        onRequestClose={() => setNewChatVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                setNewChatVisible(false);
                setNewChatSearch('');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={22} color="#473018" />
            </TouchableOpacity>

            <View style={styles.modalHeaderCenter}>
              <Text style={styles.modalTitle}>New Message</Text>
              <Text style={styles.modalSubtitle}>Direct 1-on-1 private chat</Text>
            </View>
            <View style={{ width: 38 }} />
          </View>

          {/* Search Box */}
          <View style={styles.modalSearchWrap}>
            <Ionicons name="search" size={17} color="#8C7D6A" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search advocates or rescuers..."
              placeholderTextColor="#8C7D6A"
              value={newChatSearch}
              onChangeText={setNewChatSearch}
            />
            {Boolean(newChatSearch) && (
              <TouchableOpacity onPress={() => setNewChatSearch('')}>
                <Ionicons name="close-circle" size={17} color="#8C7D6A" />
              </TouchableOpacity>
            )}
          </View>

          {/* Role Filter Chips */}
          <View style={styles.filterChipsRow}>
            <TouchableOpacity
              style={[styles.filterChip, roleFilter === 'all' && styles.filterChipActive]}
              onPress={() => setRoleFilter('all')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, roleFilter === 'all' && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, roleFilter === 'advocate' && styles.filterChipActive]}
              onPress={() => setRoleFilter('advocate')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, roleFilter === 'advocate' && styles.filterChipTextActive]}>
                Advocates & Shelters
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, roleFilter === 'community' && styles.filterChipActive]}
              onPress={() => setRoleFilter('community')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, roleFilter === 'community' && styles.filterChipTextActive]}>
                Community Members
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contacts List */}
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalListContent}
            ListEmptyComponent={
              <View style={styles.modalEmpty}>
                <View style={styles.modalEmptyIcon}>
                  <Ionicons name="people-outline" size={38} color="#2E7A99" />
                </View>
                <Text style={styles.modalEmptyTitle}>No people found</Text>
                <Text style={styles.modalEmptySub}>
                  When community members post rescue alerts or report animals, you can message them directly here.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => {
                  const convId = startConversation(item.id, item.name);
                  setNewChatVisible(false);
                  setNewChatSearch('');
                  navigation.navigate('Chat', {
                    conversationId: convId,
                    otherName: item.name,
                    otherId: item.id,
                  });
                }}
                activeOpacity={0.75}
              >
                <Avatar name={item.name} size={48} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{item.name}</Text>
                  <View style={styles.contactRoleRow}>
                    <View
                      style={[
                        styles.roleBadge,
                        item.role === 'advocate' ? styles.roleAdvocate : styles.roleCommunity,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleBadgeText,
                          item.role === 'advocate' ? styles.roleAdvocateText : styles.roleCommunityText,
                        ]}
                      >
                        {item.role === 'advocate' ? 'Animal Advocate' : 'Community Member'}
                      </Text>
                    </View>
                    {Boolean(item.location) && (
                      <Text style={styles.contactLocation} numberOfLines={1}>
                        📍 {item.location}
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chatbubble-ellipses" size={22} color="#2E7A99" />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.contactDivider} />}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1d';
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF8E8',
  },

  // ── Top Header ───────────────────────────────────────────
  headerWrap: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: '#FCF8E8',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messengerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#473018',
    letterSpacing: -0.5,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFE8D6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Messenger Pill Search ────────────────────────────────
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFE8D6',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#473018',
    fontFamily: 'PlusJakartaSans_500Medium',
    paddingVertical: 0,
  },

  // ── Active Stories Row ───────────────────────────────────
  storiesWrap: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE4D0',
    marginBottom: 6,
  },
  storiesScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 60,
  },
  storyAvatarRing: {
    padding: 2,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#92CDE5',
    marginBottom: 4,
  },
  storyName: {
    fontSize: 11,
    color: '#473018',
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    textAlign: 'center',
  },

  // ── Chat Rows ────────────────────────────────────────────
  listContent: {
    paddingTop: 6,
    paddingBottom: 110,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 18,
  },
  rowAvatarWrap: {
    marginRight: 14,
  },
  rowContentWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: -0.1,
  },
  userNameUnread: {
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  rowBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageSnippet: {
    fontSize: 13,
    color: '#8C7D6A',
    fontFamily: 'PlusJakartaSans_500Medium',
    flexShrink: 1,
  },
  messageSnippetUnread: {
    color: '#473018',
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  timeDot: {
    marginHorizontal: 4,
    color: '#8C7D6A',
    fontSize: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#8C7D6A',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  timeTextUnread: {
    color: '#2E7A99',
    fontWeight: '700',
  },
  rowEndWrap: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7A99',
  },
  unreadBadgePill: {
    backgroundColor: '#E8622A',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(232, 223, 200, 0.4)',
    marginLeft: 86,
  },

  // ── Empty State ──────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingTop: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F3F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#473018',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8C7D6A',
    lineHeight: 19,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: '#92CDE5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    ...SHADOWS.sm,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // ── New Message Modal Styles ─────────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: '#FCF8E8',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFC8',
  },
  modalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DFC8',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  modalHeaderCenter: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#8C7D6A',
    fontWeight: '500',
    marginTop: 1,
  },
  modalSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 42,
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#473018',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  filterChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DFC8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipActive: {
    backgroundColor: '#2E7A99',
    borderColor: '#2E7A99',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#685038',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  modalListContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 30,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE6D4',
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  contactRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  roleAdvocate: {
    backgroundColor: '#E8F5E9',
  },
  roleCommunity: {
    backgroundColor: '#EBF7FA',
  },
  roleBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  roleAdvocateText: {
    color: '#2E7D32',
  },
  roleCommunityText: {
    color: '#2E7A99',
  },
  contactLocation: {
    fontSize: 11,
    color: '#8C7D6A',
    flex: 1,
  },
  contactDivider: {
    height: 8,
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  modalEmptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EBF7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalEmptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#473018',
    marginBottom: 6,
  },
  modalEmptySub: {
    fontSize: 13,
    color: '#8C7D6A',
    textAlign: 'center',
    lineHeight: 18,
  },
});
