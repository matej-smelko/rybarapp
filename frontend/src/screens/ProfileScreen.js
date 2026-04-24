import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profil</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Jméno</Text>
        <Text style={styles.value}>{user?.name}</Text>
        <Text style={styles.label}>E-mail</Text>
        <Text style={styles.value}>{user?.email}</Text>
        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{user?.role || 'Rybář'}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Odhlásit se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f3ee',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1a5c3a',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    color: '#5a5a55',
    marginTop: 14,
  },
  value: {
    fontSize: 16,
    color: '#1a1a18',
    marginTop: 6,
  },
  button: {
    backgroundColor: '#c8860a',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
