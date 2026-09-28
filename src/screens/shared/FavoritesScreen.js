import React from 'react';
import { View, Text, FlatList, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { COLORS, FONTS } from '../../constants/theme';
import AnimalCard from '../../components/AnimalCard';
import EmptyState from '../../components/EmptyState';

export default function FavoritesScreen({ navigation }) {
  const { animals = [], favoriteAnimalIds = [] } = useApp();
  const favorites = animals.filter((animal) => favoriteAnimalIds.includes(String(animal.id)) && animal.status === 'Available');
  const insets = useSafeAreaInsets();
  const safeTop = Platform.OS === 'ios'
    ? Math.max(insets.top, 16) + 4
    : insets.top > 24 ? insets.top + 6 : 14;
  const rows = [];
  for (let i = 0; i < favorites.length; i += 2) rows.push([favorites[i], favorites[i + 1] || null]);
  return <View style={styles.root}>
    <StatusBar style="dark" />
    <View style={[styles.header, { paddingTop: safeTop }]}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Favorites</Text>
        <View style={styles.countBadge}><Text style={styles.count}>{favorites.length} Saved</Text></View>
      </View>
    </View>
    {!rows.length ? <EmptyState icon="heart-outline" title="No favorites yet" subtitle="Tap the heart on an animal to save it here." /> :
      <FlatList data={rows} keyExtractor={(_, i) => String(i)} contentContainerStyle={styles.list}
        renderItem={({ item: [left, right] }) => <View style={styles.row}>
          <AnimalCard animal={left} horizontal style={styles.card} onPress={() => navigation.navigate('AnimalDetail', { animalId: left.id })} />
          {right ? <AnimalCard animal={right} horizontal style={styles.card} onPress={() => navigation.navigate('AnimalDetail', { animalId: right.id })} /> : <View style={styles.card} />}
        </View>} />}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0ECE4' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...FONTS.titleXl, fontSize: 22, fontWeight: '800', color: COLORS.brown },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#EBF7FA', borderWidth: 1, borderColor: '#B8E4E5' },
  count: { fontSize: 11.5, fontWeight: '700', color: '#2E7A99' },
  list: { padding: 12, paddingBottom: 110 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  card: { flex: 1 },
});
