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
          <Text style={styles.subheader}>Sdílej tipy, úlovky a zkušenosti s rybáři.</Text>
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
          placeholderTextColor="#7f7f7a"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={{ marginBottom: 16 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, categoryFilter === item && styles.chipActive]}
              onPress={() => setCategoryFilter(item)}
            >
              <Text style={[styles.chipText, categoryFilter === item && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
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
          contentContainerStyle={styles.listContent}
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
    fontSize: 26,
    fontWeight: '700',
    color: '#1a5c3a',
  },
  subheader: {
    marginTop: 4,
    color: '#5a5a55',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#1a5c3a',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
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
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: '#1a5c3a',
    borderColor: '#1a5c3a',
  },
  chipText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
  },
  loader: {
    marginTop: 40,
  },

  error: {
    marginTop: 20,
    color: '#c0392b',
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  empty: {
    marginTop: 20,
    color: '#5a5a55',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f3f3',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
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

});
