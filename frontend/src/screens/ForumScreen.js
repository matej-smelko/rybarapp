import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getPosts } from '../api/backend';

const CATEGORIES = ['Vše', 'Tipy', 'Úlovky', 'Vybavení', 'Diskuse'];

function formatCZ(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

export default function ForumScreen({ navigation }) {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('Vše');
  const [searchQuery, setSearchQuery] = useState('');

  const loadPosts = useCallback(async () => {
    if (!token) {
      setPosts([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getPosts(token);
      setPosts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setPosts([]);
      setError('Nelze načíst fórum.');
      Alert.alert('Chyba', 'Nelze načíst fórum.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (categoryFilter !== 'Vše') {
      result = result.filter(p => p.category === categoryFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, categoryFilter, searchQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.header}>Fórum</Text>
          <Text style={styles.caption}>Sdílej tipy, úlovky a zkušenosti s rybáři.</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddPost')}>
          <Text style={styles.addButtonText}>+ Přidat</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔎</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Hledat v příspěvcích..."
          placeholderTextColor="#8a8a82"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.chipRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, categoryFilter === cat && styles.chipActive]}
            onPress={() => setCategoryFilter(cat)}
          >
            <Text style={[styles.chipText, categoryFilter === cat && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#1a5c3a" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : filteredPosts.length === 0 ? (
        <Text style={styles.empty}>Žádné příspěvky neodpovídají filtru.</Text>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PostDetail', { post: item })}>
              <View style={styles.cardHeader}>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.date}>{formatCZ(item.created_at || item.date)}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={3}>{item.body}</Text>
            </TouchableOpacity>
          )}
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
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    paddingHorizontal: 14,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0ede7',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a18',
    padding: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f0ede7',
  },
  chipActive: {
    backgroundColor: '#1a5c3a',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5a5a55',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  loader: {
    marginTop: 40,
  },
  caption: {
    color: '#5a5a55',
    marginBottom: 12,
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
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  category: {
    color: '#1a5c3a',
    fontWeight: '700',
  },
  date: {
    color: '#5a5a55',
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: '#333',
  },
  divider: {
    height: 12,
  },
});
