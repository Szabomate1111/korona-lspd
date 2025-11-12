# TGF Rendszer Frissítések

## Új Funkciók

### 1. Hierarchikus Szerepkör Rendszer

**Rangsor (csökkenő sorrendben):**
- **Rendszergazda** - Teljes hozzáférés, mindenkit kezelhet
- **Leader** - Al-leadereket vehet fel, kérdések kezelése
- **Al-Leader** - Jelentkezések kezelése, nincs felvételi jog
- **Admin** - Alapszintű jelentkezés kezelés

**Jogosultságok:**
| Funkció | Rendszergazda | Leader | Al-Leader | Admin |
|---------|---------------|--------|-----------|-------|
| Admin felvétel | ✅ | ❌ | ❌ | ❌ |
| Al-Leader felvétel | ✅ | ✅ | ❌ | ❌ |
| Admin felvétel | ✅ | ✅ | ✅ | ❌ |
| Kérdések szerkesztése | ✅ | ✅ | ❌ | ❌ |
| Kategóriák kezelése | ✅ | ✅ | ❌ | ❌ |
| Jelentkezések kezelése | ✅ | ✅ | ✅ | ✅ |

### 2. Kategóriás Kérdésrendszer

**Alapértelmezett kategóriák:**
1. **Alapadatok** - IC név, életkor, Discord név
2. **Karakter** - Háttértörténet, személyiség
3. **Motiváció** - Miért szeretnél csatlakozni
4. **Tapasztalat** - Korábbi roleplay tapasztalat
5. **Egyéb** - További információk
6. **Áttekintés** - Végleges ellenőrzés (mindig utolsó)

**Funkciók:**
- ✅ Kategóriák létrehozása, szerkesztése
- ✅ Kategória sorrendezése (drag & drop)
- ✅ Kérdések kategóriához rendelése
- ✅ Kategóriánkénti megjelenítés az apply form-ban
- ✅ "Áttekintés" kategória mindig utolsó

### 3. Discord Integráció Továbbfejlesztése

