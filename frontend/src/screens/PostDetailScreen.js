import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { addComment, toggleLike, toggleCommentLike, getComments, deleteComment, editComment } from '../api/backend';

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
  const { token, user } = useAuth();
  const { post } = route.params;
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyParentId, setReplyParentId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
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

  function onReply(authorName, parentId) {
    setReplyParentId(parentId);
    setCommentText(`@${authorName} `);
  }

  async function onSubmitComment() {
    if (!commentText.trim()) return;
    try {
      const result = await addComment(token, post.id, commentText.trim(), replyParentId);
      setComments((prev) => [...prev, result]);
      setCommentText('');
      setReplyParentId(null);
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

  async function handleCommentLike(commentId) {
    try {
      const result = await toggleCommentLike(token, commentId);
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? { ...c, liked: result.liked, likes_count: Math.max(0, (c.likes_count || 0) + (result.liked ? 1 : -1)) }
          : c
      ));
    } catch (err) {
      Alert.alert('Chyba', err.response?.data?.error || err.message || 'Nelze lajkovat komentář.');
    }
  }

  async function handleSaveEdit(commentId) {
    if (!editText.trim()) return;
    try {
      const result = await editComment(token, commentId, editText.trim());
      setComments(prev => prev.map(c => (c.id === commentId ? { ...c, body: result.body } : c)));
      setEditingCommentId(null);
      setEditText('');
    } catch (err) {
      Alert.alert('Chyba', err.response?.data?.error || 'Nelze upravit komentář.');
    }
  }

  function handleMenuPress(item) {
    Alert.alert('Možnosti', null, [
      {
        text: 'Editovat',
        onPress: () => {
          setEditingCommentId(item.id);
          setEditText(item.body);
        },
      },
      {
        text: 'Smazat',
        style: 'destructive',
        onPress: () => handleDeleteComment(item.id, item.author_name),
      },
      { text: 'Zrušit', style: 'cancel' },
    ]);
  }

  function handleDeleteComment(commentId, authorName) {
    Alert.alert(
      'Smazat komentář',
      `Opravdu chcete smazat komentář od ${authorName}?`,
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Smazat',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteComment(token, commentId);
              setComments(prev => prev.filter(c => !result.deleted.includes(c.id)));
            } catch (err) {
              Alert.alert('Chyba', err.response?.data?.error || 'Nelze smazat komentář.');
            }
          },
        },
      ]
    );
  }

  const topLevelComments = comments.filter(c => !c.parent_id);
  const repliesByParent = {};
  for (const c of comments) {
    if (c.parent_id) {
      if (!repliesByParent[c.parent_id]) repliesByParent[c.parent_id] = [];
      repliesByParent[c.parent_id].push(c);
    }
  }

  function getAllDescendants(commentId) {
    const result = [];
    const queue = [...(repliesByParent[commentId] || [])];
    while (queue.length > 0) {
      const c = queue.shift();
      result.push(c);
      queue.push(...(repliesByParent[c.id] || []));
    }
    return result;
  }

  function renderCommentCard(item, isReply) {
    const liked = item.liked === true;
    const isEditing = editingCommentId === item.id;
    return (
      <View key={item.id} style={[styles.commentCard, isReply && styles.commentReplyCard]}>
        <View style={styles.commentHeader}>
          <View style={styles.commentAvatar}>
            <Text style={styles.commentAvatarText}>{getInitials(item.author_name)}</Text>
          </View>
          <View style={styles.commentHeaderText}>
            <Text style={styles.commentAuthor}>{item.author_name}</Text>
            <Text style={styles.commentDate}>{formatCZ(item.created_at)}</Text>
          </View>
          {user && item.user_id === user.id && !isEditing && (
            <TouchableOpacity onPress={() => handleMenuPress(item)}>
              <Text style={styles.menuDots}>⋮</Text>
            </TouchableOpacity>
          )}
        </View>
        {isEditing ? (
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            placeholderTextColor="#999"
          />
        ) : (
          <Text style={styles.commentBody}>{item.body}</Text>
        )}
        <View style={styles.commentFooter}>
          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity onPress={() => setEditingCommentId(null)}>
                <Text style={styles.cancelEditBtn}>Zrušit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSaveEdit(item.id)}>
                <Text style={styles.saveEditBtn}>Uložit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.commentLikeBtn} onPress={() => handleCommentLike(item.id)}>
                <Text style={[styles.commentHeart, liked && styles.commentHeartActive]}>
                  {liked ? '♥' : '♡'}
                </Text>
                <Text style={styles.commentLikeCount}>{item.likes_count || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onReply(item.author_name, item.id)}>
                <Text style={styles.replyBtn}>Odpovědět</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Zpět</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          style={styles.flex}
          contentContainerStyle={styles.listContent}
          data={topLevelComments}
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
          renderItem={({ item }) => {
            const thread = getAllDescendants(item.id);
            return (
              <View style={styles.commentGroup}>
                {renderCommentCard(item, false)}
                {thread.length > 0 && (
                  <View style={styles.threadContainer}>
                    <View style={styles.threadLine} />
                    <View style={styles.threadItems}>
                      {thread.map(r => renderCommentCard(r, true))}
                    </View>
                  </View>
                )}
              </View>
            );
          }}
        />

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
          {replyParentId ? (
            <View style={styles.replyInfo}>
              <TouchableOpacity onPress={() => { setReplyParentId(null); setCommentText(''); }}>
                <Text style={styles.cancelReply}>×</Text>
              </TouchableOpacity>
              <Text style={styles.replyInfoText}>Odpovídáte</Text>
            </View>
          ) : null}
          <TextInput
            style={styles.commentInput}
            value={commentText}
            onChangeText={setCommentText}
            placeholder={replyParentId ? 'Napsat odpověď…' : 'Napsat komentář…'}
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.sendButton} onPress={onSubmitComment}>
            <Text style={styles.sendButtonText}>Odeslat</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
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
  commentReplyCard: {
    borderLeftWidth: 0,
    marginBottom: 6,
  },
  commentGroup: { marginBottom: 10 },
  threadContainer: { flexDirection: 'row' },
  threadLine: { width: 2, backgroundColor: '#ddd', marginLeft: 16, marginRight: 10 },
  threadItems: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  commentHeaderText: { flex: 1 },
  commentAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#edeae2',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },
  commentAvatarText: { color: '#1a5c3a', fontWeight: '700', fontSize: 11 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: '#1a1a18' },
  commentDate: { fontSize: 10, color: '#8a8a82', marginTop: 1 },
  commentBody: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 8 },
  editInput: {
    fontSize: 14, color: '#444', lineHeight: 20,
    backgroundColor: '#f5f3ee', borderRadius: 10,
    padding: 10, marginBottom: 8, textAlignVertical: 'top',
    minHeight: 60,
  },
  commentFooter: { flexDirection: 'row', alignItems: 'center' },
  editActions: { flexDirection: 'row', alignItems: 'center' },
  cancelEditBtn: { fontSize: 13, fontWeight: '600', color: '#999', marginRight: 16 },
  saveEditBtn: { fontSize: 13, fontWeight: '700', color: '#1a5c3a' },
  commentLikeBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  commentHeart: { fontSize: 14, marginRight: 4, color: '#999' },
  commentHeartActive: { color: '#e74c3c' },
  commentLikeCount: { fontSize: 12, fontWeight: '600', color: '#666' },
  replyBtn: { fontSize: 12, fontWeight: '600', color: '#1a5c3a' },
  menuDots: { fontSize: 18, fontWeight: '700', color: '#999', paddingLeft: 8, paddingVertical: 2 },
  replyInfo: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  replyInfoText: { fontSize: 11, color: '#1a5c3a', fontWeight: '600' },
  cancelReply: { fontSize: 20, color: '#999', marginRight: 6, paddingHorizontal: 2 },

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
