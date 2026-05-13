import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getFisheries, deleteFishery } from '../api/backend';

const MOCK_REVIRY = [
  { id: 'revir-ostravice', name: 'Revír Ostravice č. 1', location: 'Ostravice', river_basin: 'Odra', fish: ['Kapr', 'Štika', 'Pstruh', 'Okoun'], rating: 4, desc: 'Populární revír s pestrou skladbou ryb. Doporučuji místa u jezu.' },
  { id: 'revir-odra', name: 'Revír Odra – Svinov', location: 'Ostrava-Svinov', river_basin: 'Odra', fish: ['Štika', 'Candát', 'Okoun', 'Kapr'], rating: 5, desc: 'Kvalitní dravčí revír se silnými kusy. Vhodný pro přívlač.' },
  { id: 'revir-olse', name: 'Revír Olše – Těšín', location: 'Český Těšín', river_basin: 'Odra', fish: ['Pstruh', 'Lipan', 'Jelec'], rating: 3, desc: 'Krásné pstruhové vody v podhůří Beskyd.' },
  { id: 'revir-morava', name: 'Revír Morava – Olomouc', location: 'Olomouc', river_basin: 'Morava', fish: ['Kapr', 'Cejn', 'Plotice', 'Štika'], rating: 4, desc: 'Nížinný revír s bohatou populací kaprovitých ryb.' },
  { id: 'revir-becva', name: 'Revír Bečva – Přerov', location: 'Přerov', river_basin: 'Morava', fish: ['Pstruh', 'Parma', 'Ostroretka'], rating: 4, desc: 'Podhorský revír s proudnou vodou. Ráj muškařů.' },
  { id: 'harta', name: 'Přehrada Slezská Harta', location: 'Budišov nad Budišovkou', river_basin: 'Morava', fish: ['Candát', 'Kapr', 'Štika', 'Sumec'], rating: 5, desc: 'Vyhlášená přehrada na dravce. Nejlepší je lov z lodi.' },
];

const FISH_BY_KEYWORD = {
  'Kapr': 'Kapr', 'Štika': 'Štika', 'Pstruh': 'Pstruh', 'Okoun': 'Okoun',
  'Candát': 'Candát', 'Sumec': 'Sumec', 'Cejn': 'Cejn', 'Plotice': 'Plotice',
  'Lipan': 'Lipan', 'Jelec': 'Jelec', 'Parma': 'Parma', 'Ostroretka': 'Ostroretka',
};

function guessFish(desc, name) {
  const found = [];
  for (const [kw, fish] of Object.entries(FISH_BY_KEYWORD)) {
    if (desc.includes(kw) || name.includes(kw)) found.push(fish);
  }
  return found.length > 0 ? found : ['Kapr', 'Okoun'];
}

function stars(rating) {
  return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
}

export default function ReviryScreen({ navigation }) {
  const { user, token } = useAuth();
  const [reviry, setReviry] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        try {
          const data = await getFisheries(token);
          setReviry(data);
        } catch {
          setReviry(MOCK_REVIRY);
        } finally { setLoading(false); }
      }
      load();
    }, [token])
  );

  function handleMenu(item) {
    Alert.alert(item.name, null, [
      { text: 'Editovat', onPress: () => navigation.navigate('AdminRevirForm', { editFishery: item }) },
      {
        text: 'Smazat', style: 'destructive', onPress: () => {
          Alert.alert('Smazat revír', `Opravdu smazat ${item.name}?`, [
            { text: 'Zrušit', style: 'cancel' },
            {
              text: 'Smazat', style: 'destructive', onPress: async () => {
                try {
                  await deleteFishery(token, item.id);
                  setReviry(prev => prev.filter(f => f.id !== item.id));
                } catch { Alert.alert('Chyba', 'Nelze smazat revír.'); }
              }
            },
          ]);
        }
      },
      { text: 'Zrušit', style: 'cancel' },
    ]);
  }

  function enrichItem(item) {
    const mock = MOCK_REVIRY.find(m => m.id === item.id);
    return {
      ...item,
      fish: mock?.fish || guessFish(item.description || '', item.name),
      rating: mock?.rating || 3,
      desc: item.description || mock?.desc || '',
    };
  }

  const renderItem = ({ item }) => {
    const r = enrichItem(item);
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.iconWrapper}>
            <Text style={styles.iconEmoji}>🗺️</Text>
          </View>
          <View style={styles.cardText}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.revirName} numberOfLines={1}>{r.name}</Text>
              {isAdmin && (
                <TouchableOpacity onPress={() => handleMenu(item)} style={styles.menuBtn}>
                  <Text style={styles.menuDots}>⋮</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.metaText}>{r.location || '?'} • Povodí {r.river_basin || '?'}</Text>
            <View style={styles.fishRow}>
              {r.fish.map((f, i) => (
                <View key={i} style={styles.fishChip}>
                  <Text style={styles.fishChipText}>{f}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.descText} numberOfLines={2}>{r.desc}</Text>
            <Text style={styles.ratingText}>{stars(r.rating)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.header}>Revíry</Text>
            <Text style={styles.subheader}>Přehled revírů v MS kraji</Text>
          </View>
          <View style={styles.titleRight}>
            <Text style={styles.count}>{reviry.length} revírů</Text>
            {isAdmin && (
              <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AdminRevirForm')}>
                <Text style={styles.addButtonText}>+ Přidat</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} color="#1a5c3a" />
        ) : (
          <FlatList
            data={reviry}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: '#fff' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
  titleRight: { alignItems: 'flex-end', gap: 8 },
  header: { fontSize: 26, fontWeight: '700', color: '#1a5c3a' },
  subheader: { marginTop: 4, color: '#5a5a55', fontSize: 14 },
  count: { fontSize: 14, color: '#5a5a55', fontWeight: '600' },
  addButton: { backgroundColor: '#1a5c3a', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 15, marginTop: 6 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  listContent: { paddingBottom: 20 },
  loader: { marginTop: 50 },
  card: {
    backgroundColor: '#fff', borderRadius: 15, padding: 12, marginBottom: 15,
    borderWidth: 1, borderColor: '#f3f3f3', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrapper: { width: 55, height: 55, borderRadius: 12, backgroundColor: '#fef3e2', justifyContent: 'center', alignItems: 'center' },
  iconEmoji: { fontSize: 26 },
  cardText: { flex: 1, marginLeft: 15 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuBtn: { padding: 4 },
  menuDots: { fontSize: 18, fontWeight: '700', color: '#999' },
  revirName: { fontSize: 17, fontWeight: '700', color: '#333', flex: 1 },
  metaText: { fontSize: 12, color: '#999', marginTop: 3 },
  fishRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 4 },
  fishChip: { backgroundColor: '#e8f4ed', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  fishChipText: { fontSize: 11, fontWeight: '600', color: '#1a5c3a' },
  descText: { fontSize: 13, color: '#666', marginTop: 6, lineHeight: 18 },
  ratingText: { fontSize: 12, marginTop: 4 },
});
