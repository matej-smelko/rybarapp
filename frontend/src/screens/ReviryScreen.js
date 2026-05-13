import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getFisheries, deleteFishery } from '../api/backend';

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
          setReviry([]);
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

  function typColor(typ) {
    return typ === 'pstruhové' ? '#2e7daf' : '#1a5c3a';
  }

  const renderItem = ({ item }) => {
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
                <TouchableOpacity onPress={() => handleMenu(item)} style={styles.menuBtn}>
                  <Text style={styles.menuDots}>⋮</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.badgeRow}>
              <View style={[styles.typBadge, { backgroundColor: typColor(item.typ) }]}>
                <Text style={styles.typBadgeText}>{item.typ}</Text>
              </View>
              {item.cislo && (
                <Text style={styles.cisloText}>č. {item.cislo}</Text>
              )}
            </View>
            <Text style={styles.metaText}>{item.obec || '?'}{item.region ? ` • ${item.region}` : ''}</Text>
            <View style={styles.sizeRow}>
              {item.km && <Text style={styles.sizeText}>📏 {item.km} km</Text>}
              {item.ha && <Text style={styles.sizeText}>🌊 {item.ha} ha</Text>}
            </View>
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
            <Text style={styles.subheader}>{reviry.length} revírů</Text>
          </View>
          {isAdmin && (
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AdminRevirForm')}>
              <Text style={styles.addButtonText}>+ Přidat revír</Text>
            </TouchableOpacity>
          )}
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
  header: { fontSize: 26, fontWeight: '700', color: '#1a5c3a' },
  subheader: { marginTop: 4, color: '#5a5a55', fontSize: 14 },
  addButton: { backgroundColor: '#1a5c3a', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 15 },
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
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  typBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  cisloText: { fontSize: 12, color: '#888', fontWeight: '600' },
  metaText: { fontSize: 12, color: '#999', marginTop: 4 },
  sizeRow: { flexDirection: 'row', marginTop: 5, gap: 12 },
  sizeText: { fontSize: 12, color: '#666' },
});
