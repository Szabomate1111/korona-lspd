import axios from 'axios';
import type {
  QuestionsResponse,
  Application,
  ApplicationsListResponse,
  ApplicationStats,
  User,
  AuthUser,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth
export const authApi = {
  getAuthUrl: () => `${API_URL}/auth/discord`,
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get<{ user: AuthUser }>('/auth/me'),
};

// Questions
export const questionsApi = {
  getActive: () => api.get<QuestionsResponse>('/questions/active'),
  getAll: () => api.get<{ questions: Question[] }>('/questions/all'),
  getById: (id: number) => api.get<{ question: Question }>(`/questions/${id}`),
  create: (data: any) => api.post<{ question: Question }>('/questions', data),
  update: (id: number, data: any) => api.patch<{ question: Question }>(`/questions/${id}`, data),
  updateOrder: (order: Array<{ id: number; order_index: number }>) =>
    api.patch('/questions/order/update', { order }),
  setActive: (id: number, active: boolean) =>
    api.patch<{ question: Question }>(`/questions/${id}/activate`, { active }),
  getVersionHistory: (fieldKey: string) =>
    api.get<{ versions: Question[] }>(`/questions/history/${fieldKey}`),
};

// Applications
export const applicationsApi = {
  apply: (data: {
    answers: Record<string, string>;
    pastes: any[];
    clientMeta?: any;
  }) =>
    api.post<{ id: number; status: string; message: string }>('/applications/apply', data),
  getAll: (params?: any) => api.get<ApplicationsListResponse>('/applications', { params }),
  getById: (id: number) => api.get<{ application: Application }>(`/applications/${id}`),
  updateStatus: (id: number, status: string, note?: string) =>
    api.patch<{ application: Application; ok: boolean }>(`/applications/${id}/status`, {
      status,
      note,
    }),
  getStats: () => api.get<{ stats: ApplicationStats }>('/applications/stats'),
  getRecent: (limit?: number) =>
    api.get<{ applications: Application[] }>('/applications/recent', {
      params: { limit },
    }),
};

// Users
export const usersApi = {
  getAll: () => api.get<{ users: User[] }>('/users'),
  create: (data: any) => api.post<{ user: User }>('/users', data),
  delete: (id: number) => api.delete(`/users/${id}`),
  updateRole: (id: number, role: 'owner' | 'admin') =>
    api.patch<{ user: User }>(`/users/${id}/role`, { role }),
};

export default api;
