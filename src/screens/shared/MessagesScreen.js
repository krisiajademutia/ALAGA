import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';

export default function MessagesScreen({ navigation }) {
  const { getUserConversations, currentUser } = useApp();
  const convos = getUserConversations();

  const sorted = [...convos].sort(
    (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No messages yet"
            subtitle="Start a conversation from a rescue report or animal profile."
          />
        }
        renderItem={({ item }) => {
          const otherId = item.participants.find((p) => p !== currentUser?.id);
          const otherName = item.participantNames[otherId] || 'Unknown';
          const lastMsg = item.lastMessage;
          const time = formatTime(item.lastMessageTime);
          const unread = false; // placeholder

          return (
            <TouchableOpacity
              style={styles.convoItem}
              onPress={() =>
                navigation.navigate('Chat', {
                  conversationId: item.id,
                  otherName,
                })
              }
              activeOpacity={0.85}
            >
              <Avatar name={otherName} size={50} />
              <View style={styles.convoBody}>
                <View style={styles.convoTop}>
                  <Text style={styles.convoName}>{otherName}</Text>
                  <Text style={styles.convoTime}>{time}</Text>
                </View>
                <Text style={styles.convoLast} numberOfLines={1}>
                  {lastMsg}
                </Text>
              </View>
              {unread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0)
    return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-PH', { weekday: 'short' });
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SIZES.paddingL,
    paddingTop: Platform.OS === 'ios' ? 52 : 28,
    paddingBottom: SIZES.paddingM,
  },
  title: { fontSize: SIZES.xxlarge, fontWeight: '800', color: COLORS.textPrimary },
  list: { paddingHorizontal: SIZES.paddingL, paddingBottom: 100 },

  convoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.paddingM,
    gap: SIZES.paddingM,
  },
  convoBody: { flex: 1 },
  convoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  convoName: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.textPrimary },
  convoTime: { fontSize: SIZES.xsmall, color: COLORS.textMuted },
  convoLast: { fontSize: SIZES.small, color: COLORS.textSecondary },
  separator: { height: 1, backgroundColor: COLORS.divider },
  unreadDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
});
