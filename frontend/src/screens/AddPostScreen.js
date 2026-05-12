import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { addPost } from '../api/backend';

const categories = ['Tipy', 'Úlovky', 'Vybavení', 'Diskuse'];

export default function AddPostScreen({ navigation }) {
  const { token } = useAuth();
  const [category, setCategory] = useState(categories[0]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!title.trim() || !body.trim()) {
      return Alert.alert('Chyba', 'Vyplňte nadpis a text příspěvku.');
    }
    setLoading(true);
    try {
      await addPost(token, { category, title: title.trim(), body: body.trim() });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Chyba', err.response?.data?.error || 'Nelze odeslat příspěvek.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Nový příspěvek</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={styles.inputGroup}>
          <Text style={styles.label}>KATEGORIE</Text>
          <View style={styles.categoryRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryButton, category === cat && styles.categoryActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>NADPIS *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="O čem chcete psát?" placeholderTextColor="#999" editable={!loading} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>TEXT PŘÍSPĚVKU *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={body}
            onChangeText={setBody}
            placeholder="Napište svůj příspěvek…"
            placeholderTextColor="#999"
            multiline
            editable={!loading}
          />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={loading}>
            <Text style={styles.cancelButtonText}>Zrušit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.submitButton, loading && { backgroundColor: '#ccc' }]} onPress={onSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Přidat příspěvek</Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  content: { padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  closeButtonText: { fontSize: 20, color: '#999' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 16, color: '#333' },
  textArea: { minHeight: 140, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap' },
  categoryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', marginRight: 10, marginBottom: 10 },
  categoryActive: { borderColor: '#1a5c3a', backgroundColor: '#e8f4ed' },
  categoryText: { color: '#666', fontWeight: '500', fontSize: 14 },
  categoryTextActive: { color: '#1a5c3a', fontWeight: '700' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 30 },
  cancelButton: { backgroundColor: '#f0f0f0', paddingVertical: 15, borderRadius: 12, width: '30%', alignItems: 'center' },
  cancelButtonText: { color: '#666', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#1a5c3a', paddingVertical: 15, borderRadius: 12, width: '65%', alignItems: 'center', justifyContent: 'center' },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
