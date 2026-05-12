import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { addComment, toggleLike, getComments } from '../api/backend';

function formatCZ(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

export default function PostDetailScreen({ route, navigation }) {
  const { token } = useAuth();
  const { post } = route.params;
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [liked, setLiked] = useState(post.liked || false);

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
    } catch {}
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Zpět</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          style={styles.flex}
          contentContainerStyle={styles.listContent}
          data={comments}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={() => (
            <>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.authorRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials(post.author_name)}</Text>
                    </View>
                    <View>
                      <Text style={styles.authorName}>{post.author_name}</Text>
                      <Text style={styles.date}>{formatCZ(post.created_at)}</Text>
                    </View>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{post.category}</Text>
                  </View>
                </View>
                <Text style={styles.title}>{post.title}</Text>
                <Text style={styles.body}>{post.body}</Text>
                <View style={styles.likeRow}>
                  <TouchableOpacity style={styles.likeBtn} onPress={onToggleLike}>
                    <Text style={[styles.heartIcon, liked && styles.heartActive]}>
                      {liked ? '♥' : '♡'}
                    </Text>
                    <Text style={styles.likeCount}>{likes}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.sectionTitle}>
                Komentáře {comments.length > 0 ? `(${comments.length})` : ''}
              </Text>
            </>
          )}
          ListEmptyComponent={
            !loading ? <Text style={styles.empty}>Zatím žádné komentáře. Buďte první!</Text> : null
          }
          renderItem={({ item }) => (
            <View style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{getInitials(item.author_name)}</Text>
                </View>
                <View>
                  <Text style={styles.commentAuthor}>{item.author_name}</Text>
                  <Text style={styles.commentDate}>{formatCZ(item.created_at)}</Text>
                </View>
              </View>
              <Text style={styles.commentBody}>{item.body}</Text>
            </View>
          )}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.commentInput}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Napsat komentář…"
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.sendButton} onPress={onSubmitComment}>
            <Text style={styles.sendButtonText}>Odeslat</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  flex: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backText: { color: '#1a5c3a', fontWeight: '600', fontSize: 15 },
  listContent: { padding: 20, paddingBottom: 10 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f3f3f3',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1a5c3a',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  authorName: { fontSize: 15, fontWeight: '600', color: '#1a1a18' },
  date: { color: '#8a8a82', fontSize: 11, marginTop: 1 },
  categoryBadge: { backgroundColor: '#e8f4ed', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryText: { color: '#1a5c3a', fontWeight: '600', fontSize: 11 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a18', marginBottom: 10 },
  body: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 14 },
  likeRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  likeBtn: { flexDirection: 'row', alignItems: 'center' },
  heartIcon: { fontSize: 20, marginRight: 6, color: '#999' },
  heartActive: { color: '#e74c3c' },
  likeCount: { fontSize: 14, fontWeight: '600', color: '#666' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a5c3a', marginBottom: 12 },

  commentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f3f3',
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  commentAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#edeae2',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },
  commentAvatarText: { color: '#1a5c3a', fontWeight: '700', fontSize: 11 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: '#1a1a18' },
  commentDate: { fontSize: 10, color: '#8a8a82', marginTop: 1 },
  commentBody: { fontSize: 14, color: '#444', lineHeight: 20 },

  empty: { color: '#8a8a82', textAlign: 'center', marginTop: 20, fontSize: 14 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f3ee',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#1a5c3a',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  sendButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
