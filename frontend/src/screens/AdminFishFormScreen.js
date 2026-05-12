import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { addFish, updateFish } from '../api/backend';

const MONTHS = ['L','Ú','B','D','K','Č','Č','S','Z','Ř','L','P'];

export default function AdminFishFormScreen({ route, navigation }) {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const editFish = route.params?.editFish;

  const [name, setName] = useState(editFish?.name || '');
  const [latin, setLatin] = useState(editFish?.latin || '');
  const [mir, setMir] = useState(editFish?.mir || '');
  const [maxSize, setMaxSize] = useState(editFish?.maxSize || '');
  const [maxLength, setMaxLength] = useState(editFish?.maxLength || '');
  const [depth, setDepth] = useState(editFish?.depth || '');
  const [habitat, setHabitat] = useState(editFish?.habitat || '');
  const [difficulty, setDifficulty] = useState(editFish?.difficulty?.toString() || '3');
  const [description, setDescription] = useState(editFish?.description || '');
  const [tips, setTips] = useState(editFish?.tips || '');
  const [record, setRecord] = useState(editFish?.record || '');
  const [season, setSeason] = useState(editFish?.season ? [...editFish.season] : Array(12).fill(false));
  const [baitInput, setBaitInput] = useState(editFish?.bait?.join(', ') || '');
  const [loading, setLoading] = useState(false);

  function toggleMonth(i) {
    const copy = [...season];
    copy[i] = !copy[i];
    setSeason(copy);
  }

  async function onSubmit() {
    if (!name.trim()) return Alert.alert('Chyba', 'Název je povinný');
    setLoading(true);
    const bait = baitInput.split(',').map(s => s.trim()).filter(Boolean);
    const payload = {
      name: name.trim(), latin: latin.trim(), mir: mir.trim(), maxSize: maxSize.trim(),
      maxLength: maxLength.trim(), depth: depth.trim(), habitat: habitat.trim(),
      difficulty: parseInt(difficulty) || 3,
      season, bait, description: description.trim(), tips: tips.trim(), record: record.trim(),
    };
    try {
      if (editFish) {
        await updateFish(token, editFish.id, payload);
      } else {
        await addFish(token, payload);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Chyba', err.response?.data?.error || 'Chyba serveru');
    } finally { setLoading(false); }
  }

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{editFish ? 'Upravit rybu' : 'Nová ryba'}</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.label}>NÁZEV *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Kapr obecný" placeholderTextColor="#999" editable={!loading} />

        <Text style={styles.label}>LATINSKÝ NÁZEV</Text>
        <TextInput style={styles.input} value={latin} onChangeText={setLatin} placeholder="Cyprinus carpio" placeholderTextColor="#999" editable={!loading} />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>ZÁKONNÁ MÍRA</Text>
            <TextInput style={styles.input} value={mir} onChangeText={setMir} placeholder="40 cm" placeholderTextColor="#999" editable={!loading} />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>OBTÍŽNOST (1-5)</Text>
            <TextInput style={styles.input} value={difficulty} onChangeText={setDifficulty} placeholder="3" placeholderTextColor="#999" keyboardType="numeric" editable={!loading} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>MAX. HMOTNOST</Text>
            <TextInput style={styles.input} value={maxSize} onChangeText={setMaxSize} placeholder="až 50 kg" placeholderTextColor="#999" editable={!loading} />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>MAX. DÉLKA</Text>
            <TextInput style={styles.input} value={maxLength} onChangeText={setMaxLength} placeholder="až 150 cm" placeholderTextColor="#999" editable={!loading} />
          </View>
        </View>

        <Text style={styles.label}>HLOUBKA</Text>
        <TextInput style={styles.input} value={depth} onChangeText={setDepth} placeholder="0.5–2 m" placeholderTextColor="#999" editable={!loading} />

        <Text style={styles.label}>PROSTŘEDÍ</Text>
        <TextInput style={styles.input} value={habitat} onChangeText={setHabitat} placeholder="Zarostlé rybníky" placeholderTextColor="#999" editable={!loading} />

        <Text style={styles.label}>POPIS</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Popis ryby..." placeholderTextColor="#999" multiline editable={!loading} />

        <Text style={styles.label}>NÁSTRAHY (čárkou)</Text>
        <TextInput style={styles.input} value={baitInput} onChangeText={setBaitInput} placeholder="Kukuřice, Rohlík, ..." placeholderTextColor="#999" editable={!loading} />

        <Text style={styles.label}>LOVNÁ SEZÓNA (klepnutím přepneš)</Text>
        <View style={styles.seasonRow}>
          {MONTHS.map((m, i) => (
            <TouchableOpacity key={`${m}-${i}`} onPress={() => toggleMonth(i)} style={[styles.seasonItem, season[i] ? styles.seasonActive : styles.seasonInactive]}>
              <Text style={[styles.seasonText, season[i] && styles.seasonTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>TIP PRO RYBÁŘE</Text>
        <TextInput style={[styles.input, styles.textArea]} value={tips} onChangeText={setTips} placeholder="Tip..." placeholderTextColor="#999" multiline editable={!loading} />

        <Text style={styles.label}>REKORD</Text>
        <TextInput style={styles.input} value={record} onChangeText={setRecord} placeholder="ČR: 27 kg" placeholderTextColor="#999" editable={!loading} />

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={loading}>
            <Text style={styles.cancelText}>Zrušit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitBtn} onPress={onSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{editFish ? 'Uložit' : 'Přidat'}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  content: { padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  closeText: { fontSize: 20, color: '#999' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 15, color: '#333' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  seasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  seasonItem: { width: 36, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e3e3dc' },
  seasonActive: { backgroundColor: '#1a5c3a', borderColor: '#1a5c3a' },
  seasonInactive: { backgroundColor: '#edeae2' },
  seasonText: { fontSize: 12, fontWeight: '700', color: '#5a5a55' },
  seasonTextActive: { color: '#fff' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 40 },
  cancelBtn: { backgroundColor: '#f0f0f0', paddingVertical: 15, borderRadius: 12, width: '30%', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#1a5c3a', paddingVertical: 15, borderRadius: 12, width: '65%', alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
