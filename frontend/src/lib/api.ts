import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;

// Auth
export const authAPI = {
  login: (matricule: string, password: string) =>
    api.post('/auth/login', { matricule, password }),
  getProfile: () => api.get('/auth/profile'),
};

// Settings (demo mode)
export const settingsAPI = {
  getDemoMode: () => api.get('/settings/demo-mode'),
  setDemoMode: (enabled: boolean) => api.put('/settings/demo-mode', { enabled }),
};

// Users
export const usersAPI = {
  getAll: () => api.get('/users'),
  getOne: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  setSolde: (id: string, solde: number) => api.put(`/users/${id}/solde`, { solde }),
  deactivate: (id: string) => api.delete(`/users/${id}`),
  reactivate: (id: string) => api.put(`/users/${id}/reactiver`, {}),
  deleteForever: (id: string) => api.delete(`/users/${id}/supprimer`),
  getMe: () => api.get('/users/me'),
  updateMe: (data: any) => api.put('/users/me/profile', data),
};

// Congés
export const congesAPI = {
  getAll: () => api.get('/conges'),
  getMine: () => api.get('/conges/mes-conges'),
  getCalendrier: () => api.get('/conges/calendrier'),
  getStats: () => api.get('/conges/stats'),
  create: (data: any) => api.post('/conges', data),
  decider: (id: string, statut: string, remarque?: string) =>
    api.put(`/conges/${id}/decider`, { statut, remarque }),
  annuler: (id: string) => api.put(`/conges/${id}/annuler`),
  uploadCertificat: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/conges/${id}/certificat`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Notes
export const notesAPI = {
  getForAgent: (id: string) => api.get(`/notes/agent/${id}`),
  upsertRendement: (data: { agent_id: string; annee: number; trimestre: number; note: number }) =>
    api.post('/notes/rendement', data),
  upsertProductivite: (data: { agent_id: string; annee: number; note: number }) =>
    api.post('/notes/productivite', data),
};

// Notifications
export const notifAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.put(`/notifications/${id}/lu`),
  markAllRead: () => api.put('/notifications/tout-lire'),
};
