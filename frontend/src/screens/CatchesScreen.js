import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getCatches, deleteCatch } from '../api/backend';
// Importujeme mapování obrázků (vytvořili jsme ho v minulém kroku)
import { FISH_IMAGES, getFishImageKey } from '../img/fishImages';

export default function CatchesScreen({ navigation }) {
  const { token, user } = useAuth();
  const [catches, setCatches] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState('Vše');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCatches(token);
      setCatches(data);
      setError(null);
    } catch (err) {
      setError('Nelze načíst úlovky.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadCatches();
    }, [loadCatches])
  );

  // Filtrování podle vybrané ryby
  const filteredCatches = useMemo(() => {
    return selectedSpecies === 'Vše'
      ? catches
      : catches.filter((item) => item.species === selectedSpecies);
  }, [catches, selectedSpecies]);

  // Výpočty pro statistiky (podle aktuálního filtru)
  const totals = useMemo(() => {
    const totalWeight = filteredCatches.reduce((sum, item) => sum + Number(item.weight_g || 0), 0);
    const heaviest = filteredCatches.reduce((max, item) => Math.max(max, Number(item.weight_g || 0)), 0);
    return {
      count: filteredCatches.length,
      totalWeight: (totalWeight / 1000).toFixed(2),
      heaviest: (heaviest / 1000).toFixed(2),
    };
  }, [filteredCatches]);

  const categories = useMemo(() => {
    const speciesList = [...new Set(catches.map(c => c.species))];
    return ['Vše', ...speciesList];
  }, [catches]);

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(p => p[0]).join('').toUpperCase();
  };

  const renderCatchItem = ({ item }) => {
    const imageKey = getFishImageKey(item.species);
    const hasUserPhoto = item.image_url && item.image_url !== '';
    const imageSource = hasUserPhoto 
      ? { uri: item.image_url } 
      : (FISH_IMAGES[imageKey] || FISH_IMAGES['default']);

    function handleMenu() {
      Alert.alert('Možnosti', null, [
        { text: 'Editovat', onPress: () => navigation.navigate('AddCatch', { editCatch: item }) },
        { text: 'Smazat', style: 'destructive', onPress: () => {
          Alert.alert('Smazat úlovek', 'Opravdu chcete smazat tento úlovek?', [
            { text: 'Zrušit', style: 'cancel' },
            { text: 'Smazat', style: 'destructive', onPress: async () => {
              try {
                await deleteCatch(token, item.id);
                setCatches(prev => prev.filter(c => c.id !== item.id));
              } catch (err) {
                Alert.alert('Chyba', 'Nelze smazat úlovek.');
              }
            }},
          ]);
        }},
        { text: 'Zrušit', style: 'cancel' },
      ]);
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CatchDetail', { catchId: item.id, catchItem: item })}
      >
        <View style={styles.cardRow}>
          <View style={styles.iconWrapper}>
            <Image 
              source={imageSource} 
              style={styles.icon} 
              resizeMode={hasUserPhoto ? "cover" : "contain"} 
            />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.speciesTitle}>{item.species}</Text>
            <Text style={styles.metaText}>{item.revir} • {new Date(item.caught_date).toLocaleDateString('cs-CZ')}</Text>
            {item.note ? <Text style={styles.noteText} numberOfLines={1}>“{item.note}”</Text> : null}
          </View>
          <View style={styles.rightColumn}>
            {user && item.user_id === user.id && (
              <TouchableOpacity onPress={handleMenu} style={styles.menuBtn}>
                <Text style={styles.menuDots}>⋮</Text>
              </TouchableOpacity>
            )}
            <View style={styles.weightBadge}>
              <Text style={styles.weightText}>
                {item.weight_g >= 1000 ? `${(item.weight_g/1000).toFixed(2)} kg` : `${item.weight_g} g`}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* TITULEK + PŘIDAT */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.header}>Moje úlovky</Text>
            <Text style={styles.subheader}>Přehled tvých úlovků</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddCatch')}>
            <Text style={styles.addButtonText}>+ Přidat</Text>
          </TouchableOpacity>
        </View>

        {/* STATISTIKY (Boxy z prototypu) */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totals.count}</Text>
            <Text style={styles.statLabel}>Celkem</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totals.totalWeight} kg</Text>
            <Text style={styles.statLabel}>Celková váha</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totals.heaviest} kg</Text>
            <Text style={styles.statLabel}>Největší</Text>
          </View>
        </View>

        {/* FILTRY (Horizontální list) */}
        <View style={{marginBottom: 15}}>
            <FlatList 
                horizontal
                showsHorizontalScrollIndicator={false}
                data={categories}
                keyExtractor={item => item}
                renderItem={({item}) => (
                    <TouchableOpacity 
                        style={[styles.filterChip, selectedSpecies === item && styles.filterActive]}
                        onPress={() => setSelectedSpecies(item)}
                    >
                        <Text style={[styles.filterText, selectedSpecies === item && styles.filterTextActive]}>{item}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} color="#1a5c3a" />
        ) : (
          <FlatList
            data={filteredCatches}
            keyExtractor={(item) => item.id}
            renderItem={renderCatchItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  topBar: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' 
  },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#1a5c3a' },
  userSection: { flexDirection: 'row', alignItems: 'center' },
  userNameText: { marginRight: 10, fontWeight: '500', color: '#333' },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#d1e7dd', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#1a5c3a', fontWeight: 'bold', fontSize: 13 },

  container: { flex: 1, paddingHorizontal: 20, backgroundColor: '#fff' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
  header: { fontSize: 26, fontWeight: '700', color: '#1a5c3a' },
  subheader: { marginTop: 4, color: '#5a5a55', fontSize: 14 },
  addButton: { backgroundColor: '#1a5c3a', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 15 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { 
    backgroundColor: '#edeae2', width: '31%', paddingVertical: 15, borderRadius: 15, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1a5c3a' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4 },

  filterChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', marginRight: 10 },
  filterActive: { backgroundColor: '#1a5c3a', borderColor: '#1a5c3a' },
  filterText: { color: '#666', fontWeight: '500' },
  filterTextActive: { color: '#fff' },

  listContent: { paddingBottom: 20 },
  card: { 
    backgroundColor: '#fff', borderRadius: 15, padding: 12, marginBottom: 15,
    borderWidth: 1, borderColor: '#f3f3f3', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { width: 55, height: 55, borderRadius: 12, backgroundColor: '#f9f9f9', justifyContent: 'center', alignItems: 'center' },
  icon: { width: '85%', height: '85%' },
  cardText: { flex: 1, marginLeft: 15 },
  rightColumn: { alignItems: 'center' },
  menuBtn: { padding: 4, marginTop: 4 },
  menuDots: { fontSize: 18, fontWeight: '700', color: '#999' },
  speciesTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  metaText: { fontSize: 12, color: '#999', marginTop: 2 },
  noteText: { fontSize: 12, color: '#777', fontStyle: 'italic', marginTop: 4 },
  weightBadge: { backgroundColor: '#f0f9f4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  weightText: { color: '#1a5c3a', fontWeight: 'bold', fontSize: 12 },
  loader: { marginTop: 50 }
});