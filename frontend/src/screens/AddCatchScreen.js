import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { addCatch } from '../api/backend';

export default function AddCatchScreen({ navigation }) {
  const { token } = useAuth();
  const [species, setSpecies] = useState('Kapr');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [revir, setRevir] = useState('Revír Ostravice č. 1');
  const [bait, setBait] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('2025-04-22');
  const [time, setTime] = useState('07:00');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!species || !weight || !revir || !date) {
      return Alert.alert('Vyplňte platné hodnoty pro druh, váhu, revír a datum.');
    }
    setLoading(true);
    try {
      await addCatch(token, {
        species,
        weight_g: Number(weight),
        length_cm: Number(length) || 0,
        revir,
        bait,
        note,
        caught_date: date,
        caught_time: time,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Chyba', err.response?.data?.error || 'Nelze uložit úlovek.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Nový úlovek</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Úlovek</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Druh ryby</Text>
            <TextInput style={styles.input} value={species} onChangeText={setSpecies} placeholder="např. Kapr" />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>Váha (g)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>Délka (cm)</Text>
              <TextInput
                style={styles.input}
                value={length}
                onChangeText={setLength}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Místo a čas</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Revír</Text>
            <TextInput style={styles.input} value={revir} onChangeText={setRevir} placeholder="Název revíru" />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>Datum</Text>
              <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
            </View>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>Čas</Text>
              <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="HH:MM" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Další info</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nástraha</Text>
            <TextInput style={styles.input} value={bait} onChangeText={setBait} placeholder="Co jste použil" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Poznámka</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="Poznámka k úlovku"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Ukládám...' : 'Uložit úlovek'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3ee',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a5c3a',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a5c3a',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#1a5c3a',
  },
  inputGroup: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5a5a55',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a1a18',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#1a5c3a',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
