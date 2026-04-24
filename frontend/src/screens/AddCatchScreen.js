import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { addCatch } from '../api/backend';
import * as ImagePicker from 'expo-image-picker';
import fishData from '../data/fish'; 

export default function AddCatchScreen({ navigation }) {
  const { token } = useAuth();
  
  // State pro formulář
  const [species, setSpecies] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [revir, setRevir] = useState('Revír Ostravice č. 1');
  const [bait, setBait] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [time, setTime] = useState(new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }));
  const [loading, setLoading] = useState(false);
  
  // State pro foto a našeptávač
  const [image, setImage] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- FUNKCE PRO NAHRÁVÁNÍ NA CLOUDINARY ---
  const uploadImageToCloudinary = async (uri) => {
    const data = new FormData();
    data.append('file', {
      uri: uri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    });
    
    // Tvoje údaje z Cloudinary
    data.append('upload_preset', 'rybar_app'); 
    const cloudName = 'obrazky';

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${dyhz8sl5z}/image/upload`, {
        method: 'POST',
        body: data,
        // Důležité: u fetch s FormData v React Native NENASTAVUJEME Content-Type header manuálně!
      });
      
      const result = await response.json();
      
      if (result.secure_url) {
        return result.secure_url;
      } else {
        console.error('Cloudinary chyba:', result);
        throw new Error(result.error?.message || 'Chyba nahrávání');
      }
    } catch (error) {
      console.error('Detail chyby nahrávání:', error);
      throw error;
    }
  };

  // Funkce pro výběr fotky z mobilu
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Funkce pro našeptávač ryb
  const handleSpeciesChange = (text) => {
    setSpecies(text);
    if (text.length > 0) {
      const filtered = fishData.filter(fish => 
        fish.name.toLowerCase().includes(text.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  async function onSubmit() {
    if (!species || !weight || !revir || !date) {
      return Alert.alert('Chyba', 'Vyplňte povinná pole (druh, váha, revír a datum).');
    }

    setLoading(true);
    let finalImageUrl = null;

    try {
      // 1. Pokud uživatel vybral fotku, nejdřív ji nahrajeme na Cloudinary
      if (image) {
        finalImageUrl = await uploadImageToCloudinary(image);
      }

      // 2. Poté odešleme data do tvého backendu na Railway
      await addCatch(token, {
        species,
        weight_g: Number(weight),
        length_cm: Number(length) || 0,
        revir,
        bait,
        note,
        caught_date: date,
        caught_time: time,
        image_url: finalImageUrl // Tady už je hotová URL adresa z cloudu
      });

      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Chyba', 'Nepodařilo se uložit úlovek. Zkontrolujte připojení nebo nastavení Cloudinary.');
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
        <Text style={styles.modalTitle}>Zaznamenat úlovek</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        
        {/* FOTO SEKCE */}
        <TouchableOpacity style={styles.photoUpload} onPress={pickImage} disabled={loading}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoText}>Přidat fotku úlovku</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* DRUH RYBY + NAŠEPTÁVAČ */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>DRUH RYBY *</Text>
          <TextInput 
            style={styles.input} 
            value={species} 
            onChangeText={handleSpeciesChange} 
            placeholder="Kapr obecný..." 
            editable={!loading}
          />
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestions}>
              {suggestions.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.suggestionItem}
                  onPress={() => {
                    setSpecies(item.name);
                    setShowSuggestions(false);
                  }}
                >
                  <Text style={styles.suggestionText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* VÁHA A DÉLKA */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>VÁHA (G) *</Text>
            <TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="3200" keyboardType="numeric" editable={!loading} />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>DÉLKA (CM)</Text>
            <TextInput style={styles.input} value={length} onChangeText={setLength} placeholder="58" keyboardType="numeric" editable={!loading} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>REVÍR *</Text>
          <TextInput style={styles.input} value={revir} onChangeText={setRevir} placeholder="Název revíru" editable={!loading} />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>DATUM *</Text>
            <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" editable={!loading} />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>ČAS</Text>
            <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="HH:MM" editable={!loading} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>NÁSTRAHA</Text>
          <TextInput style={styles.input} value={bait} onChangeText={setBait} placeholder="Kukuřice, wobler..." editable={!loading} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>POZNÁMKA</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={note}
            onChangeText={setNote}
            placeholder="Volitelná poznámka..."
            multiline
            editable={!loading}
          />
        </View>

        {/* TLAČÍTKA */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={loading}>
            <Text style={styles.cancelButtonText}>Zrušit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.submitButton, loading && { backgroundColor: '#ccc' }]} 
            onPress={onSubmit} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Zaznamenat úlovek</Text>
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
  photoUpload: { height: 150, backgroundColor: '#f8f8f8', borderRadius: 15, borderStyle: 'dashed', borderWidth: 2, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  photoPlaceholder: { alignItems: 'center' },
  photoIcon: { fontSize: 30, marginBottom: 5 },
  photoText: { color: '#888', fontWeight: '500' },
  previewImage: { width: '100%', height: '100%', borderRadius: 13 },
  inputGroup: { marginBottom: 18, position: 'relative' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 16, color: '#333' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  suggestions: { position: 'absolute', top: 70, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#eee', zIndex: 100, elevation: 5 },
  suggestionItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  suggestionText: { fontSize: 15, color: '#333' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 30 },
  cancelButton: { backgroundColor: '#f0f0f0', paddingVertical: 15, borderRadius: 12, width: '30%', alignItems: 'center' },
  cancelButtonText: { color: '#666', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#1a5c3a', paddingVertical: 15, borderRadius: 12, width: '65%', alignItems: 'center', justifyContent: 'center' },
  submitButtonText: { color: '#fff', fontWeight: 'bold' },
});