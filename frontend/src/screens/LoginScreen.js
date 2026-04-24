import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login, loading, error, setError } = useAuth();
  const [email, setEmail] = useState('matej@example.com');
  const [password, setPassword] = useState('rybar123');

  useEffect(() => {
    return () => setError(null);
  }, [setError]);

  async function onSubmit() {
    await login(email.trim(), password);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RybářApp</Text>
      <Text style={styles.subtitle}>Přihlaste se ke svému účtu</Text>
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Heslo"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Přihlásit</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Nemáte účet? Zaregistrujte se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f3ee',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1a5c3a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#5a5a55',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#1a5c3a',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  link: {
    color: '#1a5c3a',
    textAlign: 'center',
    fontWeight: '600',
  },
  error: {
    color: '#c0392b',
    marginBottom: 10,
  },
});
