import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register, loading, error, setError } = useAuth();
  const [name, setName] = useState('Matěj Šmelko');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    return () => setError(null);
  }, [setError]);

  async function onSubmit() {
    await register(name.trim(), email.trim(), password);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrovat</Text>
      <Text style={styles.subtitle}>Vytvořte nový účet pro správu úlovků</Text>
      <TextInput style={styles.input} placeholder="Jméno" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput style={styles.input} placeholder="Heslo" secureTextEntry value={password} onChangeText={setPassword} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Registrovat</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Mám již účet</Text>
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
