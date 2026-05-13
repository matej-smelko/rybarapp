import React, { useCallback, useState, useMemo, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getFisheries, deleteFishery } from '../api/backend';

function RevirCard({ item, isAdmin, onMenu }) {
  function typColor(typ) {
    return typ === 'pstruhové' || typ === 'pstruhový' ? '#2e7daf' : '#1a5c3a';
  }

  function isPstruhove(typ) {
    return typ === 'pstruhové' || typ === 'pstruhový';
  }

  function displayTyp(typ) {
    return isPstruhove(typ) ? 'pstruhový' : 'mimopstruhový';
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.iconWrapper, { backgroundColor: typColor(item.typ) + '18' }]}>
          <Text style={styles.iconEmoji}>🌊</Text>
        </View>
        <View style={styles.cardText}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.revirName} numberOfLines={1}>{item.name}</Text>
            {isAdmin && (
              <TouchableOpacity onPress={() => onMenu(item)} style={styles.menuBtn}>
                <Text style={styles.menuDots}>⋮</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.badgeRow}>
            <View style={[styles.typBadge, { backgroundColor: typColor(item.typ) }]}>
              <Text style={styles.typBadgeText}>{displayTyp(item.typ)}</Text>
            </View>
            {item.cislo && (
              <Text style={styles.cisloText}>č. {item.cislo}</Text>
            )}
          </View>
          <Text style={styles.metaText}>{item.location || item.obec || '?'}{item.region ? ` • ${item.region}` : ''}</Text>
            {item.river_basin && <Text style={styles.metaText}>💧 {item.river_basin}</Text>}
        </View>
      </View>
    </View>
  );
}

const MemoCard = React.memo(RevirCard);

export default function ReviryScreen({ navigation }) {
  const { user, token } = useAuth();
  const [reviry, setReviry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typFilter, setTypFilter] = useState('vše');
  const isAdmin = user?.role === 'admin';
  const flatRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        try {
          const data = await getFisheries(token);
          setReviry(data);
        } catch {
          setReviry([]);
        } finally { setLoading(false); }
      }
      load();
    }, [token])
  );

  const filtered = useMemo(() => {
    let list = reviry;
    if (typFilter !== 'vše') {
      list = list.filter(f => f.typ === typFilter || f.typ === (typFilter === 'kaprové' ? 'mimopstruhový' : 'pstruhový'));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(f =>
        (f.name || '').toLowerCase().includes(q) ||
        (f.cislo || '').includes(q) ||
        (f.location || f.obec || '').toLowerCase().includes(q) ||
        (f.region || '').toLowerCase().includes(q) ||
        (f.river_basin || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [reviry, search, typFilter]);

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

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.header}>Revíry</Text>
            <Text style={styles.subheader}>{filtered.length} z {reviry.length} revírů</Text>
          </View>
          {isAdmin && (
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AdminRevirForm')}>
              <Text style={styles.addButtonText}>+ Přidat revír</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Hledat revír, číslo, obec..."
            placeholderTextColor="#7f7f7a"
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['Vše', 'Mimopstruhový', 'Pstruhový']}
            keyExtractor={item => item}
            renderItem={({ item }) => {
              const val = item === 'Vše' ? 'vše' : item === 'Mimopstruhový' ? 'kaprové' : 'pstruhové';
              return (
                <TouchableOpacity
                  style={[styles.chip, typFilter === val && styles.chipActive]}
                  onPress={() => setTypFilter(val)}
                >
                  <Text style={[styles.chipText, typFilter === val && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} color="#1a5c3a" />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Žádné revíry nenalezeny</Text>
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MemoCard item={item} isAdmin={isAdmin} onMenu={handleMenu} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            windowSize={5}
            initialNumToRender={12}
            maxToRenderPerBatch={15}
            removeClippedSubviews={true}
            onScrollToIndexFailed={({ index, averageItemLength }) => {
              const offset = index * averageItemLength;
              flatRef.current?.scrollToOffset({ offset, animated: false });
              setTimeout(() => {
                flatRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 });
              }, 50);
            }}
          />
          )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  header: { fontSize: 26, fontWeight: '700', color: '#1a5c3a' },
  subheader: { marginTop: 4, color: '#5a5a55', fontSize: 14 },
  addButton: { backgroundColor: '#1a5c3a', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 15 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  listContent: { paddingBottom: 20 },
  loader: { marginTop: 50 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#999' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#edeae2', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 18 },
  searchIcon: { fontSize: 16, color: '#7f7f7a', marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#1a1a18', padding: 0 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', marginRight: 10 },
  chipActive: { backgroundColor: '#1a5c3a', borderColor: '#1a5c3a' },
  chipText: { color: '#666', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff', borderRadius: 15, padding: 14, marginBottom: 12,
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
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  typBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  cisloText: { fontSize: 12, color: '#888', fontWeight: '600' },
  metaText: { fontSize: 12, color: '#999', marginTop: 4 },
});