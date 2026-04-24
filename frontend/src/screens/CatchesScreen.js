import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getCatches } from '../api/backend';
import fishData from '../data/fish';

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

  const filteredCatches = useMemo(() => {
    return selectedSpecies === 'Vše'
      ? catches
      : catches.filter((item) => item.species === selectedSpecies);
  }, [catches, selectedSpecies]);

  const categories = useMemo(() => {
    const speciesCount = catches.reduce((counts, item) => {
      counts[item.species] = (counts[item.species] || 0) + 1;
      return counts;
    }, {});

    return [
      'Vše',
      ...Object.entries(speciesCount)
        .sort((a, b) => b[1] - a[1])
        .map(([species]) => species),
    ];
  }, [catches]);

  const totals = useMemo(() => {
    const totalWeight = catches.reduce((sum, item) => sum + Number(item.weight_g || 0), 0);
    const heaviest = catches.reduce((max, item) => Math.max(max, Number(item.weight_g || 0)), 0);
    return {
      count: catches.length,
      totalWeight,
      heaviest,
    };
  }, [catches]);

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const formatWeight = (grams) => {
    const value = Number(grams || 0);
    return value >= 1000 ? `${(value / 1000).toFixed(2)} kg` : `${value} g`;
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
  };

  const findFishImage = (species) => {
    const fish = fishData.find((item) => item.name === species);
    return fish?.image || null;
  };

  useFocusEffect(
    useCallback(() => {
      loadCatches();
    }, [loadCatches])
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.header}>Moje úlovky</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddCatch')}>
          <Text style={styles.addButtonText}>+ Přidat</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardSmall]}>
          <Text style={styles.statValue}>{totals.count}</Text>
          <Text style={styles.statLabel}>Celkem</Text>
        </View>
        <View style={[styles.statCard, styles.statCardLarge]}>
          <Text style={styles.statValue}>{formatWeight(totals.totalWeight)}</Text>
          <Text style={styles.statLabel}>Celková váha</Text>
        </View>
        <View style={[styles.statCard, styles.statCardSmall, styles.statLast]}>
          <Text style={styles.statValue}>{formatWeight(totals.heaviest)}</Text>
          <Text style={styles.statLabel}>Největší</Text>
        </View>
      </View>

      <View style={styles.filtersRow}>
        {categories.map((species) => (
          <TouchableOpacity
            key={species}
            style={[
              styles.filterChip,
              selectedSpecies === species && styles.filterChipActive,
            ]}
            onPress={() => setSelectedSpecies(species)}
          >
            <Text style={selectedSpecies === species ? styles.filterTextActive : styles.filterText}>
              {species}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#1a5c3a" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : filteredCatches.length === 0 ? (
        <Text style={styles.empty}>Žádné úlovky pro vybranou kategorii.</Text>
      ) : (
        <FlatList
          data={filteredCatches}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const image = findFishImage(item.species);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate('CatchDetail', {
                    catchId: item.id,
                    catchItem: item,
                  })
                }
              >
                <View style={styles.cardRow}>
                  <View style={styles.iconWrapper}>
                    {image ? (
                      <Image source={image} style={styles.icon} resizeMode="contain" />
                    ) : (
                      <Text style={styles.iconFallback}>{item.species?.[0] || '?'}</Text>
                    )}
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.species}>{item.species}</Text>
                    <Text style={styles.meta}>{formatDate(item.caught_date)} • {item.revir}</Text>
                    {item.note ? <Text style={styles.note}>“{item.note}”</Text> : null}
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{formatWeight(item.weight_g)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f3ee',
  },
  userBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a5c3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitials: {
    color: '#fff',
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a5c3a',
  },
  addButton: {
    backgroundColor: '#1a5c3a',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center',
  },
  statCardSmall: {
    flex: 1,
    marginRight: 10,
  },
  statCardLarge: {
    flex: 1.5,
    marginRight: 10,
  },
  statLast: {
    marginRight: 0,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a5c3a',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#5a5a55',
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  filterChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#f1f2ef',
    marginRight: 10,
    marginBottom: 10,
  },
  filterChipActive: {
    backgroundColor: '#1a5c3a',
  },
  filterText: {
    color: '#1a5c3a',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  loader: {
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 8,
  },
  error: {
    marginTop: 20,
    color: '#c0392b',
    fontSize: 15,
  },
  empty: {
    marginTop: 20,
    color: '#5a5a55',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#eef1ec',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  icon: {
    width: 32,
    height: 32,
  },
  iconFallback: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a5c3a',
  },
  cardText: {
    flex: 1,
  },
  species: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a5c3a',
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    color: '#5a5a55',
  },
  badge: {
    backgroundColor: '#e6f2e8',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  note: {
    marginTop: 6,
    fontSize: 13,
    fontStyle: 'italic',
    color: '#5a5a55',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a5c3a',
  },
  divider: {
    height: 12,
  },
});
