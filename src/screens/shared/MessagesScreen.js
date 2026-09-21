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
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import Avatar from '../../components/Avatar';

export default function MessagesScreen({ navigation }) {
  const {
    getUserConversations,
    currentUser,
    getAllKnownUsers,
    startConversation,
    startGroupConversation,
    markConversationRead,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [newChatVisible, setNewChatVisible] = useState(false);
  const [groupChatVisible, setGroupChatVisible] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');

  const convos = getUserConversations();
  const sorted = [...convos].sort(
    (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
  );

  const allUsers = getAllKnownUsers();

  // Main search: filters both conversations AND users
  const isSearching = Boolean(searchQuery.trim());
  const filteredConvos = sorted.filter((item) => {
    const q = searchQuery.toLowerCase();
    if (item.isGroup) {
      return (item.groupName || '').toLowerCase().includes(q) ||
        (item.lastMessage || '').toLowerCase().includes(q);
    }
    const otherId = item.participants?.find((p) => p !== currentUser?.id);
    const otherName = (item.participantNames?.[otherId] || '').toLowerCase();
    const lastMsg = (item.lastMessage || '').toLowerCase();
    return otherName.includes(q) || lastMsg.includes(q);
  });

  const matchedUsers = isSearching
    ? allUsers.filter((u) => {
      const q = searchQuery.toLowerCase();
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.location || '').toLowerCase().includes(q)
      );
    })
    : [];

  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'ios' ? Math.max(insets.top, 16) + 4 : (insets.top > 24 ? insets.top + 6 : 14);

  // Active contacts for story row (only when not searching)
  const activeContacts = sorted.slice(0, 8).map((c) => {
    if (c.isGroup) {
      return { id: c.id, name: c.groupName || 'Group', isGroup: true };
    }
    const otherId = c.participants?.find((p) => p !== currentUser?.id);
    return {
      id: c.id,
      name: c.participantNames?.[otherId] || 'Member',
      otherId,
      otherAvatar: (otherId && c.participantAvatars?.[otherId]) || null,
    };
  });

  // New 1-on-1 chat modal users
  const filteredUsers = allUsers.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (!newChatSearch.trim()) return true;
    const q = newChatSearch.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.location || '').toLowerCase().includes(q);
  });

  // Group chat modal users
  const groupFilteredUsers = allUsers.filter((u) => {
    if (!groupSearch.trim()) return true;
    const q = groupSearch.toLowerCase();
    return (u.name || '').toLowerCase().includes(q);
  });

  const toggleMember = (user) => {
    setSelectedMembers((prev) => {
      const exists = prev.find((m) => m.id === user.id);
      if (exists) return prev.filter((m) => m.id !== user.id);
      return [...prev, user];
    });
  };

  const handleCreateGroup = () => {
    if (selectedMembers.length < 1) return;
    const memberIds = selectedMembers.map((m) => m.id);
    const convId = startGroupConversation(
      memberIds,
      groupName.trim() || null
    );
    setGroupChatVisible(false);
    setGroupName('');
    setSelectedMembers([]);
    setGroupSearch('');
    if (convId) {
      navigation.navigate('Chat', {
        conversationId: convId,
        otherName: groupName.trim() || selectedMembers.map((m) => m.name.split(' ')[0]).join(', '),
        isGroup: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* ── Header Bar ─────────────────────────────────────── */}
      <View style={[styles.headerWrap, { paddingTop: safeTopPadding }]}>
        <View style={styles.topRow}>
          <Text style={styles.messengerTitle}>ALAGA Chat</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionCircleBtn}
              onPress={() => setGroupChatVisible(true)}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="people-outline" size={20} color="#473018" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Unified Search Bar */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={17} color="#8C7D6A" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search chats or people…"
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

      {/* ── User Search Results (when searching) ───────────── */}
      {isSearching && matchedUsers.length > 0 && (
        <View style={styles.userResultsSection}>
          <Text style={styles.sectionLabel}>People</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.userResultsScroll}
          >
            {matchedUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userResultItem}
                activeOpacity={0.8}
                onPress={() => {
                  const convId = startConversation(user.id, user.name, user.avatar);
                  setSearchQuery('');
                  navigation.navigate('Chat', {
                    conversationId: convId,
                    otherName: user.name,
                    otherId: user.id,
                    otherAvatar: user.avatar,
                  });
                }}
              >
                <Avatar name={user.name} userId={user.id} uri={user.avatar} size={48} />
                <Text style={styles.userResultName} numberOfLines={1}>
                  {user.name.split(' ')[0]}
                </Text>
                <View style={[
                  styles.userResultRole,
                  user.role === 'advocate' ? styles.roleAdvocate : styles.roleCommunity,
                ]}>
                  <Text style={[
                    styles.userResultRoleText,
                    user.role === 'advocate' ? styles.roleAdvocateText : styles.roleCommunityText,
                  ]}>
                    {user.role === 'advocate' ? 'Advocate' : 'Member'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {filteredConvos.length > 0 && <Text style={styles.sectionLabel}>Conversations</Text>}
        </View>
      )}

      {/* ── Main Chat Feed ───────────────────────────────── */}
      <FlatList
        data={filteredConvos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          activeContacts.length > 0 && !isSearching ? (
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
                        otherId: contact.otherId,
                        otherAvatar: contact.otherAvatar,
                        isGroup: contact.isGroup,
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.storyAvatarRing}>
                      {contact.isGroup ? (
                        <View style={styles.groupStoryAvatar}>
                          <Ionicons name="people" size={22} color="#2E7A99" />
                        </View>
                      ) : (
                        <Avatar name={contact.name} userId={contact.otherId} uri={contact.otherAvatar} size={50} />
                      )}
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
              {isSearching ? 'No matching conversations' : 'No chats yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isSearching
                ? 'Try a different name or search for a person above.'
                : 'Connect with advocates, fosters, and volunteers directly.'}
            </Text>
            {!isSearching && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => setNewChatVisible(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyBtnText}>Start a Chat</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const isGroup = item.isGroup;
          const otherId = !isGroup ? item.participants?.find((p) => p !== currentUser?.id) : null;
          const displayName = isGroup
            ? (item.groupName || 'Group Chat')
            : (item.participantNames?.[otherId] || 'Community Member');
          const otherAvatar = (!isGroup && otherId && item.participantAvatars?.[otherId]) || null;
          const groupPhoto = isGroup ? (item.groupPhoto || null) : null;
          const lastMsg = item.lastMessage || (isGroup ? 'Group created' : 'Sent a message');
          const time = formatTime(item.lastMessageTime);
          const uId = currentUser?.id;
          const isFromOther = item.lastSenderId && item.lastSenderId !== uId;
          const userUnreadCount =
            item.unreadCounts && typeof item.unreadCounts[uId] === 'number'
              ? item.unreadCounts[uId]
              : (isFromOther && item.unread ? (item.unreadCount || 1) : 0);
          const isUnread = userUnreadCount > 0;

          return (
            <TouchableOpacity
              style={styles.chatRow}
              onPress={() => {
                if (markConversationRead) markConversationRead(item.id);
                navigation.navigate('Chat', {
                  conversationId: item.id,
                  otherName: displayName,
                  otherId,
                  otherAvatar,
                  isGroup,
                });
              }}
              activeOpacity={0.72}
            >
              <View style={styles.rowAvatarWrap}>
                {isGroup ? (
                  groupPhoto
                    ? <Image source={{ uri: groupPhoto }} style={styles.groupAvatarPhoto} />
                    : <View style={styles.groupAvatar}>
                      <Ionicons name="people" size={26} color="#2E7A99" />
                    </View>
                ) : (
                  <Avatar name={displayName} userId={otherId} uri={otherAvatar} size={54} />
                )}
              </View>

              <View style={styles.rowContentWrap}>
                <View style={styles.rowTopBar}>
                  <Text style={[styles.userNameText, isUnread && styles.userNameUnread]} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {isGroup && (
                    <View style={styles.groupBadge}>
                      <Text style={styles.groupBadgeText}>Group</Text>
                    </View>
                  )}
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
                {userUnreadCount > 0 ? (
                  <View style={styles.unreadBadgePill}>
                    <Text style={styles.unreadBadgeText}>
                      {userUnreadCount > 99 ? '99+' : userUnreadCount}
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

      {/* ── New 1-on-1 Message Modal ─────────────────────── */}
      <Modal
        visible={newChatVisible}
        animationType="slide"
        onRequestClose={() => setNewChatVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => { setNewChatVisible(false); setNewChatSearch(''); }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={22} color="#473018" />
            </TouchableOpacity>
            <View style={styles.modalHeaderCenter}>
              <Text style={styles.modalTitle}>New Message</Text>
              <Text style={styles.modalSubtitle}>Start a private chat</Text>
            </View>
            <View style={{ width: 38 }} />
          </View>

          {/* Search */}
          <View style={styles.modalSearchWrap}>
            <Ionicons name="search" size={17} color="#8C7D6A" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search people…"
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

          {/* Role Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsRow}
          >
            {['all', 'advocate', 'community'].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.filterChip, roleFilter === r && styles.filterChipActive]}
                onPress={() => setRoleFilter(r)}
              >
                <Text style={[styles.filterChipText, roleFilter === r && styles.filterChipTextActive]}>
                  {r === 'all' ? 'All' : r === 'advocate' ? 'Advocates' : 'Community'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredUsers}
            keyExtractor={(u) => u.id}
            contentContainerStyle={styles.modalListContent}
            ListEmptyComponent={
              <View style={styles.modalEmpty}>
                <Ionicons name="people-outline" size={38} color="#2E7A99" />
                <Text style={styles.modalEmptyTitle}>No people found</Text>
                <Text style={styles.modalEmptySub}>
                  Community members and advocates will appear here.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => {
                  const convId = startConversation(item.id, item.name, item.avatar);
                  setNewChatVisible(false);
                  setNewChatSearch('');
                  navigation.navigate('Chat', {
                    conversationId: convId,
                    otherName: item.name,
                    otherId: item.id,
                    otherAvatar: item.avatar,
                  });
                }}
                activeOpacity={0.75}
              >
                <Avatar name={item.name} userId={item.id} uri={item.avatar} size={48} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{item.name}</Text>
                  <View style={styles.contactRoleRow}>
                    <View style={[styles.roleBadge, item.role === 'advocate' ? styles.roleAdvocate : styles.roleCommunity]}>
                      <Text style={[styles.roleBadgeText, item.role === 'advocate' ? styles.roleAdvocateText : styles.roleCommunityText]}>
                        {item.role === 'advocate' ? 'Animal Advocate' : 'Community Member'}
                      </Text>
                    </View>
                    {Boolean(item.location) && (
                      <Text style={styles.contactLocation} numberOfLines={1}>📍 {item.location}</Text>
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

      {/* ── New Group Chat Modal ─────────────────────────── */}
      <Modal
        visible={groupChatVisible}
        animationType="slide"
        onRequestClose={() => setGroupChatVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                setGroupChatVisible(false);
                setSelectedMembers([]);
                setGroupName('');
                setGroupSearch('');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={22} color="#473018" />
            </TouchableOpacity>
            <View style={styles.modalHeaderCenter}>
              <Text style={styles.modalTitle}>New Group Chat</Text>
              <Text style={styles.modalSubtitle}>
                {selectedMembers.length === 0
                  ? 'Select at least 1 member'
                  : `${selectedMembers.length} selected`}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.createGroupBtn,
                selectedMembers.length < 1 && styles.createGroupBtnDisabled,
              ]}
              onPress={handleCreateGroup}
              disabled={selectedMembers.length < 1}
              activeOpacity={0.8}
            >
              <Text style={styles.createGroupBtnText}>Create</Text>
            </TouchableOpacity>
          </View>

          {/* Group Name Input */}
          <View style={styles.groupNameWrap}>
            <Ionicons name="people-circle-outline" size={22} color="#2E7A99" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.groupNameInput}
              placeholder="Group name (optional)"
              placeholderTextColor="#8C7D6A"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={40}
            />
          </View>

          {/* Selected Members Chips */}
          {selectedMembers.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectedChipsRow}
            >
              {selectedMembers.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.selectedChip}
                  onPress={() => toggleMember(m)}
                >
                  <Avatar name={m.name} userId={m.id} uri={m.avatar} size={28} />
                  <Text style={styles.selectedChipName}>{m.name.split(' ')[0]}</Text>
                  <Ionicons name="close-circle" size={15} color="#8C7D6A" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Search Members */}
          <View style={styles.modalSearchWrap}>
            <Ionicons name="search" size={17} color="#8C7D6A" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search people to add…"
              placeholderTextColor="#8C7D6A"
              value={groupSearch}
              onChangeText={setGroupSearch}
            />
            {Boolean(groupSearch) && (
              <TouchableOpacity onPress={() => setGroupSearch('')}>
                <Ionicons name="close-circle" size={17} color="#8C7D6A" />
              </TouchableOpacity>
            )}
          </View>

          {/* Member List with checkboxes */}
          <FlatList
            data={groupFilteredUsers}
            keyExtractor={(u) => u.id}
            contentContainerStyle={styles.modalListContent}
            ListEmptyComponent={
              <View style={styles.modalEmpty}>
                <Ionicons name="people-outline" size={38} color="#2E7A99" />
                <Text style={styles.modalEmptyTitle}>No people found</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = Boolean(selectedMembers.find((m) => m.id === item.id));
              return (
                <TouchableOpacity
                  style={[styles.contactRow, isSelected && styles.contactRowSelected]}
                  onPress={() => toggleMember(item)}
                  activeOpacity={0.75}
                >
                  <Avatar name={item.name} userId={item.id} uri={item.avatar} size={48} />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <View style={[styles.roleBadge, item.role === 'advocate' ? styles.roleAdvocate : styles.roleCommunity]}>
                      <Text style={[styles.roleBadgeText, item.role === 'advocate' ? styles.roleAdvocateText : styles.roleCommunityText]}>
                        {item.role === 'advocate' ? 'Advocate' : 'Member'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              );
            }}
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // ── Header ───────────────────────────────────────────────
  headerWrap: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  messengerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#473018',
    letterSpacing: -0.5,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFE8D6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Search Bar ───────────────────────────────────────────
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFE8D6',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#473018',
    fontFamily: 'PlusJakartaSans_500Medium',
    paddingVertical: 0,
  },

  // ── User Search Results ──────────────────────────────────
  userResultsSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8DFC8',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8C7D6A',
    paddingHorizontal: 18,
    paddingVertical: 6,
    fontFamily: 'PlusJakartaSans_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userResultsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  userResultItem: {
    alignItems: 'center',
    width: 66,
  },
  userResultName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#473018',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  userResultRole: {
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  userResultRoleText: { fontSize: 9, fontWeight: '700' },

  // ── Stories Row ──────────────────────────────────────────
  storiesWrap: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE4D0',
    marginBottom: 6,
  },
  storiesScroll: { paddingHorizontal: 16, gap: 14 },
  storyItem: { alignItems: 'center', width: 60 },
  storyAvatarRing: {
    padding: 2,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#92CDE5',
    marginBottom: 4,
  },
  groupStoryAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EBF7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyName: {
    fontSize: 11,
    color: '#473018',
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    textAlign: 'center',
  },

  // ── Chat Rows ────────────────────────────────────────────
  listContent: { paddingTop: 6, paddingBottom: 110 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 18,
  },
  rowAvatarWrap: { marginRight: 14 },
  groupAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EBF7FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#B8E4E5',
  },
  groupAvatarPhoto: {
    width: 54,
    height: 54,
    borderRadius: 27,
    resizeMode: 'cover',
  },
  rowContentWrap: { flex: 1, justifyContent: 'center' },
  rowTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 6,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  userNameUnread: { fontWeight: '800', fontFamily: 'PlusJakartaSans_700Bold' },
  groupBadge: {
    backgroundColor: '#EBF7FA',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7A99',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  rowBottomBar: { flexDirection: 'row', alignItems: 'center' },
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
  timeDot: { marginHorizontal: 4, color: '#8C7D6A', fontSize: 12 },
  timeText: {
    fontSize: 12,
    color: '#8C7D6A',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  timeTextUnread: { color: '#2E7A99', fontWeight: '700' },
  rowEndWrap: { marginLeft: 8, alignItems: 'center', justifyContent: 'center' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E7A99' },
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
    backgroundColor: 'rgba(232,223,200,0.4)',
    marginLeft: 86,
  },

  // ── Empty State ──────────────────────────────────────────
  emptyContainer: { alignItems: 'center', paddingHorizontal: 36, paddingTop: 60 },
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
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // ── Modal ────────────────────────────────────────────────
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
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
  },
  modalHeaderCenter: { alignItems: 'center' },
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DFC8',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  filterChipActive: { backgroundColor: '#2E7A99', borderColor: '#2E7A99' },
  filterChipText: { fontSize: 12, fontWeight: '700', color: '#685038' },
  filterChipTextActive: { color: '#FFFFFF' },
  modalListContent: { paddingHorizontal: 16, paddingVertical: 10, paddingBottom: 30 },
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
  contactRowSelected: {
    borderColor: '#2E7A99',
    backgroundColor: '#F0F8FC',
  },
  contactInfo: { flex: 1 },
  contactName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  contactRoleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 10 },
  roleAdvocate: { backgroundColor: '#E8F5E9' },
  roleCommunity: { backgroundColor: '#EBF7FA' },
  roleBadgeText: { fontSize: 10.5, fontWeight: '700' },
  roleAdvocateText: { color: '#2E7D32' },
  roleCommunityText: { color: '#2E7A99' },
  contactLocation: { fontSize: 11, color: '#8C7D6A', flex: 1 },
  contactDivider: { height: 8 },
  modalEmpty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  modalEmptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#473018',
    marginBottom: 6,
    marginTop: 12,
  },
  modalEmptySub: { fontSize: 13, color: '#8C7D6A', textAlign: 'center', lineHeight: 18 },

  // ── Group Chat Modal ─────────────────────────────────────
  createGroupBtn: {
    backgroundColor: '#2E7A99',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  createGroupBtnDisabled: { backgroundColor: '#B8D8E4', opacity: 0.6 },
  createGroupBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  groupNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
  groupNameInput: {
    flex: 1,
    fontSize: 14,
    color: '#473018',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  selectedChipsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF7FA',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    borderWidth: 1,
    borderColor: '#92CDE5',
  },
  selectedChipName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7A99',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C8BCA8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#2E7A99',
    borderColor: '#2E7A99',
  },
});
