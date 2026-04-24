import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  Alert 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getCatch, deleteCatch } from '../api/backend';
import { FISH_IMAGES, getFishImageKey } from '../img/fishImages';

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
          console.error(err);
          Alert.alert("Chyba", "Nepodařilo se načíst detail úlovku.");
        } finally {
          setLoading(false);
        }
      }
    }
    loadCatch();
  }, [catchId]);

  const handleDelete = () => {
    Alert.alert(
      "Smazat úlovek",
      "Opravdu chcete tento záznam trvale odstranit?",
      [
        { text: "Zrušit", style: "cancel" },
        { 
          text: "Smazat", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteCatch(token, data.id);
              navigation.goBack();
            } catch (err) {
              Alert.alert("Chyba", "Úlovek se nepodařilo smazat.");
            }
          } 
        }
      ]
    );
  };

  if (loading || !data) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1a5c3a" />
      </View>
    );
  }

  // Logika obrázku
  const imageKey = getFishImageKey(data.species);
  const hasUserPhoto = data.image_url && data.image_url !== '';
  const imageSource = hasUserPhoto 
    ? { uri: data.image_url } 
    : (FISH_IMAGES[imageKey] || FISH_IMAGES['default']);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Tlačítko Zpět */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Zpět</Text>
        </TouchableOpacity>

        {/* Hlavní karta s fotkou/ikonou */}
        <View style={styles.mainCard}>
          <View style={styles.imageWrapper}>
            <Image 
              source={imageSource} 
              style={hasUserPhoto ? styles.userPhoto : styles.fishIcon} 
              resizeMode={hasUserPhoto ? "cover" : "contain"} 
            />
          </View>
          <Text style={styles.speciesName}>{data.species}</Text>
          <Text style={styles.dateSub}>
            {new Date(data.caught_date).toLocaleDateString('cs-CZ')} v {data.caught_time || '--:--'}
          </Text>
        </View>

        {/* Mřížka s údaji */}
        <View style={styles.statsGrid}>
          <View style={styles.infoBoxHalf}>
            <Text style={styles.infoLabel}>VÁHA</Text>
            <Text style={styles.infoValue}>
              {data.weight_g >= 1000 ? `${(data.weight_g/1000).toFixed(2)} kg` : `${data.weight_g} g`}
            </Text>
          </View>
          <View style={styles.infoBoxHalf}>
            <Text style={styles.infoLabel}>DÉLKA</Text>
            <Text style={styles.infoValue}>{data.length_cm ? `${data.length_cm} cm` : '---'}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.infoBoxHalf}>
            <Text style={styles.infoLabel}>NÁSTRAHA</Text>
            <Text style={styles.infoValue}>{data.bait || 'Neuvedeno'}</Text>
          </View>
          <View style={styles.infoBoxHalf}>
            <Text style={styles.infoLabel}>ČAS</Text>
            <Text style={styles.infoValue}>{data.caught_time || '--:--'}</Text>
          </View>
        </View>

        <View style={styles.infoBoxFull}>
          <Text style={styles.infoLabel}>REVÍR</Text>
          <Text style={styles.infoValue}>{data.revir}</Text>
        </View>

        {data.note ? (
          <View style={styles.infoBoxFull}>
            <Text style={styles.infoLabel}>POZNÁMKA</Text>
            <Text style={styles.infoValue}>{data.note}</Text>
          </View>
        ) : null}

        {/* Tlačítko pro smazání */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Smazat úlovek</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  backButton: { marginBottom: 15, alignSelf: 'flex-start' },
  backText: { color: '#1a5c3a', fontSize: 16, fontWeight: '600' },

  mainCard: { 
    backgroundColor: '#eff7f2', 
    borderRadius: 25, 
    padding: 30, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  imageWrapper: { 
    width: 150, 
    height: 120, 
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  fishIcon: { width: 110, height: 110 },
  userPhoto: { width: '100%', height: '100%', borderRadius: 15 },
  
  speciesName: { fontSize: 28, fontWeight: 'bold', color: '#1a5c3a', marginBottom: 5 },
  dateSub: { fontSize: 14, color: '#666' },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  infoBoxHalf: { 
    backgroundColor: '#f2f0eb', 
    width: '48%', 
    padding: 15, 
    borderRadius: 15 
  },
  infoBoxFull: { 
    backgroundColor: '#f2f0eb', 
    width: '100%', 
    padding: 15, 
    borderRadius: 15, 
    marginBottom: 15 
  },
  infoLabel: { fontSize: 10, color: '#999', fontWeight: 'bold', marginBottom: 5 },
  infoValue: { fontSize: 17, color: '#333', fontWeight: '600' },

  deleteButton: {
    marginTop: 20,
    padding: 16,
    borderRadius: 15,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff4444',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ff4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
});