// shared/types.ts — Prisha shared type definitions

export interface Location {
  id: string;
  name: string;
  hebrewName: string;
  lat: number;
  lng: number;
  timezone: string;
}

export interface Zmanim {
  alot: string;       // עלות השחר
  sunrise: string;    // הנץ החמה
  sofZman: string;    // סוף זמן קריאת שמע
  mincha: string;     // מנחה גדולה
  sunset: string;     // שקיעה
  tzeit: string;      // צאת הכוכבים
}

export interface DayInfo {
  gregorian: string;
  hebrew: string;
  parsha: string | null;
  zmanim: Zmanim;
  holidays: string[];
  candleLighting: string | null;
  havdalah: string | null;
}

export interface MonthData {
  year: number;
  month: number;
  hebrewMonth: string;
  hebrewYear: string;
  days: DayInfo[];
  location: {
    id: string;
    name: string;
  };
}

export interface VesetSighting {
  date: string;
  notes?: string;
}

export interface VesetPrediction {
  type: 'monthly' | 'medium' | 'haflaga';
  description: string;
  dates: string[];
  cycleLength?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
