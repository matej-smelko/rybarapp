import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getCatch, deleteCatch } from '../api/backend';

export default function CatchDetailScreen({ route, navigation }) {
  const { token } = useAuth();
  const { catchId, catchItem } = route.params || {};
  const [data, setData] = useState(catchItem || null);
  const [loading, setLoading] = useState(!catchItem);

  useEffect(() => {
    async function loadCatch() {
      if (!data && catchId) {
        try {
          const result = await getCatch(token, catchId);
          setData(result);
        } catch (err) {
          Alert.alert('Chyba', 'Nelze načíst úlovek.');
          navigation.goBack();
        } finally {
          setLoading(false);
        }
      }
    }
    loadCatch();
  }, [catchId, data, token, navigation]);

  async function onDelete() {
    Alert.alert('Smazat úlovek', 'Opravdu chcete tento úlovek smazat?', [
      { text: 'Zrušit', style: 'cancel' },
      {
        text: 'Smazat',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCatch(token, data.id);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Chyba', err.response?.data?.error || 'Nelze smazat úlovek.');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1a5c3a" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Zpět</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{data?.species}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Revír</Text>
        <Text style={styles.value}>{data?.revir}</Text>
        <Text style={styles.label}>Datum</Text>
        <Text style={styles.value}>{data?.caught_date} {data?.caught_time}</Text>
        <Text style={styles.label}>Váha</Text>
        <Text style={styles.value}>{data?.weight_g >= 1000 ? `${(data.weight_g / 1000).toFixed(2)} kg` : `${data.weight_g} g`}</Text>
        <Text style={styles.label}>Délka</Text>
        <Text style={styles.value}>{data?.length_cm} cm</Text>
        <Text style={styles.label}>Nástraha</Text>
        <Text style={styles.value}>{data?.bait || '–'}</Text>
        <Text style={styles.label}>Poznámka</Text>
        <Text style={styles.value}>{data?.note || 'Žádná'}</Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Text style={styles.deleteText}>Smazat úlovek</Text>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#f5f3ee',
  },
  header: {
    marginBottom: 20,
  },
  back: {
    color: '#1a5c3a',
    marginBottom: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a5c3a',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  label: {
    marginTop: 14,
    color: '#5a5a55',
    fontSize: 13,
  },
  value: {
    fontSize: 16,
    color: '#1a1a18',
    marginTop: 6,
  },
  deleteButton: {
    marginTop: 24,
    backgroundColor: '#fee',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  deleteText: {
    color: '#c0392b',
    fontWeight: '700',
  },
});
