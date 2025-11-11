# 🚀 TGF Telepítési Útmutató (Magyar)

## Egyszerű, egy parancsban telepítés

### Debian/Ubuntu Linuxra (ajánlott)

Másold be ezt a parancsot a terminálba és nyomj Enter-t:

```bash
curl -fsSL https://raw.githubusercontent.com/Szabomate1111/korona-lspd/claude/tgf-system-design-011CV1pi8CdTVooPuS1BXAh6/quick-install.sh | bash
```

**Ez telepíti:**
- ✅ Node.js 20
- ✅ PostgreSQL
- ✅ A teljes TGF rendszert
- ✅ Mindent beállít automatikusan

**Helye:** `~/tgf-app`

---

## Mit csinál a telepítő?

1. **Frissíti a rendszert** és telepíti a szükséges csomagokat
2. **Telepíti a PostgreSQL-t** és automatikusan konfigurálja
3. **Telepíti a Node.js-t** (v20.x)
4. **Letölti a projektet** GitHub-ról
5. **Telepíti a függőségeket** (backend + frontend)
6. **Buildeli a projektet**
7. **Létrehozza az adatbázist** (táblák, kezdeti adatok)
8. **Létrehoz segéd scripteket** (start.sh, stop.sh, add-admin.sh)

---

## Első indítás - 4 egyszerű lépés

### 1. Discord Application beállítása

A Discord OAuth-hoz szükséged van egy Discord Application-re:

**A) Hozd létre a Discord Application-t:**
1. Menj ide: https://discord.com/developers/applications
2. Klikk a **"New Application"** gombra
3. Adj neki nevet (pl. "LSPD TGF")
4. Mentsd el

**B) OAuth2 beállítása:**
1. Baloldali menü: **OAuth2** → **General**
2. Redirects alatt klikk **"Add Redirect"**
3. Írd be: `http://localhost:3001/api/auth/callback`
4. **Save Changes**

**C) Másold ki a kulcsokat:**
1. Ugyanezen az OAuth2 oldalon látod:
   - **Client ID** (másold ki)
   - **Client Secret** (másold ki a "Reset Secret" melletti gombbal)

**D) Írd be a backend konfigba:**
```bash
cd ~/tgf-app
nano backend/.env
```

Keresd meg ezeket a sorokat és írd át:
```
DISCORD_CLIENT_ID=ide_a_client_id
DISCORD_CLIENT_SECRET=ide_a_client_secret
```

Mentés: `Ctrl+X`, `Y`, `Enter`

### 2. Add hozzá magad admin-ként

**A) Szerezd meg a Discord ID-dat:**
1. Discord-ban: **Settings** → **Advanced** → **Developer Mode** bekapcsolása
2. Jobb klikk a profilodra (bárhol) → **"Copy User ID"**

**B) Add hozzá magad:**
```bash
cd ~/tgf-app
./add-admin.sh PASTE_IDE_A_DISCORD_ID-T YourUsername
```

Példa:
```bash
./add-admin.sh 123456789012345678 Mate
```

### 3. Indítsd el

```bash
cd ~/tgf-app
./start.sh
```

### 4. Nyisd meg a böngészőben

Menj ide: **http://localhost:5173**

Admin panel: **http://localhost:5173/admin**

---

## 📋 Hasznos parancsok

```bash
cd ~/tgf-app

./start.sh              # Alkalmazás indítása
./stop.sh               # Alkalmazás leállítása
./add-admin.sh ID Name  # Új admin hozzáadása

# Logok megtekintése
tail -f logs/backend.log
tail -f logs/frontend.log

# Development mód (hot reload)
./dev.sh
```

---

## 🔍 Hibaelhárítás

### "PostgreSQL nem indul"

```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### "Port már használatban van"

```bash
# Backend port (3001) foglaltsága
sudo lsof -i :3001
sudo kill -9 PID

# Frontend port (5173) foglaltsága
sudo lsof -i :5173
sudo kill -9 PID
```

### "Discord OAuth nem működik"

Ellenőrizd:
1. Client ID és Secret helyes a `backend/.env`-ben?
2. Redirect URI pontosan `http://localhost:3001/api/auth/callback`?
3. Discord Application mentve?

### "Nem tudok bejelentkezni admin-ként"

```bash
cd ~/tgf-app

# Ellenőrizd, hogy létezik-e az adminod
psql -U tgf_user -d tgf_db -c "SELECT * FROM users;"

# Jelszó a CREDENTIALS.txt fájlban van (tgf_user password)
cat CREDENTIALS.txt

# Add hozzá újra magad
./add-admin.sh YOUR_DISCORD_ID YourName
```

