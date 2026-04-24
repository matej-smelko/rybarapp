import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getPosts } from '../api/backend';

export default function ForumScreen({ navigation }) {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      {loading ? (
        <ActivityIndicator style={styles.loader} color="#1a5c3a" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (!posts || posts.length === 0) ? (
        <Text style={styles.empty}>Zatím nejsou žádné příspěvky.</Text>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PostDetail', { post: item })}>
              <View style={styles.cardHeader}>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.date}>{item.created_at || item.date}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
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
    backgroundColor: '#f5f3ee',
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
