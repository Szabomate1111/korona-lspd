# TGF - Tagfelvételi Rendszer

Modern, teljes körű tagfelvételi rendszer dinamikus kérdéskezeléssel, paste detektálással és admin panellel.

## 🚀 Gyors telepítés (egy parancs!)

```bash
curl -fsSL https://raw.githubusercontent.com/Szabomate1111/korona-lspd/claude/tgf-system-design-011CV1pi8CdTVooPuS1BXAh6/quick-install.sh | bash
```

**[→ Részletes magyar telepítési útmutató](README_INSTALL.md)**

Ez automatikusan telepít mindent: Node.js, PostgreSQL, a teljes alkalmazást, és előkészíti az indításhoz.

## 🎯 Funkciók

### Publikus oldal
- **Letisztult főoldal** - Bemutató és jelentkezési gomb
- **Többlépéses jelentkezési űrlap** - Progress bar-ral, automatikus mentéssel
- **Paste detektálás** - Automatikus, láthatatlan észlelés beillesztett válaszokról
- **Valós idejű validálás** - Kötelező mezők, minimum karakterszám
- **LocalStorage mentés** - Automatikus draft mentés lépésenként

### Admin panel
- **Dashboard** - Statisztikák, legutóbbi jelentkezések
- **Jelentkezések kezelése** - Szűrés, rendezés, részletes nézet
- **Paste-észlelés vizualizáció** - Gyanús mezők jelzése metrikákkal
- **Kérdések kezelése** - Dinamikus szerkesztés, verziózás
- **Admin menedzsment** - Owner funkció: adminok hozzáadása/törlése
- **Discord OAuth** - Biztonságos hitelesítés

### Technikai jellemzők
- **Verziókezelés** - Minden beküldés a beküldéskori kérdésverzióval mentődik
- **Gyanúsítási pontszám** - Automatikus számítás paste metrikák alapján
- **Rate limiting** - Védelem spam ellen
- **Responsive design** - Működik minden eszközön
- **Dark theme** - Letisztult, professzionális megjelenés

## 🛠️ Technológiák

### Backend
- Node.js + TypeScript
- Express
- PostgreSQL
- Discord OAuth2
- JWT autentikáció
- Zod validáció

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Axios

## 📦 Telepítés

### Előfeltételek
- Node.js 18+ és npm/pnpm
- PostgreSQL 14+
- Discord Application (OAuth2)

### 1. Repository klónozása
```bash
git clone <repo-url>
cd korona-lspd
```

### 2. Backend telepítése
```bash
cd backend
npm install

# Környezeti változók beállítása
cp .env.example .env
# Szerkeszd a .env fájlt a megfelelő értékekkel
```

