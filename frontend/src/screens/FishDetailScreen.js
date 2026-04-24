import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MONTHS = ['L', 'Ú', 'B', 'D', 'K', 'Č', 'Č', 'S', 'Z', 'Ř', 'L', 'P'];

export default function FishDetailScreen({ route, navigation }) {
  const { fish } = route.params;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Zpět na seznam</Text>
      </TouchableOpacity>
      <View style={styles.heroCard}>
        <Image source={fish.image} style={styles.heroImage} resizeMode="contain" />
        <Text style={styles.title}>{fish.name}</Text>
        <Text style={styles.latin}>{fish.latin}</Text>
      </View>
      <Text style={styles.sectionTitle}>Základní údaje</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Zákonná míra</Text>
          <Text style={styles.statValue}>{fish.mir}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Max. hmotnost</Text>
          <Text style={styles.statValue}>{fish.maxSize}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Max. délka</Text>
          <Text style={styles.statValue}>{fish.maxLength}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Obtížnost lovu</Text>
          <View style={styles.difficultyRow}>
            {Array.from({ length: 5 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.difficultyDot,
                  index < fish.difficulty ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Hloubka</Text>
          <Text style={styles.statValue}>{fish.depth}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Proud</Text>
          <Text style={styles.statValue}>{fish.habitat}</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Popis</Text>
      <Text style={styles.text}>{fish.description}</Text>
      <Text style={styles.sectionTitle}>Doporučené nástrahy</Text>
      <View style={styles.chipRow}>
        {fish.bait.map((bait) => (
          <View key={bait} style={styles.chip}>
            <Text style={styles.chipText}>{bait}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Lovná sezóna</Text>
      <View style={styles.seasonRow}>
        {MONTHS.map((month, index) => (
          <View
            key={`${month}-${index}`}
            style={[
              styles.seasonItem,
              fish.season && fish.season[index] ? styles.seasonActive : styles.seasonInactive,
            ]}
          >
            <Text
              style={[
                styles.seasonItemText,
                fish.season && fish.season[index] ? styles.seasonItemTextActive : styles.seasonItemTextInactive,
              ]}
            >
              {month}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.seasonLegend}>
        <View style={[styles.legendDot, styles.legendActive]} />
        <Text style={styles.legendText}>Lovná doba</Text>
        <View style={[styles.legendDot, styles.legendInactive]} />
        <Text style={styles.legendText}>Hájení</Text>
      </View>
      <Text style={styles.sectionTitle}>Rekord</Text>
      <View style={styles.box}>
        <Text style={styles.boxText}>{fish.record}</Text>
      </View>
      <Text style={styles.sectionTitle}>Tip pro rybáře</Text>
      <View style={styles.box}>
        <Text style={styles.boxText}>{fish.tips ? fish.tips : 'Žádný tip k dispozici.'}</Text>
      </View>
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
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    color: '#1a5c3a',
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#edf6ea',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: 180,
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a5c3a',
    marginBottom: 6,
  },
  latin: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#5a5a55',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1a5c3a',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 6,
  },
  difficultyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d7d7d7',
  },
  dotActive: {
    backgroundColor: '#1a5c3a',
  },
  dotInactive: {
    backgroundColor: '#e5e5e0',
  },
  statLabel: {
    fontSize: 12,
    color: '#5a5a55',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a5c3a',
  },
  rowInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
  },
  infoLabel: {
    fontSize: 12,
    color: '#5a5a55',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a5c3a',
  },
  text: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 20,
  },
  seasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  seasonItem: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e3e3dc',
  },
  seasonActive: {
    backgroundColor: '#1a5c3a',
    borderColor: '#1a5c3a',
  },
  seasonInactive: {
    backgroundColor: '#f2f2ea',
  },
  seasonItemText: {
    fontSize: 12,
    fontWeight: '700',
  },
  seasonItemTextActive: {
    color: '#fff',
  },
  seasonItemTextInactive: {
    color: '#5a5a55',
  },
  seasonLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendActive: {
    backgroundColor: '#1a5c3a',
  },
  legendInactive: {
    backgroundColor: '#f2f2ea',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  legendText: {
    fontSize: 12,
    color: '#5a5a55',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  chip: {
    backgroundColor: '#f5f6f1',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10,
    marginBottom: 10,
  },
  chipText: {
    color: '#1a5c3a',
    fontWeight: '600',
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  boxText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
});
