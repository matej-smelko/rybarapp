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

export async function register(name, email, password, password_confirmation, date_of_birth) {
  const response = await api.post('/api/auth/register', { name, email, password, password_confirmation, date_of_birth });
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

export async function editCatch(token, catchId, payload) {
  const response = await api.put(`/api/catches/${catchId}`, payload, {
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

export async function editPost(token, postId, payload) {
  const response = await api.put(`/api/posts/${postId}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function deletePost(token, postId) {
  const response = await api.delete(`/api/posts/${postId}`, {
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

export async function addComment(token, postId, body, parent_id) {
  const response = await api.post(`/api/posts/${postId}/comments`, { body, parent_id }, {
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

export async function toggleCommentLike(token, commentId) {
  const response = await api.post(`/api/comments/${commentId}/like`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function deleteComment(token, commentId) {
  const response = await api.delete(`/api/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function editComment(token, commentId, body) {
  const response = await api.put(`/api/comments/${commentId}`, { body }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// ==================== PROFIL / STATISTIKY ====================

export async function getUserStats(token) {
  const response = await api.get('/api/users/me/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// ==================== RYBY (Encyklopedie) ====================

export async function getFish() {
  const response = await api.get('/api/fish');
  return response.data;
}

export async function addFish(token, payload) {
  const response = await api.post('/api/fish', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function updateFish(token, fishId, payload) {
  const response = await api.put(`/api/fish/${fishId}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function deleteFish(token, fishId) {
  const response = await api.delete(`/api/fish/${fishId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}