### "Nem látszanak a kérdések"

```bash
cd ~/tgf-app/backend

# Futtasd újra a seed-et
npm run seed
```

---

## 📁 Fájlstruktúra

```
~/tgf-app/
├── backend/           # API szerver
│   ├── dist/         # Buildelt kód
│   ├── src/          # Forráskód
│   └── .env          # Konfiguráció ⚠️
├── frontend/          # React app
│   ├── dist/         # Buildelt kód
│   ├── src/          # Forráskód
│   └── .env          # Konfiguráció
├── logs/              # Alkalmazás logok
├── start.sh           # Indító script
├── stop.sh            # Leállító script
├── add-admin.sh       # Admin hozzáadó
├── dev.sh             # Dev mode
└── CREDENTIALS.txt    # Összes jelszó ⚠️
```

---

## 🔐 Biztonsági megjegyzések

**Fontos fájlok (ne oszd meg):**
- `backend/.env` - Backend konfiguráció
- `CREDENTIALS.txt` - Adatbázis jelszavak
- `frontend/.env` - Frontend konfiguráció

**Production-ben:**
1. Változtasd meg az összes jelszót
2. Használj HTTPS-t (Let's Encrypt)
3. Állíts be firewall-t (ufw)
4. Rendszeres backup az adatbázisról

---

## 🚀 Production telepítés

### Nginx + PM2

**1. Telepítsd a PM2-t:**
```bash
sudo npm install -g pm2
```

**2. Indítsd PM2-vel:**
```bash
cd ~/tgf-app

# Backend
pm2 start backend/dist/index.js --name tgf-backend

# Frontend
cd frontend
pm2 start "npx vite preview --port 5173" --name tgf-frontend

# Auto-restart boot után
pm2 startup
pm2 save
```

**3. Nginx konfig:**
```bash
sudo nano /etc/nginx/sites-available/tgf
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tgf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**4. SSL (Let's Encrypt):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 💾 Adatbázis backup

```bash
# Backup készítése
pg_dump -U tgf_user tgf_db > backup_$(date +%Y%m%d).sql

# Visszaállítás
psql -U tgf_user -d tgf_db < backup_20250101.sql

# Automatikus napi backup (cron)
crontab -e

# Add hozzá:
0 2 * * * pg_dump -U tgf_user tgf_db > ~/backups/tgf_$(date +\%Y\%m\%d).sql
```

---

## ❓ GYIK

**Q: Mikor lesz elérhető a weboldal?**
A: Azonnal a `./start.sh` futtatása után, kb. 5 másodperc múlva.

**Q: Lehet több admint hozzáadni?**
A: Igen! `./add-admin.sh DISCORD_ID Username` minden adminhoz.

**Q: Módosíthatom a kérdéseket?**
A: Igen, az admin panelban: `/admin/questions`

**Q: Mi történik, ha módosítok egy kérdést?**
A: Új verzió jön létre, a régi jelentkezések változatlanok maradnak.

**Q: Hogy működik a paste detektálás?**
A: A rendszer láthatatlanul naplózza a Ctrl+V eseményeket, számít hasonlósági pontszámot, és az admin látja a gyanús mezőket.

**Q: Az applicant látja, hogy észleljük a paste-t?**
A: **NEM!** Teljesen láthatatlan a jelentkező számára.

**Q: Mennyi helyet foglal?**
A: ~500MB (node_modules + dependencies)

**Q: Milyen portokat használ?**
A: Backend: 3001, Frontend: 5173, PostgreSQL: 5432

---

## 📞 Support

Ha elakadtál:
1. Nézd meg a logokat: `tail -f ~/tgf-app/logs/*.log`
2. Ellenőrizd a CREDENTIALS.txt fájlt
3. Próbáld újraindítani: `./stop.sh && ./start.sh`
4. Futtasd újra az installert: `./install.sh`

---

## ✅ Sikeres telepítés checklist

- [ ] `./start.sh` hiba nélkül fut
- [ ] http://localhost:5173 elérhető
- [ ] http://localhost:3001/api/health visszaad `{"status":"ok"}`
- [ ] Discord OAuth be van állítva
- [ ] Magad hozzáadtad admin-ként
- [ ] Be tudsz jelentkezni az admin panelra
- [ ] Látod a kérdéseket
- [ ] Tudsz új kérdést hozzáadni
- [ ] A publikus oldal működik (jelentkezési form)

---

**🎉 Gratulálok! A TGF rendszer telepítve és kész!**

További kérdések esetén nézd meg a [README.md](README.md) fájlt vagy a [QUICKSTART.md](QUICKSTART.md)-t.
