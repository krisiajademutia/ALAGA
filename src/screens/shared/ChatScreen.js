import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import Avatar from '../../components/Avatar';

export default function ChatScreen({ route, navigation }) {
  const { conversationId, otherName } = route.params || {};
  const { conversations, currentUser, sendMessage } = useApp();
  const [text, setText] = useState('');
  const flatRef = useRef(null);

  const convo =
    conversations.find((c) => c.id === conversationId) || conversations[0];
  const name = otherName || convo?.participantNames?.[convo?.participants?.find((p) => p !== currentUser?.id)] || 'Elena Ramos';
  const messages = convo?.messages || [];

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(convo.id, trimmed);
    setText('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      {/* ── Top Navbar ────────────────────────────────────── */}
      <View style={styles.navbar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color="#473018" />
        </TouchableOpacity>

        <View style={styles.navCenter}>
          <View style={styles.avatarCircle}>
            <Avatar name={name} size={36} />
          </View>
          <View style={styles.navTextWrap}>
            <Text style={styles.navName}>{name}</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.navSub}>Online · ALAGA Advocate</Text>
            </View>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* ── Messages List ─────────────────────────────────── */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.msgList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.datePillWrap}>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>Today, Aug 28</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isMine = item.senderId === currentUser?.id;
          return (
            <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowTheirs]}>
              {!isMine && (
                <View style={styles.senderAvatarWrap}>
                  <Avatar name={name} size={28} />
                </View>
              )}
              <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
                  {item.text}
                </Text>
                <View style={styles.timeRow}>
                  <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
                    {item.time?.includes('M') ? item.time : '10:20 AM'}
                  </Text>
                  {isMine && (
                    <Ionicons
                      name="checkmark-done"
                      size={14}
                      color="#2E7A99"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* ── Input Bar ─────────────────────────────────────── */}
      <View style={styles.inputBar}>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#8C7D6A"
            value={text}
            onChangeText={setText}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Ionicons name="paper-plane" size={18} color="#2E7A99" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
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
    gap: 10,
  },
  avatarCircle: {},
  navTextWrap: {},
  navName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#473018',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2D9E5F',
  },
  navSub: {
    fontSize: 11,
    color: '#2D9E5F',
    fontWeight: '700',
  },

  msgList: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  datePillWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  datePill: {
    backgroundColor: '#EEF2F0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C4E3A',
  },

  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  msgRowMine: {
    justifyContent: 'flex-end',
  },
  msgRowTheirs: {
    justifyContent: 'flex-start',
  },
  senderAvatarWrap: {
    marginRight: 8,
    marginTop: 4,
  },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: '#85CCE5',
    borderTopRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3EFF6',
    borderTopLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  bubbleTextMine: {
    color: '#1C3A47',
    fontWeight: '500',
  },
  bubbleTextTheirs: {
    color: '#473018',
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  bubbleTime: {
    fontSize: 10,
    color: '#8C7D6A',
  },
  bubbleTimeMine: {
    color: '#2E7A99',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF4F7',
  },
  inputWrap: {
    flex: 1,
    backgroundColor: '#F4F7F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
  },
  input: {
    fontSize: 13,
    color: '#473018',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#85CCE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
