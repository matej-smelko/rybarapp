import React, { createContext, useContext, useState } from 'react';
import * as backend from '../api/backend';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function login(email, password) {
    try {
      setLoading(true);
      const data = await backend.login(email, password);
      setUser(data.user);
      setToken(data.token);
      setError(null);
      return true;
    } catch (err) {
      console.log('Login error:', err.message || err);
      const status = err.response?.status;
      if (status === 401) {
        setError('Nesprávný e-mail nebo heslo.');
      } else if (status === 400) {
        setError(err.response?.data?.error || 'Vyplňte e-mail a heslo.');
      } else if (err.message?.includes('Network Error')) {
        setError('Chyba sítě. Zkontrolujte připojení k internetu.');
      } else {
        setError(err.response?.data?.error || err.message || 'Chyba přihlášení.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function register(name, email, password) {
    try {
      setLoading(true);
      const data = await backend.register(name, email, password);
      setUser(data.user);
      setToken(data.token);
      setError(null);
      return true;
    } catch (err) {
      console.log('Register error:', err.message || err);
      const status = err.response?.status;
      if (status === 409) {
        setError('Tento e-mail je již zaregistrován.');
      } else if (status === 400) {
        setError(err.response?.data?.error || 'Vyplňte všechna povinná pole správně.');
      } else if (err.message?.includes('Network Error')) {
        setError('Chyba sítě. Zkontrolujte připojení k internetu.');
      } else {
        setError(err.response?.data?.error || err.message || 'Chyba registrace.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