**Új funkciók:**
- ✅ Discord profilkép megjelenítése
- ✅ Discord username automatikus frissítése
- ✅ Discriminator mentése (#1234)
- ✅ Admin panel jobb felső sarokban: profilkép + név + rang

**Bejelentkezés:**
- ✅ Csak Discord OAuth (nincs jelszó)
- ✅ Admin login oldal: egyetlen "Bejelentkezés Discord-dal" gomb
- ✅ Automatikus átirányítás sikeres auth után

## Frissítési Lépések

### 1. Adatbázis séma frissítése

```bash
cd ~/tgf-app/backend
npm run build
node dist/utils/update-schema.js
```

Ez automatikusan:
- Hozzáadja a `categories` táblát
- Frissíti a `users` táblát (új szerepkörök)
- Hozzáadja `category_id` mezőt a `questions` táblához
- Létrehozza az alapértelmezett kategóriákat

### 2. Kód frissítése

```bash
cd ~/tgf-app
git pull origin claude/tgf-system-design-011CV1pi8CdTVooPuS1BXAh6

# Backend
cd backend
npm install
npm run build

# Frontend
cd ../frontend
npm install
npm run build

# Újraindítás
cd ..
./stop.sh
./start.sh
```

### 3. Meglévő userek szerepkör migrálása

Ha már vannak userek az adatbázisban:

```sql
-- Csatlakozz az adatbázishoz
psql -U tgf_user -d tgf_db

-- Migráld a régi 'owner' szerepkört 'rendszergazda'-ra
UPDATE users SET role = 'rendszergazda' WHERE role = 'owner';

-- Migráld a régi 'admin' szerepkört 'admin'-ra (változatlan)
-- Ez automatikusan megmarad

-- Ellenőrizd
SELECT id, username, role FROM users;
```

## Új API Végpontok

### Kategóriák kezelése

```
GET /api/categories - Összes kategória
GET /api/categories/active - Aktív kategóriák
POST /api/categories - Új kategória (Leader+)
PATCH /api/categories/:id - Kategória szerkesztése (Leader+)
DELETE /api/categories/:id - Kategória törlése (Rendszergazda)
PATCH /api/categories/order - Sorrend változtatása (Leader+)
```

### Felhasználók kezelése (frissített)

```
GET /api/users - Összes user (Rendszergazda)
POST /api/users - Új user hozzáadása (hierarchia szerint)
DELETE /api/users/:id - User törlése (hierarchia szerint)
PATCH /api/users/:id/role - Szerepkör módosítása (hierarchia szerint)
```

### Auth (frissített)

```
GET /api/auth/me - Saját profil (avatar, username frissítve)
```

## Frontend Változások

### Admin Panel Layout

**Jobb felső sarokban:**
```
┌─────────────────┐
│  [📷]  Mate     │
│    Rendszergazda│
└─────────────────┘
```

- Profilkép (Discord avatar)
- Username
- Szerepkör
- Klikkelve: dropdown menu (profilom, kijelentkezés)

### Login Oldal

Új útvonal: `/admin/login`

```
╔════════════════════════════════╗
║   LSPD - TGF Admin Panel       ║
╠════════════════════════════════╣
║                                ║
║   [Discord Logo]               ║
║                                ║
║   ┌──────────────────────┐    ║
║   │ Bejelentkezés        │    ║
║   │ Discord-dal          │    ║
║   └──────────────────────┘    ║
║                                ║
╚════════════════════════════════╝
```

### Kérdések Kezelés (Admin)

**Új UI:**
- Kategóriánként csoportosítva
- Drag & drop kategóriák között
- Kategória szerkesztés gomb
- Kérdés hozzáadásakor kategória választó

**Példa:**

```
┌─ Alapadatok ─────────────────┐
│ ├─ Mi az IC neved?           │
│ ├─ Hány éves vagy?           │
│ └─ Discord neved?            │
└──────────────────────────────┘

┌─ Motiváció ──────────────────┐
│ └─ Miért szeretnél...        │
└──────────────────────────────┘

[+ Új kategória]
```

### Apply Form (Publikus)

Kategóriánként léptetés:
```
Lépés 1/6: Alapadatok
━━━━━━━━━━━━━━━━━━━━━━━━━━

[IC név input]
[Életkor input]
[Discord név input]

[<< Előző] [Következő >>]
```

## Hierarchia Működése

### Példák:

**Rendszergazda (mate):**
- Vehet fel Leader-t → John lesz Leader
- Vehet fel Al-Leader-t → Sarah lesz Al-Leader
- Vehet fel Admin-t → Mike lesz Admin

**Leader (John):**
- Vehet fel Al-Leader-t → Tom lesz Al-Leader
- Vehet fel Admin-t → Anna lesz Admin
- **NEM** vehet fel Leader-t (csak Rendszergazda)

**Al-Leader (Sarah):**
- Vehet fel Admin-t → Peter lesz Admin
- **NEM** vehet fel Al-Leader-t
- **NEM** vehet fel Leader-t

**Admin (Mike):**
- **NEM** vehet fel senkit
- Csak jelentkezéseket kezelhet

## Tesztelés

### 1. Szerepkörök tesztelése

```bash
# Rendszergazdaként bejelentkezve
1. Admin panel → Adminok
2. Hozzáadás gomb látható ✅
3. Új admin létrehozása (válassz szerepkört: Leader) ✅
4. Leader sikeresen létrehozva ✅

# Leaderként bejelentkezve (másik Discord fiók)
1. Admin panel → Adminok
2. Hozzáadás gomb látható ✅
3. Próbálj Leader-t hozzáadni → Hiba: "Nincs jogosultságod" ✅
4. Al-Leader hozzáadása → Sikeres ✅
```

### 2. Kategóriák tesztelése

```bash
# Leader+ szerepkörrel
1. Admin panel → Kérdések
2. "Kategóriák kezelése" gomb látható ✅
3. Új kategória létrehozása: "Karakter háttér" ✅
4. Kategória sorrendezése drag & drop-pal ✅
5. Kérdés hozzáadása kategóriához ✅

# Publikus oldalon
1. /apply oldal megnyitása
2. Kategóriánként léptetés látható ✅
3. "Áttekintés" mindig utolsó ✅
```

### 3. Discord integráció

```bash
# Bármely szerepkörrel
1. /admin/login megnyitása
2. "Bejelentkezés Discord-dal" gomb látható ✅
3. Klikk → Discord OAuth ✅
4. Visszaérkezés után:
   - Jobb felül profilkép ✅
   - Név megjelenik ✅
   - Szerepkör látható ✅
```

## Konfigurációs Változások

### Backend .env

Nincs változás, minden működik a meglévő konfiggal.

### Frontend .env

Nincs változás.

## Biztonság

### Szerepkör ellenőrzés

Minden jogosultság-szenzitív végponton:

```typescript
// Példa: Csak rendszergazda vehet fel Leader-t
if (targetRole === 'leader' && userRole !== 'rendszergazda') {
  throw new Error('Csak rendszergazda vehet fel Leader-t');
}

// Példa: Leader vehet fel Al-Leader-t
if (targetRole === 'al-leader' && !['rendszergazda', 'leader'].includes(userRole)) {
  throw new Error('Nincs jogosultságod Al-Leader felvételéhez');
}
```

### Audit Log

Minden admin művelet logolva:
- Ki (user_id, role)
- Mit (action, entity_type, entity_id)
- Mikor (created_at)
- Details (JSON)

## Gyakori Hibák

### "role check constraint" hiba

**Probléma:** Régi adatbázis séma

**Megoldás:**
```bash
node dist/utils/update-schema.js
```

### "Cannot read property 'avatar'" hiba

**Probléma:** Auth payload nem tartalmazza az avatar-t

**Megoldás:** Jelentkezz be újra Discord-on (JWT frissül)

### Kategóriák nem jelennek meg

**Probléma:** Adatbázisban nincsenek kategóriák

**Megoldás:**
```bash
node dist/utils/update-schema.js
```

## Visszaállítás (Rollback)

Ha bármi probléma van:

```bash
# Adatbázis backup visszaállítása
psql -U tgf_user -d tgf_db < backup.sql

# Korábbi verzió
cd ~/tgf-app
git checkout <korábbi_commit_hash>
npm run build
./stop.sh && ./start.sh
```

## Következő Fejlesztések

- [ ] Értesítések Discord webhook-on keresztül
- [ ] Statisztikák szerepkörönként
- [ ] Bulk műveletek jelentkezéseken
- [ ] Export/Import kategóriák
- [ ] Kérdés sablonok

---

**Verzió:** 2.0.0
**Frissítve:** 2025-01-12
**Készítette:** Claude
