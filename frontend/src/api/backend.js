import axios from 'axios';

// --- NASTAVENÍ ADRESY ---
const BASE_URL = 'https://rybarapp-production.up.railway.app';

console.log('Připojeno k backendu:', BASE_URL);

const api = axios.create({ 
  baseURL: BASE_URL, 
  timeout: 10000 
});

// ==================== AUTENTIZACE ====================

export async function login(email, password) {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
}

export async function register(name, email, password) {
  const response = await api.post('/api/auth/register', { name, email, password });
  return response.data;
}

// ==================== ÚLOVKY ====================

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

// ==================== FORUM A KOMENTÁŘE ====================

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

export async function getComments(token, postId) {
  const response = await api.get(`/api/posts/${postId}/comments`, {
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