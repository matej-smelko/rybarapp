import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getUserStats } from '../api/backend';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return `${d}. ${m}. ${y}`;
}

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getUserStats(token);
        setStats(data);
      } catch {}
    })();
  }, [token]);

  return (
    <View style={[styles.safeArea, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Rybář'}</Text>
          <Text style={styles.userTag}>@{user?.name?.replace(/\s+/g, '').toLowerCase() || 'rybar'}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Osobní údaje</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📧</Text>
              <View>
                <Text style={styles.label}>E-mailová adresa</Text>
                <Text style={styles.value}>{user?.email}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🎂</Text>
              <View>
                <Text style={styles.label}>Datum narození</Text>
                <Text style={styles.value}>{formatDate(user?.date_of_birth) || 'neuvedeno'}</Text>
              </View>
            </View>

            <View style={[styles.infoRow, styles.noBorder]}>
              <Text style={styles.infoIcon}>🛡️</Text>
              <View>
                <Text style={styles.label}>Role účtu</Text>
                <Text style={styles.value}>{user?.role === 'admin' ? 'Administrátor' : 'Aktivní Rybář'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.catches ?? '-'}</Text>
            <Text style={styles.statLabel}>Úlovků</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.posts ?? '-'}</Text>
            <Text style={styles.statLabel}>Příspěvků</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.comments ?? '-'}</Text>
            <Text style={styles.statLabel}>Komentářů</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Odhlásit se z aplikace</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a5c3a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1a5c3a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a18',
  },
  userTag: {
    fontSize: 14,
    color: '#7f7f7a',
    marginTop: 4,
  },
  infoSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a5c3a',
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  noBorder: {
    paddingBottom: 0,
    marginBottom: 0,
    borderBottomWidth: 0,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  label: {
    fontSize: 12,
    color: '#7f7f7a',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: '#1a1a18',
    fontWeight: '700',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f2f2ed',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a5c3a',
  },
  statLabel: {
    fontSize: 12,
    color: '#5a5a55',
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto', // Tlačí odhlášení dospodu
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#fbe9e7', // Velmi jemná červená pro odhlášení
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#d32f2f',
    fontWeight: '800',
    fontSize: 16,
  },
  versionText: {
    marginTop: 16,
    fontSize: 12,
    color: '#c0c0c0',
  },
});