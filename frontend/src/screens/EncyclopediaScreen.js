import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import fishData from '../data/fish';

const { width } = Dimensions.get('window');
const cardWidth = Math.max((width - 60) / 2, 160);

export default function EncyclopediaScreen({ navigation }) {
  const [query, setQuery] = useState('');

  const filteredFish = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return fishData;
    return fishData.filter((fish) =>
      fish.name.toLowerCase().includes(lower) || fish.latin.toLowerCase().includes(lower)
    );
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.header}>Encyklopedie ryb</Text>
          <Text style={styles.subheader}>{fishData.length} druhů</Text>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔎</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Hledat rybu..."
          placeholderTextColor="#7f7f7a"
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <FlatList
        data={filteredFish}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { width: cardWidth }]}
            onPress={() => navigation.navigate('FishDetail', { fish: item })}
          >
            <View style={styles.imageWrapper}>
              <Image source={item.image} style={styles.image} resizeMode="contain" />
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.latin}>{item.latin}</Text>
            <View style={styles.footerRow}>
              <Text style={styles.mir}>MÍR: {item.mir}</Text>
              <View style={styles.difficultyRow}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.bullet,
                      index < item.difficulty ? styles.bulletActive : styles.bulletInactive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f3ee',
  },
  headerRow: {
    marginBottom: 16,
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a5c3a',
  },
  subheader: {
    marginTop: 4,
    color: '#5a5a55',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edeae2',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 18,
  },
  searchIcon: {
    fontSize: 16,
    color: '#7f7f7a',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a18',
    padding: 0,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    minHeight: 320,
    justifyContent: 'space-between',
  },
  imageWrapper: {
    height: 110,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a5c3a',
    textAlign: 'center',
    marginBottom: 0,
    lineHeight: 20,
  },
  latin: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#5a5a55',
    textAlign: 'center',
    marginTop: -2,
    marginBottom: 4,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mir: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a5c3a',
  },
  difficultyRow: {
    flexDirection: 'row',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  bulletActive: {
    backgroundColor: '#1a5c3a',
  },
  bulletInactive: {
    backgroundColor: '#e5e5e0',
  },
  separator: {
    height: 0,
  },
  listContent: {
    paddingBottom: 80,
  },
});
