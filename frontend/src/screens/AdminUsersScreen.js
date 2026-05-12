import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getAdminUsers, getAdminUserCatches } from '../api/backend';
import { writeAsStringAsync, cacheDirectory } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

export default function AdminUsersScreen() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [userCatches, setUserCatches] = useState({});
  const [loadingCatches, setLoadingCatches] = useState({});

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        try {
          const data = await getAdminUsers(token);
          setUsers(data);
        } catch (err) {
          Alert.alert('Chyba', 'Nepodařilo se načíst seznam uživatelů');
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [token])
  );

  async function toggleUser(userId) {
    if (expandedId === userId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(userId);
    if (!userCatches[userId]) {
      setLoadingCatches(prev => ({ ...prev, [userId]: true }));
      try {
        const data = await getAdminUserCatches(token, userId);
        setUserCatches(prev => ({ ...prev, [userId]: data.catches }));
      } catch {
        Alert.alert('Chyba', 'Nepodařilo se načíst úlovky');
      } finally {
        setLoadingCatches(prev => ({ ...prev, [userId]: false }));
      }
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('cs-CZ');
  }

  async function exportToCsv() {
    try {
      const allUsers = await getAdminUsers(token);
      let csv = 'Jméno;Email;Druh;Váha (kg);Délka (cm);Revír;Nástraha;Datum\n';
      for (const u of allUsers) {
        try {
          const data = await getAdminUserCatches(token, u.id);
          if (data.catches && data.catches.length > 0) {
            for (const c of data.catches) {
              const weight = (c.weight_g / 1000).toFixed(2).replace('.', ',');
              csv += `${u.name};${u.email};${c.species};${weight};${c.length_cm || ''};${c.revir || ''};${c.bait || ''};${c.caught_date || ''}\n`;
            }
          } else {
            csv += `${u.name};${u.email};;;;;\n`;
          }
        } catch {
          csv += `${u.name};${u.email};;;;;\n`;
        }
      }
      const uri = cacheDirectory + 'rybari_export.csv';
      await writeAsStringAsync(uri, '\uFEFF' + csv, { encoding: 'utf8' });
      await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export rybářů' });
    } catch (err) {
      Alert.alert('Chyba', 'Export se nezdařil: ' + (err.message || ''));
    }
  }

  function renderUser({ item }) {
    const isExpanded = expandedId === item.id;
    const catches = userCatches[item.id] || [];
    const loadingCatch = loadingCatches[item.id];

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => toggleUser(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.roleBadge, item.role === 'admin' ? styles.adminBadge : styles.rybarBadge]}>
                <Text style={[styles.roleText, item.role === 'admin' ? styles.roleAdminText : styles.roleRybarText]}>{item.role === 'admin' ? 'Admin' : 'Rybář'}</Text>
              </View>
              <Text style={styles.catchCount}>{item.catch_count} úlovků</Text>
            </View>
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </View>

        {isExpanded && (
          <View style={styles.catchesSection}>
            {loadingCatch ? (
              <ActivityIndicator style={styles.catchLoader} color="#1a5c3a" />
            ) : catches.length === 0 ? (
              <Text style={styles.noCatches}>Žádné úlovky</Text>
            ) : (
              catches.map((c, i) => (
                <View key={c.id} style={[styles.catchRow, i === catches.length - 1 && styles.catchRowLast]}>
                  <View style={styles.catchLeft}>
                    <Text style={styles.catchSpecies}>{c.species}</Text>
                    <Text style={styles.catchMeta}>
                      {(c.weight_g / 1000).toFixed(2).replace('.', ',')} kg
                      {c.length_cm ? ` | ${c.length_cm} cm` : ''}
                    </Text>
                  </View>
                  <View style={styles.catchRight}>
                    <Text style={styles.catchRevir}>{c.revir}</Text>
                    <Text style={styles.catchDate}>{formatDate(c.caught_date)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.header}>Rybáři</Text>
            <Text style={styles.subheader}>Správa uživatelů a jejich úlovků</Text>
          </View>
          <TouchableOpacity style={styles.exportButton} onPress={exportToCsv}>
            <Text style={styles.exportText}>📥 Export</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} color="#1a5c3a" />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUser}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a5c3a',
  },
  subheader: {
    fontSize: 14,
    color: '#5a5a55',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    backgroundColor: '#1a5c3a',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  exportText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a5c3a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#1a5c3a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a18',
  },
  userEmail: {
    fontSize: 13,
    color: '#7f7f7a',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  roleBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  adminBadge: {
    backgroundColor: '#fbe9e7',
  },
  rybarBadge: {
    backgroundColor: '#e8f5e9',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roleAdminText: {
    color: '#d32f2f',
  },
  roleRybarText: {
    color: '#2e7d32',
  },
  catchCount: {
    fontSize: 12,
    color: '#5a5a55',
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 14,
    color: '#b0b0a8',
    marginLeft: 10,
    width: 20,
    textAlign: 'center',
  },
  catchesSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f2f2ed',
  },
  catchLoader: {
    padding: 20,
  },
  noCatches: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 13,
    padding: 10,
  },
  catchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f3ee',
  },
  catchRowLast: {
    borderBottomWidth: 0,
  },
  catchLeft: {
    flex: 1,
  },
  catchSpecies: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a18',
  },
  catchMeta: {
    fontSize: 12,
    color: '#1a5c3a',
    fontWeight: '700',
    marginTop: 3,
  },
  catchRight: {
    alignItems: 'flex-end',
  },
  catchRevir: {
    fontSize: 12,
    color: '#5a5a55',
    fontWeight: '500',
  },
  catchDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
});
