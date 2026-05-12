import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getPosts, toggleLike } from '../api/backend';

const CATEGORIES = ['Vše', 'Tipy', 'Úlovky', 'Vybavení', 'Diskuse'];

function formatCZ(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

// Pomocná funkce pro získání iniciál ze jména
function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
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
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  async function handleToggleLike(postId) {
    try {
      const result = await toggleLike(token, postId);
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, liked: result.liked, likes_count: (p.likes_count || 0) + (result.liked ? 1 : -1) }
          : p
      ));
    } catch {}
  }

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
          <Text style={styles.subheader}>Komunita rybářů</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddPost')}>
          <Text style={styles.addButtonText}>+ Nový příspěvek</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔎</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Hledat..."
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
        <ActivityIndicator style={styles.loader} color="#1a5c3a" size="large" />
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            // Použijeme jméno z databáze (pokud ho máš jako author_name)
            const authorName = item.author_name || "Anonymní Rybář";
            const initials = getInitials(authorName);
            
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View>
                      <Text style={styles.authorName}>{authorName}</Text>
                      <Text style={styles.date}>{formatCZ(item.created_at || item.date)}</Text>
                    </View>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.body} numberOfLines={3}>{item.body}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.stats}>
                    <TouchableOpacity style={styles.statItem} onPress={() => handleToggleLike(item.id)}>
                      <Text style={[styles.heartIcon, item.liked && styles.heartActive]}>
                        {item.liked ? '♥' : '♡'}
                      </Text>
                      <Text style={styles.statText}>{item.likes_count || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('PostDetail', { post: item })}>
                      <Text style={styles.statIcon}>💬</Text>
                      <Text style={styles.statText}>{item.comments_count || 0}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fcfcfc' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  header: { fontSize: 28, fontWeight: '800', color: '#1a5c3a' },
  subheader: { color: '#5a5a55', fontSize: 14 },
  addButton: { backgroundColor: '#1a5c3a', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0ed', borderRadius: 15, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  chip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', marginRight: 10 },
  chipActive: { backgroundColor: '#1a5c3a', borderColor: '#1a5c3a' },
  chipText: { color: '#666', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  listContent: { paddingBottom: 30 },
  loader: { marginTop: 50 },

  /* KARTA PŘÍSPĚVKU */
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a5c3a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  authorName: { fontSize: 16, fontWeight: '700', color: '#1a1a18' },
  date: { color: '#7f7f7a', fontSize: 12 },
  categoryBadge: { backgroundColor: '#edeae2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { color: '#1a5c3a', fontWeight: '700', fontSize: 10, textTransform: 'uppercase' },
  cardContent: { marginBottom: 15 },
  title: { fontSize: 18, fontWeight: '800', color: '#1a1a18', marginBottom: 6 },
  body: { fontSize: 14, color: '#444', lineHeight: 20 },
  
  /* FOOTER S LIKY */
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8f8f8',
    paddingTop: 12,
  },
  stats: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  heartIcon: { fontSize: 18, marginRight: 4, color: '#999' },
  heartActive: { color: '#e74c3c' },
  statText: { fontSize: 14, fontWeight: '600', color: '#555' },

});