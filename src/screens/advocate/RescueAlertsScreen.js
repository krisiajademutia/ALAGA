import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES } from '../../constants/theme';
import RescueCard from '../../components/RescueCard';
import EmptyState from '../../components/EmptyState';

const FILTERS = ['Open', 'Responded', 'Rescued', 'All'];

export default function RescueAlertsScreen({ navigation }) {
  const { rescueReports, currentUser } = useApp();
  const [filter, setFilter] = useState('Open');

  const filtered = filter === 'All'
    ? rescueReports
    : rescueReports.filter((r) => r.status === filter);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Rescue Alerts</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            {f === 'Open' && rescueReports.filter((r) => r.status === 'Open').length > 0 && (
              <View style={styles.countDot}>
                <Text style={styles.countText}>{rescueReports.filter((r) => r.status === 'Open').length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="No alerts"
            subtitle={filter === 'Open' ? 'No open rescue cases right now.' : 'Nothing here yet.'}
          />
        }
        renderItem={({ item }) => (
          <RescueCard
            report={item}
            onPress={() => navigation.navigate('RescueAlertDetail', { reportId: item.id })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.paddingL, paddingTop: 56, paddingBottom: SIZES.paddingM,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: SIZES.large, fontWeight: '700', color: COLORS.textPrimary },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: SIZES.paddingL,
    marginBottom: SIZES.paddingM, gap: 8, flexWrap: 'wrap',
  },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: SIZES.radiusFull, backgroundColor: COLORS.inputBg,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: SIZES.small, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: '#fff' },
  countDot: {
    backgroundColor: COLORS.danger, borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  countText: { fontSize: 10, color: '#fff', fontWeight: '800' },
  list: { paddingHorizontal: SIZES.paddingL, paddingBottom: 100 },
});
