// lib/api.ts — API client for Prisha backend
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token if available
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('prisha_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Locations ---
export interface Location {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export async function getLocations(): Promise<Location[]> {
  const { data } = await client.get('/api/locations');
  return data.locations;
}

// --- Calendar ---
export interface CalendarDay {
  hebrew: string;
  gregorian: number;
  isCurrentMonth: boolean;
  isHoliday?: boolean;
  events?: CalendarEvent[];
}

export interface CalendarEvent {
  id: number;
  title: string;
  type: 'primary' | 'work' | 'holiday' | 'personal';
}

export interface CalendarData {
  month: string;
  year: number;
  days: CalendarDay[];
  zmanim?: {
    sunrise: string;
    sunset: string;
  };
}

export async function getCalendar(year: number, month: number, locationId: string): Promise<CalendarData> {
  const { data } = await client.get('/api/calendar', {
    params: { year, month, locationId },
  });
  return data;
}

// --- Veset ---
export interface VesetSighting {
  date: string;
  type?: string;
  period?: 'day' | 'night';
}

export interface VesetPrediction {
  type: string;
  description: string;
  dates: string[];
  cycleLength?: number;
}

export async function calculateVeset(
  sightings: VesetSighting[],
  vesetTypes?: string[]
): Promise<{ predictions: VesetPrediction[] }> {
  const { data } = await client.post('/api/veset/calculate', {
    sightings,
    vesetTypes,
  });
  return data;
}

// --- Events ---
export interface AppEvent {
  id: number;
  user_id: string;
  type: 'period' | 'spot' | 'birth' | 'prediction';
  gregorian_date: string;
  hebrew_date: string | null;
  day_or_night: 'day' | 'night';
  created_by_system: number;
  prediction_type: string | null;
  notes: string | null;
  created_at: string;
}

export async function addEvent(eventData: {
  type: string;
  gregorianDate: string;
  hebrewDate?: string;
  dayOrNight?: string;
  notes?: string;
}): Promise<{ event: AppEvent }> {
  const { data } = await client.post('/api/events', eventData);
  return data;
}

export async function getEvents(year?: number, month?: number, includePredictions = true): Promise<{ events: AppEvent[] }> {
  const params: any = {};
  if (includePredictions !== undefined) params.predictions = includePredictions;
  if (year) params.year = year;
  if (month) params.month = month;
  const { data } = await client.get('/api/events', { params });
  return data;
}

export async function deleteEvent(eventId: number): Promise<{ deleted: boolean }> {
  const { data } = await client.delete(`/api/events/${eventId}`);
  return data;
}

// --- Admin ---
export interface SystemStats {
  totalUsers: number;
  totalEvents: number;
  totalPredictions: number;
  activeUsers: number;
  totalAlgorithms: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  status: string;
  role: string;
  created_at: string;
}

export interface AlgorithmInfo {
  name: string;
  description: string;
}

export async function getAdminStats(): Promise<SystemStats> {
  const { data } = await client.get('/api/admin/stats');
  return data;
}

export async function getAdminUsers(): Promise<{ users: AdminUser[] }> {
  const { data } = await client.get('/api/admin/users');
  return data;
}

export async function updateUserStatus(userId: string, status: string): Promise<{ id: string; status: string }> {
  const { data } = await client.patch(`/api/admin/users/${userId}/status`, { status });
  return data;
}

export async function deleteUser(userId: string): Promise<{ deleted: boolean }> {
  const { data } = await client.delete(`/api/admin/users/${userId}`);
  return data;
}

export async function getAdminSettings(): Promise<{ settings: Record<string, string> }> {
  const { data } = await client.get('/api/admin/settings');
  return data;
}

export async function updateSetting(key: string, value: string): Promise<{ key: string; value: string }> {
  const { data } = await client.put(`/api/admin/settings/${key}`, { value });
  return data;
}

export async function getAlgorithms(): Promise<{ algorithms: AlgorithmInfo[] }> {
  const { data } = await client.get('/api/admin/algorithms');
  return data;
}

// --- Auth ---
export interface User {
  id: string;
  email: string;
  name: string;
}

export async function register(email: string, password: string, name?: string): Promise<{ user: User; token: string }> {
  const { data } = await client.post('/api/auth/register', { email, password, name });
  return data;
}

export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const { data } = await client.post('/api/auth/login', { email, password });
  return data;
}

export async function getMe(): Promise<{ user: User }> {
  const { data } = await client.get('/api/auth/me');
  return data;
}

export function setToken(token: string) {
  localStorage.setItem('prisha_token', token);
}

export function clearToken() {
  localStorage.removeItem('prisha_token');
}
