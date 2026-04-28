# 🕎 Prisha — Interface Contract v1.0

> **פרויקט:** לוח שנה יהודי + חישוב ימי עונה  
> **מצב:** חוזה ראשוני לפני קידוד  
> **התעדכן אחרון:** 2026-04-28 16:57 UTC

---

## 📐 החלטות מוצהרות

| החלטה | ערך |
|--------|-----|
| **1 – מיקום גיאוגרפי** | דינמי — המשתמש בוחר עיר/מיקום, החישוב לפי קואורדינטות שנבחרו |
| **2 – אירוח** | Full stack — Vercel או Render (לא static site) |
| **3 – אימות (Auth)** | בסיסי — אימייל וסיסמה |
| **4 – ימי עונה** | מודולרי — שלושה סוגים ראשונים (חודש, בינונית, הפלגה), מתוכנן להוספות עתידיות |
| **5 – שם פרויקט** | `prisha` |
| **6 – GitHub** | Repo פרטי בחשבון `meckoded` |
| **7 – שפה** | עברית בשלב זה, תשתית לדו-לשוני מהיר |
| **7.1 – עיצוב** | יגיע בהמשך בקובץ CSS ותמונה |

---

## 🏗️ ארכיטקטורה כללית

```
prisha/
├── backend/          # Node.js + Express + SQLite
│   ├── src/
│   │   ├── api/         # REST endpoints
│   │   ├── services/    # לוגיקת לוח שנה, וסת, auth
│   │   └── db/          # SQLite models
│   └── package.json     # @hebcal/core, express, bcrypt, sqlite3
├── frontend/         # React 19 + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/  # Calendar, Zmanim, VesetCalc, LocationPicker
│   │   ├── lib/         # API clients, i18n, utilities
│   │   └── App.tsx
│   └── package.json     # vite, react, tailwind, axios
├── shared/           # Types, constants
│   └── types.ts      # Interface definitions
└── README.md
```

**תקשורת:** Frontend ← HTTP → Backend ← @hebcal/core (local) / Hebcal API (fallback)

---

## 📡 API Endpoints (Backend)

### `GET /api/locations`
**מטרה:** קבלת רשימת ערים/מיקומים זמינים לבחירה.  
**פרמטרים:** `q` (אופציונלי – חיפוש).  
**תשובה:**
```json
{
  "locations": [
    {
      "id": "281184",
      "name": "ירושלים",
      "hebrewName": "ירושלים",
      "lat": 31.7683,
      "lng": 35.2137,
      "timezone": "Asia/Jerusalem"
    },
    {
      "id": "293397",
      "name": "תל אביב",
      "hebrewName": "תל אביב",
      "lat": 32.0853,
      "lng": 34.7818,
      "timezone": "Asia/Jerusalem"
    }
  ]
}
```

### `GET /api/calendar`
**מטרה:** לוח שנה חודשי + זמני היום עבור מיקום שנבחר.  
**פרמטרים:**
- `year` (מספר, default: current)
- `month` (1-12, default: current)
- `locationId` (חובה, מהרשימה למעלה)

**תשובה:**
```json
{
  "month": {
    "year": 2026,
    "month": 4,
    "hebrewMonth": "ניסן",
    "hebrewYear": "תשפ״ו"
  },
  "days": [
    {
      "gregorian": "2026-04-28",
      "hebrew": "כ״ה ניסן תשפ״ו",
      "parsha": "אחרי מות",
      "zmanim": {
        "alot": "04:32",
        "sunrise": "05:45",
        "sofZman": "09:12",
        "mincha": "12:30",
        "sunset": "18:45",
        "tzeit": "19:15"
      },
      "holidays": [],
      "candleLighting": null,
      "havdalah": null
    }
  ],
  "location": {
    "id": "281184",
    "name": "ירושלים"
  }
}
```

### `POST /api/veset/calculate`
**מטרה:** חישוב ימי עונה לפי תאריכי ראייה שהוזנו.  
**בקשה:**
```json
{
  "userId": "uuid (optional, אם מחובר)",
  "sightings": ["2026-04-01", "2026-04-28"],
  "vesetTypes": ["monthly", "medium", "haflaga"]
}
```
**תשובה:**
```json
{
  "predictions": [
    {
      "type": "monthly",
      "description": "עונת החודש — יום 30 לאחר ראייה",
      "dates": ["2026-05-28"]
    },
    {
      "type": "medium",
      "description": "עונה בינונית — יום 30 ויום 31 לאחר הראייה",
      "dates": ["2026-05-28", "2026-05-29"]
    },
    {
      "type": "haflaga",
      "description": "עונת הפלגה — חישוב לפי ממוצע הימים בין שתי ראיות",
      "dates": ["2026-05-26"],
      "cycleLength": 27,
      "note": "דרושות לפחות שתי ראיות לחישוב"
    }
  ]
}
```

### Auth Endpoints
- `POST /api/auth/register` – {email, password, name}
- `POST /api/auth/login` – {email, password}
- `GET /api/auth/me` (requires token)
- `POST /api/auth/logout`

---

## 🔧 סוגי נתונים (Shared Types)

