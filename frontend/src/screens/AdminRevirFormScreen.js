import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { addFishery, updateFishery } from '../api/backend';

export default function AdminRevirFormScreen({ route, navigation }) {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const editFishery = route.params?.editFishery;

  const [name, setName] = useState(editFishery?.name || '');
  const [location, setLocation] = useState(editFishery?.location || '');
  const [river_basin, setRiverBasin] = useState(editFishery?.river_basin || '');
  const [description, setDescription] = useState(editFishery?.description || '');
  const [lat, setLat] = useState(editFishery?.lat?.toString() || '');
  const [lng, setLng] = useState(editFishery?.lng?.toString() || '');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!name.trim()) return Alert.alert('Chyba', 'Název revíru je povinný');
    setLoading(true);
    const payload = {
      name: name.trim(),
      location: location.trim(),
      river_basin: river_basin.trim(),
      description: description.trim(),
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
    };
    try {
      if (editFishery) {
        await updateFishery(token, editFishery.id, payload);
      } else {
        await addFishery(token, payload);
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
        <Text style={styles.modalTitle}>{editFishery ? 'Upravit revír' : 'Nový revír'}</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.label}>NÁZEV REVÍRU *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Revír Ostravice č. 1" placeholderTextColor="#999" editable={!loading} />

        <Text style={styles.label}>LOKALITA (MĚSTO/OBLAST)</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Ostrava" placeholderTextColor="#999" editable={!loading} />

        <Text style={styles.label}>POVODÍ</Text>
        <TextInput style={styles.input} value={river_basin} onChangeText={setRiverBasin} placeholder="Odra, Morava, ..." placeholderTextColor="#999" editable={!loading} />

        <Text style={styles.label}>POPIS</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Popis revíru..." placeholderTextColor="#999" multiline editable={!loading} />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>GPS S. ŠÍŘKA</Text>
            <TextInput style={styles.input} value={lat} onChangeText={setLat} placeholder="49.83" placeholderTextColor="#999" keyboardType="decimal-pad" editable={!loading} />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>GPS V. DÉLKA</Text>
            <TextInput style={styles.input} value={lng} onChangeText={setLng} placeholder="18.28" placeholderTextColor="#999" keyboardType="decimal-pad" editable={!loading} />
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={loading}>
            <Text style={styles.cancelText}>Zrušit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitBtn} onPress={onSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{editFishery ? 'Uložit' : 'Přidat'}</Text>}
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
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 40 },
  cancelBtn: { backgroundColor: '#f0f0f0', paddingVertical: 15, borderRadius: 12, width: '30%', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#1a5c3a', paddingVertical: 15, borderRadius: 12, width: '65%', alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
