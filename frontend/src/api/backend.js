import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getBackendHost() {
  if (Platform.OS === 'web') {
    return 'localhost';
  }

  const manifest = Constants.manifest || Constants.expoConfig || {};
  const hostFromConfig = manifest?.extra?.backendHost || Constants.expoConfig?.extra?.backendHost;
  if (hostFromConfig) {
    return hostFromConfig;
  }

  const debuggerHost = manifest?.debuggerHost?.split(':')[0];
  if (debuggerHost) {
    return debuggerHost;
  }

  const bundleUrl = manifest?.bundleUrl || manifest?.debuggerHost;
  if (bundleUrl) {
    const host = bundleUrl.split('://')[1]?.split('/')[0]?.split(':')[0];
    if (host) return host;
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  console.warn('getBackendHost falling back to localhost; set expo.extra.backendHost in app.json for physical device testing.');
  return 'localhost';
}

const BACKEND_HOST = getBackendHost();
const BASE_URL = `http://${BACKEND_HOST}:3001`;
console.log('Backend URL:', BASE_URL);
const api = axios.create({ baseURL: BASE_URL, timeout: 8000 });

export async function login(email, password) {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
}

export async function register(name, email, password) {
  const response = await api.post('/api/auth/register', { name, email, password });
  return response.data;
}

export async function getCatches(token) {
  const response = await api.get('/api/catches', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.catches;
}

export async function addCatch(token, payload) {
  const response = await api.post('/api/catches', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getPosts(token) {
  const response = await api.get('/api/posts', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return Array.isArray(response.data) ? response.data : response.data.posts || [];
}

export async function addPost(token, payload) {
  const response = await api.post('/api/posts', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function addComment(token, postId, body) {
  const response = await api.post(`/api/posts/${postId}/comments`, { body }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function toggleLike(token, postId) {
  const response = await api.post(`/api/posts/${postId}/like`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getCatch(token, catchId) {
  const response = await api.get(`/api/catches/${catchId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function deleteCatch(token, catchId) {
  const response = await api.delete(`/api/catches/${catchId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getComments(token, postId) {
  const response = await api.get(`/api/posts/${postId}/comments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
