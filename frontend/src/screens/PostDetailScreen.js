import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { addComment, toggleLike, getComments } from '../api/backend';

export default function PostDetailScreen({ route, navigation }) {
  const { token } = useAuth();
  const { post } = route.params;
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    async function loadComments() {
      try {
        const result = await getComments(token, post.id);
        setComments(result);
      } catch (err) {
        Alert.alert('Chyba', 'Nelze načíst komentáře.');
      } finally {
        setLoading(false);
      }
    }
    loadComments();
  }, [post.id, token]);

  async function onSubmitComment() {
    if (!commentText.trim()) return;
    try {
      const result = await addComment(token, post.id, commentText.trim());
      setComments((prev) => [...prev, result]);
      setCommentText('');
    } catch (err) {
      Alert.alert('Chyba', err.response?.data?.error || 'Nelze odeslat komentář.');
    }
  }

  async function onToggleLike() {
    try {
      const result = await toggleLike(token, post.id);
      setLiked(result.liked);
      setLikes((prev) => (result.liked ? prev + 1 : Math.max(prev - 1, 0)));
    } catch (err) {
      Alert.alert('Chyba', 'Nelze změnit lajky.');
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Zpět</Text>
      </TouchableOpacity>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.category}>{post.category}</Text>
          <Text style={styles.likes}>{likes} lajků</Text>
        </View>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.body}>{post.body}</Text>
        <Text style={styles.author}>Od {post.author_name}</Text>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionButton, liked && styles.actionButtonActive]} onPress={onToggleLike}>
          <Text style={[styles.actionText, liked && styles.actionTextActive]}>{liked ? 'Odlajkovat' : 'Lajkovat'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Komentáře</Text>
      {loading ? (
        <ActivityIndicator color="#1a5c3a" />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.commentCard}>
              <Text style={styles.commentAuthor}>{item.author_name}</Text>
              <Text style={styles.commentText}>{item.body}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Zatím žádné komentáře.</Text>}
        />
      )}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Napsat komentář"
        />
        <TouchableOpacity style={styles.commentButton} onPress={onSubmitComment}>
          <Text style={styles.commentButtonText}>Odeslat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3ee',
    padding: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    color: '#1a5c3a',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  category: {
    color: '#1a5c3a',
    fontWeight: '700',
  },
  likes: {
    color: '#5a5a55',
    fontSize: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1a1a18',
  },
  body: {
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  author: {
    fontSize: 12,
    color: '#5a5a55',
    textAlign: 'right',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dcdcdc',
  },
  actionButtonActive: {
    backgroundColor: '#e8f4ed',
    borderColor: '#1a5c3a',
  },
  actionText: {
    color: '#5a5a55',
    fontWeight: '700',
  },
  actionTextActive: {
    color: '#1a5c3a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#1a5c3a',
  },
  commentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  commentAuthor: {
    fontWeight: '700',
    marginBottom: 6,
    color: '#1a5c3a',
  },
  commentText: {
    color: '#333',
  },
  empty: {
    color: '#5a5a55',
    textAlign: 'center',
    marginTop: 20,
  },
  commentInputContainer: {
    marginTop: 12,
  },
  commentInput: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    padding: 14,
    marginBottom: 10,
  },
  commentButton: {
    backgroundColor: '#1a5c3a',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  commentButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
