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

// --- Events ---
export interface EventData {
  id: number;
  type: string;
  gregorianDate: string;
  hebrewDate: string;
  dayOrNight: string;
  createdBySystem: boolean;
  predictionType?: string;
  notes?: string;
  createdAt?: string;
}

export interface VesetPrediction {
  type: string;
  description: string;
  dates: string[];
  cycleLength?: number;
}

export async function addEvent(data: {
  type: string;
  gregorianDate: string;
  hebrewDate?: string;
  dayOrNight?: string;
}): Promise<{ event: EventData; predictions: VesetPrediction[]; allEvents: EventData[] }> {
  const { data: resp } = await client.post('/api/events', data);
  return resp;
}

export async function getEvents(includePredictions = false): Promise<{ events: EventData[] }> {
  const { data } = await client.get('/api/events', { params: { includePredictions } });
  return data;
}

export async function deleteEvent(id: number): Promise<{ success: boolean; predictions: VesetPrediction[] }> {
  const { data } = await client.delete(`/api/events/${id}`);
  return data;
}

// --- Admin ---
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalUserEvents: number;
  totalSystemPredictions: number;
  eventTypeCount: Record<string, number>;
  registeredAlgorithms: string[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  status: string;
  role: string;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  updated_at: string;
}

export async function getAdminStats(): Promise<{ stats: AdminStats }> {
  const { data } = await client.get('/api/admin/stats');
  return data;
}

export async function getAdminUsers(): Promise<{ users: AdminUser[] }> {
  const { data } = await client.get('/api/admin/users');
  return data;
}

export async function updateUserStatus(userId: string, status: 'active' | 'blocked'): Promise<void> {
  await client.patch(`/api/admin/users/${userId}/status`, { status });
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await client.delete(`/api/admin/users/${userId}`);
}

export async function getAdminSettings(): Promise<{ settings: SystemSetting[] }> {
  const { data } = await client.get('/api/admin/settings');
  return data;
}

export async function updateSetting(key: string, value: string): Promise<void> {
  await client.put(`/api/admin/settings/${encodeURIComponent(key)}`, { value });
}