### 3. Discord Application létrehozása
1. Menj a [Discord Developer Portal](https://discord.com/developers/applications)-ra
2. Hozz létre egy új Application-t
3. OAuth2 → Add redirect: `http://localhost:3001/api/auth/callback`
4. Másold ki a Client ID-t és Client Secret-et
5. Írd be a `.env` fájlba

### 4. Adatbázis beállítása
```bash
# Adatbázis létrehozása
createdb tgf_db

# Táblák létrehozása
npm run migrate

# Kezdeti kérdések seed-elése (opcionális)
npm run seed
```

### 5. Frontend telepítése
```bash
cd ../frontend
npm install

# Környezeti változók
cp .env.example .env
# Ha szükséges, módosítsd az API URL-t
```

### 6. Alkalmazás indítása

**Backend (terminal 1):**
```bash
cd backend
npm run dev
# Elérhető: http://localhost:3001
```

**Frontend (terminal 2):**
```bash
cd frontend
npm run dev
# Elérhető: http://localhost:5173
```

## 🔐 Első owner hozzáadása

A rendszer használatához először létre kell hoznod egy owner fiókot:

```bash
# Csatlakozz az adatbázishoz
psql tgf_db

# Adj hozzá egy owner-t (Discord ID-ddel)
INSERT INTO users (discord_id, username, role)
VALUES ('YOUR_DISCORD_ID', 'YourUsername', 'owner');
```

**Discord ID megszerzése:**
1. Discord → Settings → Advanced → Developer Mode bekapcsolása
2. Jobb klikk a profilodra → Copy User ID

## 📋 Használat

### Jelentkezés (publikus)
1. Látogass el a `/apply` oldalra
2. Töltsd ki az űrlapot (automatikus mentés működik)
3. Haladj végig a lépéseken
4. Ellenőrizd és küldd be

### Admin panel
1. Látogass el a `/admin` oldalra
2. Discord OAuth bejelentkezés
3. **Dashboard** - Statisztikák áttekintése
4. **Jelentkezések** - Szűrés, részletek, döntések
5. **Kérdések** - Új kérdés hozzáadása, szerkesztés
6. **Adminok** (Owner) - Felhasználók kezelése

### Kérdések szerkesztése
- Új kérdés hozzáadáskor **egyedi field_key** szükséges
- Szerkesztéskor **új verzió** jön létre automatikusan
- Az aktív kérdések jelennek meg az új jelentkezőknek
- Régi jelentkezések a régi kérdésekkel maradnak meg

### Paste detektálás működése
- A rendszer **láthatatlanul** naplózza a beillesztéseket
- **Gyanúsítási pontszám** számítása:
  - Paste események száma
  - Hasonlóság (Levenshtein)
  - Szerkesztési idő
  - Hosszváltozás aránya
- Admin látja a **piros jelzéseket** és metrikákat
- A jelentkező **nem kap visszajelzést**

## 🎨 Konfiguráció

### Backend (.env)
```env
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/tgf_db
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_REDIRECT_URI=http://localhost:3001/api/auth/callback
JWT_SECRET=your_secret_key
SUSPICION_THRESHOLD=50
SIMILARITY_THRESHOLD=0.65
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_FRONTEND_URL=http://localhost:5173
```

## 🚀 Production deployment

### Backend
```bash
npm run build
npm start
```

Környezeti változók:
- `NODE_ENV=production`
- HTTPS redirect URI
- Biztonságos JWT secret
- Production database URL

### Frontend
```bash
npm run build
# dist/ mappa tartalmát telepítsd static hostingra
```

### Fontos production beállítások
- HTTPS kötelező
- CORS beállítás pontos frontend URL-lel
- Rate limiting aktiválása
- Database backup stratégia
- Audit log monitoring

## 📁 Projekt struktúra

```
korona-lspd/
├── backend/
│   ├── src/
│   │   ├── config/         # Konfigurációk (DB, env)
│   │   ├── controllers/    # Route controllerek
│   │   ├── middleware/     # Auth, error handling
│   │   ├── models/         # Adatbázis modellek
│   │   ├── routes/         # API végpontok
│   │   ├── services/       # Üzleti logika
│   │   ├── types/          # TypeScript típusok
│   │   ├── utils/          # Segédfüggvények
│   │   └── index.ts        # Belépési pont
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React komponensek
│   │   ├── pages/          # Oldalak (home, apply, admin)
│   │   ├── services/       # API hívások
│   │   ├── types/          # TypeScript típusok
│   │   ├── utils/          # Segédfüggvények
│   │   ├── styles/         # CSS (Tailwind)
│   │   ├── App.tsx         # Fő app komponens
│   │   └── main.tsx        # Belépési pont
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🔧 API végpontok

### Publikus
- `GET /api/questions/active` - Aktív kérdések
- `POST /api/applications/apply` - Jelentkezés beküldése
- `GET /api/auth/discord` - Discord OAuth kezdete
- `GET /api/auth/callback` - OAuth callback

### Admin (JWT szükséges)
- `GET /api/applications` - Jelentkezések listája (szűrés, lapozás)
- `GET /api/applications/:id` - Jelentkezés részletei
- `PATCH /api/applications/:id/status` - Státusz módosítás
- `GET /api/applications/stats` - Statisztikák
- `GET /api/questions/all` - Összes kérdés
- `POST /api/questions` - Új kérdés
- `PATCH /api/questions/:id` - Kérdés szerkesztése (új verzió)

### Owner (JWT + owner role)
- `GET /api/users` - Adminok listája
- `POST /api/users` - Admin hozzáadása
- `DELETE /api/users/:id` - Admin törlése
- `PATCH /api/users/:id/role` - Szerepkör módosítás

## 🐛 Troubleshooting

### Backend nem indul
- Ellenőrizd a PostgreSQL kapcsolatot
- Nézd meg a `.env` fájlt
- Futott-e a migráció?

### Discord OAuth hiba
- Redirect URI egyezik?
- Client ID és Secret helyes?
- Application OAuth2 beállításai rendben?

### Frontend nem kapcsolódik
- Backend fut?
- CORS beállítások rendben?
- API_URL helyes a frontend `.env`-ben?

### Paste detektálás nem működik
- JavaScript engedélyezve?
- Console hibák?
- Backend küszöbértékek rendben?

## 📄 Licenc

MIT License - Szabadon használható és módosítható.

## 👨‍💻 Fejlesztés

### Backend fejlesztés
```bash
cd backend
npm run dev  # Hot reload tsx watch móddal
```

### Frontend fejlesztés
```bash
cd frontend
npm run dev  # Vite dev server hot reload-dal
```

### Build
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## 🎉 Kész!

A rendszer most már működőképes. Jelentkezz be az admin panelba Discord-on keresztül, és kezdd el használni!

Ha bármilyen kérdésed van, nézd meg a kódot vagy írd meg a fejlesztőnek.
