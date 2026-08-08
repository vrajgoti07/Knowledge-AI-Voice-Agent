// ============================================================
// API Service — Axios instance with interceptors
// ============================================================

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { API_BASE_URL, API_TIMEOUT } from '@/constants'
import { useAuthStore } from '@/store/authStore'

// ── Helper to reliably resolve active auth token ─────────────
export function getAuthToken(): string | null {
  const state = useAuthStore.getState()
  // Only return a token if the store considers the user authenticated
  if (state.isAuthenticated && state.token) return state.token
  return null
}

// ── Create instance ───────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
})

// ── Request interceptor ───────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor ──────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      const isAuthLoginRoute = url.includes('/auth/login') || url.includes('/auth/register')
      if (!isAuthLoginRoute && useAuthStore.getState().isAuthenticated) {
        console.warn('[API Interceptor] 401 Unauthorized for URL:', url)
        useAuthStore.getState().logout()
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── Generic request helpers ───────────────────────────────
export const apiGet = <T>(url: string, config?: AxiosRequestConfig) =>
  api.get<T>(url, config).then(r => r.data)

export const apiPost = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  api.post<T>(url, data, config).then(r => r.data)

export const apiPut = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  api.put<T>(url, data, config).then(r => r.data)

export const apiPatch = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  api.patch<T>(url, data, config).then(r => r.data)

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig) =>
  api.delete<T>(url, config).then(r => r.data)

export const apiPostFormData = <T>(url: string, formData: FormData) =>
  api.post<T>(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)


