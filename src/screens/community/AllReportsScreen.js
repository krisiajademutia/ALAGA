import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES } from '../../constants/theme';
import RescueCard from '../../components/RescueCard';
import EmptyState from '../../components/EmptyState';

const FILTERS = ['All', 'Open', 'Responded', 'Rescued'];

export default function AllReportsScreen({ navigation }) {
  const { rescueReports } = useApp();
  const [filter, setFilter] = useState('All');

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
        <Text style={styles.navTitle}>All Reports</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="paw-outline" title="No reports found" subtitle="Try a different filter." />
        }
        renderItem={({ item }) => (
          <RescueCard
            report={item}
            onPress={() => navigation.navigate('ReportDetail', { reportId: item.id })}
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
    paddingHorizontal: SIZES.paddingL, paddingTop: Platform.OS === 'ios' ? 52 : 28, paddingBottom: SIZES.paddingM,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: SIZES.large, fontWeight: '700', color: COLORS.textPrimary },

  filterRow: {
    flexDirection: 'row', paddingHorizontal: SIZES.paddingL,
    marginBottom: SIZES.paddingM, gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: SIZES.radiusFull, backgroundColor: COLORS.inputBg,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: SIZES.small, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: '#fff' },

  list: { paddingHorizontal: SIZES.paddingL, paddingBottom: 100 },
});
