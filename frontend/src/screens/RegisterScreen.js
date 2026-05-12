import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register, loading, error, setError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  useEffect(() => {
    return () => setError(null);
  }, [setError]);

  function validate() {
    if (!name || !email || !password || !passwordConfirmation || !dateOfBirth) {
      setError('Vyplňte všechna povinná pole');
      return false;
    }
    if (password !== passwordConfirmation) {
      setError('Hesla se neshodují');
      return false;
    }
    if (password.length < 8) {
      setError('Heslo musí mít alespoň 8 znaků');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Heslo musí obsahovat alespoň jedno velké písmeno');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setError('Heslo musí obsahovat alespoň jedno číslo');
      return false;
    }
    return true;
  }

  async function onSubmit() {
    setError(null);
    if (!validate()) return;
    await register(name.trim(), email.trim(), password, passwordConfirmation, dateOfBirth);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrovat</Text>
      <Text style={styles.subtitle}>Vytvořte nový účet pro správu úlovků</Text>

      <TextInput style={styles.input} placeholder="Jméno *" placeholderTextColor="#999" value={name} onChangeText={setName} autoCapitalize="words" />
      <TextInput
        style={styles.input} placeholder="Datum narození * (YYYY-MM-DD)" placeholderTextColor="#999"
        value={dateOfBirth} onChangeText={setDateOfBirth} autoCapitalize="none"
      />
      <TextInput
        style={styles.input} placeholder="E-mail *" placeholderTextColor="#999"
        autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}
      />
      <TextInput style={styles.input} placeholder="Heslo *" placeholderTextColor="#999" secureTextEntry value={password} onChangeText={setPassword} />
      <Text style={styles.hint}>Min. 8 znaků, alespoň 1 velké písmeno a 1 číslo</Text>
      <TextInput style={styles.input} placeholder="Heslo znovu *" placeholderTextColor="#999" secureTextEntry value={passwordConfirmation} onChangeText={setPasswordConfirmation} />

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
    marginBottom: 12,
  },
  hint: {
    fontSize: 11,
    color: '#8a8a82',
    marginTop: -6,
    marginBottom: 12,
    paddingLeft: 4,
  },
  button: {
    backgroundColor: '#1a5c3a',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
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