```typescript
// shared/types.ts

export interface Location {
  id: string;
  name: string;
  hebrewName: string;
  lat: number;
  lng: number;
  timezone: string;
}

export interface DayInfo {
  gregorian: string; // YYYY-MM-DD
  hebrew: string;
  parsha: string | null;
  zmanim: Zmanim;
  holidays: string[];
  candleLighting: string | null;
  havdalah: string | null;
}

export interface Zmanim {
  alot: string;
  sunrise: string;
  sofZman: string;
  mincha: string;
  sunset: string;
  tzeit: string;
}

export interface VesetSighting {
  date: string; // YYYY-MM-DD
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
```

---

## 🧠 לוגיקת וסת (Backend Service)

### `services/vesetService.js`
**פונקציות:**

```javascript
// חישוב עונת החודש — יום 30 לאחר כל ראייה
function calculateMonthly(sightings) {
  return sightings.map(s => addDays(s, 30));
}

// חישוב עונה בינונית — יום 30 ויום 31 לאחר כל ראייה
function calculateMedium(sightings) {
  return sightings.flatMap(s => [addDays(s, 30), addDays(s, 31)]);
}

// חישוב עונת הפלגה — ממוצע ימים בין זוגות ראיות
function calculateHaflaga(sightings) {
  if (sightings.length < 2) return [];
  const intervals = [];
  for (let i = 1; i < sightings.length; i++) {
    intervals.push(daysBetween(sightings[i-1], sightings[i]));
  }
  const avg = Math.round(intervals.reduce((a,b) => a+b) / intervals.length);
  return [addDays(sightings[sightings.length-1], avg)];
}
```

**עקרון מודולרי:** כל פונקציה בנפרד, ניתן להוסיף `calculateX` בעתיד.

---

## 🌍 תמיכת מיקום דינמי

**זרימה:**
1. Frontend מציג `LocationPicker` – dropdown עם חיפוש.
2. המשתמש בוחר עיר → נשלחת `locationId` ל-backend.
3. Backend משתמש ב-`@hebcal/core` עם ה-lat/lng לחישוב זמני היום.
4. אם @hebcal/core לא זמין (אופליין) → Hebcal API fallback.

**הערה:** Hebcal API דורשת `geonameid` (מזהה עיר). נשמור mapping מקומי של id→geonameid.

---

## 🔐 ארכיטקטורת Auth

**מבנה:**
-(`POST /api/auth/register`) → bcrypt hash → SQLite insert  
-(`POST /api/auth/login`) → bcrypt compare → generate JWT  
-(`GET /api/auth/me`) → verify JWT → return user data  

**SQLite schema:**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_locations (
  user_id TEXT REFERENCES users(id),
  location_id TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**הערה:** Auth אופציונלי לשימוש ב-veset – ניתן לחשב גם בלי login.

---

## 🌐 i18n (דו-לשוני מהיר)

**מבנה:**
```
frontend/src/lib/i18n/
├── translations/
│   ├── he.json
│   └── en.json
├── context/
│   └── I18nContext.tsx
└── hooks/
    └── useTranslation.ts
```

**עקרון:** כל הטקסטים ב-componentים דרך `t('key')`. בשלב ראשוני – רק עברית, המבנה מוכן לאנגלית.

---

## 🚀 Deployment (Vercel)

**הכנה:**
- Backend: `vercel.json` עם routes ל-`/api/*`
- Frontend: `vercel.json` עם `output: 'static'` + `rewrites` ל-backend
- Environment variables: `DATABASE_URL` (SQLite file), `JWT_SECRET`

**הערה:** SQLite ב-Vercel דורש writable storage (טוב יותר Render עם persistent disk).

---

## 📦 Dependencies

### Backend (`package.json`)
```json
{
  "dependencies": {
    "@hebcal/core": "^6.0.8",
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5"
  }
}
```

### Frontend (`package.json`)
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "axios": "^1.6.2",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.0"
  }
}
```

---

## ✅ קריטריוני הצלחה (לפני PR)

- [ ] Backend: `GET /api/calendar` מחזיר חודש עם זמנים עבור locationId נתון
- [ ] Backend: `POST /api/veset/calculate` מחשב 3 סוגי עונה
- [ ] Frontend: לוח שנה חודשי מציג תאריכים עבריים על גבי לועזי
- [ ] Frontend: `LocationPicker` פועל, מחליף מיקום
- [ ] Auth: register/login עובד, JWT נשמר
- [ ] GitHub: repo `meckoded/prisha` קיים, קוד הועלה
- [ ] README: הוראות הפעלה מקומיות + deployment ל-Vercel

---

## 🔄 זרימת עבודה (סוכנים)

1. **Contract** (גולם + DeepSeek V4 Pro) – מסמך זה ✅
2. **Backend – Calendar + Locations** (Qwen3 Coder 480B)
3. **Backend – Veset Service** (Qwen3 Coder 480B)
4. **Backend – Auth** (Qwen3 Coder 480B)
5. **Frontend – Calendar UI** (Gemma4 31B)
6. **Frontend – LocationPicker + Zmanim** (Gemma4 31B)
7. **Frontend – VesetCalc UI** (Gemma4 31B)
8. **Integration – ENV + Routes** (DeepSeek V4 Pro)
9. **GitHub – Init + Push + PR** (פקודות git)

---

> *מסמך זה הוא מקור האמת. כל סטייה חייבת להידון ולהיות מתועדת.*
