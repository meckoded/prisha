# 🕎 Prisha — לוח שנה יהודי + ניהול ימי עונה

> **Senior DevOps & Full-Stack Engineering by Coder 🦾**

אפליקציית Full-Stack ללוח שנה יהודי, זמני היום (זמנים), וחישוב ימי עונה (וסת) לפי שלושה אלגוריתמים מודולריים.

**🔗 Live:** <https://prisha-app.netlify.app>

---

## ✨ Features

- 📅 **לוח שנה עברי** — תאריכים עבריים, פרשות השבוע, חגים, זמני שבת
- ⏱️ **זמני היום** — עלות השחר, הנץ החמה, סוף זמן ק"ש, מנחה גדולה, שקיעה, צאת הכוכבים
- 📍 **10 ערים** — ירושלים, ת"א, חיפה, באר שבע, נתניה, פ"ת, אשדוד, אילת, צפת, טבריה
- 👩🏻 **אירועי מחזור** — רישום מחזור, כתם, לידה + תחזיות אוטומטיות
- 🔮 **3 אלגוריתמים** — עונת החודש, עונה בינונית, עונת הפלגה
- 👥 **מערכת משתמשים** — הרשמה / התחברות / JWT
- 🛡️ **פאנל ניהול** — סטטיסטיקות, ניהול משתמשים, הגדרות מערכת
- 🚀 **CI/CD** — GitHub Actions → Netlify

---

## 🏗️ Architecture

```
prisha/
├── backend/          # Express 5 + SQLite + @hebcal/core
│   ├── src/api/      # REST endpoints
│   ├── src/services/ # Business logic
│   └── scripts/      # seed-admin.js
├── frontend/         # React 19 + TypeScript + Vite 8 + Tailwind 4
│   └── src/
│       └── components/  # Header, Auth, VesetCalc, AddEventModal, EventDetailModal, AdminDashboard
├── shared/           # TypeScript types
├── .github/workflows/ # CI/CD pipeline
└── netlify.toml      # Netlify config
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- npm 11+

### Backend

```bash
cd backend
npm ci
node scripts/seed-admin.js   # Create admin user
npm run dev                   # Start on http://localhost:3001
```

**Default admin:** `admin@prisha.app` / `admin123456`

### Frontend

```bash
cd frontend
npm ci
npm run dev                   # Start on http://localhost:5173
```

Create `frontend/.env`:

```
VITE_API_URL=http://localhost:3001
```

---

## 📡 API Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/health` | GET | — | Health check |
| `/api/locations` | GET | — | 10 cities |
| `/api/calendar` | GET | — | Month + zmanim |
| `/api/auth/register` | POST | — | Registration |
| `/api/auth/login` | POST | — | Login (JWT 7d) |
| `/api/auth/me` | GET | ✅ | Current user |
| `/api/veset/calculate` | POST | — | Veset calculation |
| `/api/events` | POST | ✅ | Add event |
| `/api/events` | GET | ✅ | Get events |
| `/api/events/:id` | DELETE | ✅ | Delete event |
| `/api/admin/stats` | GET | ✅+admin | System stats |
| `/api/admin/users` | GET | ✅+admin | User list |
| `/api/admin/users/:id/status` | PATCH | ✅+admin | Block/unblock |
| `/api/admin/users/:id` | DELETE | ✅+admin | Delete user |
| `/api/admin/settings` | GET | ✅+admin | System settings |
| `/api/admin/settings/:key` | PUT | ✅+admin | Update setting |
| `/api/admin/algorithms` | GET | ✅+admin | Algorithm list |

---

## 🔐 Auth

- bcrypt salt 10, JWT 7-day expiry
- Roles: `user` / `admin`
- Admin: full system access, user management
- Events require auth; calendar/locations are public

---

## 🧪 Testing

```bash
# Backend
cd backend && npm test

# E2E
bash test-server.sh
```

---

## 🚀 Deployment

1. Push to `main` → GitHub Actions triggers
2. Frontend builds with Vite
3. Deployed to Netlify at [prisha-app.netlify.app](https://prisha-app.netlify.app)

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token |
| `NETLIFY_SITE_ID` | Netlify site GUID |

---

## 📊 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript 6, Vite 8, Tailwind 4 |
| Backend | Express 5, Node.js 22 |
| Database | SQLite (better-sqlite3, WAL mode) |
| Calendar | @hebcal/core 6 |
| Auth | bcrypt 6, jsonwebtoken 9 |
| CI/CD | GitHub Actions → Netlify |

---

**Built with 🦾 by Coder**
