import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getPosts, toggleLike, deletePost } from '../api/backend';

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
  const { token, user } = useAuth();
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

  function handleDeletePost(postId) {
    Alert.alert('Smazat příspěvek', 'Opravdu chcete smazat tento příspěvek i se všemi komentáři?', [
      { text: 'Zrušit', style: 'cancel' },
      { text: 'Smazat', style: 'destructive', onPress: async () => {
        try {
          await deletePost(token, postId);
          setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (err) {
          Alert.alert('Chyba', err.response?.data?.error || 'Nelze smazat příspěvek.');
        }
      }},
    ]);
  }

  function handleMenuPress(item) {
    Alert.alert('Možnosti', null, [
      { text: 'Editovat', onPress: () => navigation.navigate('AddPost', { editPost: item }) },
      { text: 'Smazat', style: 'destructive', onPress: () => handleDeletePost(item.id) },
      { text: 'Zrušit', style: 'cancel' },
    ]);
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
                    <View style={styles.headerRight}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                      </View>
                      {user && item.user_id === user.id && (
                        <TouchableOpacity onPress={() => handleMenuPress(item)} style={styles.menuBtn}>
                          <Text style={styles.menuDots}>⋮</Text>
                        </TouchableOpacity>
                      )}
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
  container: { flex: 1, padding: 20, backgroundColor: '#ffffff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  header: { fontSize: 26, fontWeight: '700', color: '#1a5c3a' },
  subheader: { marginTop: 4, color: '#5a5a55', fontSize: 14 },
  addButton: { backgroundColor: '#1a5c3a', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 15 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#edeae2', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 18 },
  searchIcon: { fontSize: 16, color: '#7f7f7a', marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#1a1a18', padding: 0 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', marginRight: 10 },
  chipActive: { backgroundColor: '#1a5c3a', borderColor: '#1a5c3a' },
  chipText: { color: '#666', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  listContent: { paddingBottom: 20 },
  loader: { marginTop: 50 },

  /* KARTA PŘÍSPĚVKU */
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a5c3a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  authorName: { fontSize: 15, fontWeight: '600', color: '#1a1a18' },
  date: { color: '#8a8a82', fontSize: 11, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  menuBtn: { marginLeft: 8, padding: 4 },
  menuDots: { fontSize: 18, fontWeight: '700', color: '#999' },
  categoryBadge: { backgroundColor: '#e8f4ed', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryText: { color: '#1a5c3a', fontWeight: '600', fontSize: 11 },
  cardContent: { marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#1a1a18', marginBottom: 6 },
  body: { fontSize: 14, color: '#5a5a55', lineHeight: 20 },
  
  /* FOOTER S LIKY */
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  stats: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  heartIcon: { fontSize: 18, marginRight: 5, color: '#999' },
  heartActive: { color: '#e74c3c' },
  statIcon: { fontSize: 15, marginRight: 5 },
  statText: { fontSize: 13, fontWeight: '600', color: '#666' },
});