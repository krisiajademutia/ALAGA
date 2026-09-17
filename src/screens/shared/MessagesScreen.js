import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';

export default function MessagesScreen({ navigation }) {
  const { getUserConversations, currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const convos = getUserConversations();

  const sorted = [...convos].sort(
    (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
  );

  const filtered = sorted.filter((item) => {
    if (!searchQuery.trim()) return true;
    const otherId = item.participants.find((p) => p !== currentUser?.id);
    const otherName = (item.participantNames[otherId] || '').toLowerCase();
    const lastMsg = (item.lastMessage || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return otherName.includes(q) || lastMsg.includes(q);
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Direct conversations with advocates & community</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#8C7D6A" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#8C7D6A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#8C7D6A" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No messages yet"
            subtitle="Start a conversation from an animal profile or rescue alert."
          />
        }
        renderItem={({ item }) => {
          const otherId = item.participants.find((p) => p !== currentUser?.id);
          const otherName = item.participantNames[otherId] || 'Elena Ramos';
          const lastMsg = item.lastMessage;
          const time = formatTime(item.lastMessageTime);
          const isElena = otherName.includes('Elena');

          return (
            <TouchableOpacity
              style={styles.convoCard}
              onPress={() =>
                navigation.navigate('Chat', {
                  conversationId: item.id,
                  otherName,
                })
              }
              activeOpacity={0.88}
            >
              <View style={styles.avatarWrap}>
                <Avatar name={otherName} size={48} />
                {isElena && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#2E7A99" />
                  </View>
                )}
              </View>

              <View style={styles.convoBody}>
                <View style={styles.convoTop}>
                  <Text style={styles.convoName}>{otherName}</Text>
                  <Text style={styles.convoTime}>{time}</Text>
                </View>
                <Text style={styles.convoLast} numberOfLines={1}>
                  {lastMsg}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

function formatTime(isoString) {
  if (!isoString) return 'Just now';
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 24,
    paddingBottom: 10,
    backgroundColor: '#F8FAF9',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#473018',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#8C7D6A',
    marginTop: 3,
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#B8D3C3',
    paddingHorizontal: 14,
    height: 44,
    marginTop: 14,
    ...SHADOWS.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#473018',
    fontWeight: '500',
    paddingVertical: 0,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  convoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    ...SHADOWS.sm,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  convoBody: {
    flex: 1,
  },
  convoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convoName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#473018',
  },
  convoTime: {
    fontSize: 11,
    color: '#8C7D6A',
    fontWeight: '500',
  },
  convoLast: {
    fontSize: 13,
    color: '#5C4E3A',
  },
  separator: {
    height: 10,
  },
});
