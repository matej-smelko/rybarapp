import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
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
      return Alert.alert('Vyplňte nadpis a text příspěvku.');
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Nový příspěvek</Text>
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
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Nadpis" />
      <TextInput
        style={[styles.input, styles.multiline]}
        value={body}
        onChangeText={setBody}
        placeholder="Text příspěvku"
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Odesílám...' : 'Přidat příspěvek'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3ee',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a5c3a',
    marginBottom: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dcdcdc',
    marginRight: 10,
    marginBottom: 10,
  },
  categoryActive: {
    borderColor: '#1a5c3a',
    backgroundColor: '#e8f4ed',
  },
  categoryText: {
    color: '#5a5a55',
  },
  categoryTextActive: {
    color: '#1a5c3a',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  multiline: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#1a5c3a',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
