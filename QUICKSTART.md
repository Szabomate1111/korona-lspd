# 🚀 TGF Quick Install - Egy paranccsal!

## Gyors telepítés (Debian/Ubuntu)

### Automatikus telepítés curl-lel:

```bash
curl -fsSL https://raw.githubusercontent.com/Szabomate1111/korona-lspd/claude/tgf-system-design-011CV1pi8CdTVooPuS1BXAh6/quick-install.sh | bash
```

Ez a parancs:
- ✅ Telepíti az összes függőséget (Node.js, PostgreSQL)
- ✅ Beállítja az adatbázist
- ✅ Klónozza és buildelni a projektet
- ✅ Létrehoz egy admin usert
- ✅ Mindent automatikusan konfigurál

### Vagy lokális telepítés:

Ha már klónoztad a repot:

```bash
cd korona-lspd
chmod +x install.sh
./install.sh
```

## Mit csinál az installer?

1. **Telepíti a szükséges csomagokat:**
   - Node.js 20.x
   - PostgreSQL
   - Build tools

2. **Beállítja a PostgreSQL-t:**
   - Létrehozza az adatbázist
   - Beállítja a felhasználót és jelszót
   - Automatikus jelszógenerálás

3. **Telepíti a projektet:**
   - Backend + Frontend függőségek
   - Build mindkettő
   - Adatbázis migrációk
   - Kezdeti kérdések

4. **Létrehoz scriptet:**
   - `start.sh` - Alkalmazás indítása
   - `stop.sh` - Alkalmazás leállítása
   - `add-admin.sh` - Admin hozzáadása

## Használat telepítés után

### 1. Discord OAuth beállítása

Szerkeszd a backend konfigot:
```bash
nano ~/tgf-app/backend/.env
```

Állítsd be:
```env
DISCORD_CLIENT_ID=your_actual_client_id
DISCORD_CLIENT_SECRET=your_actual_secret
```

Discord Application létrehozása:
1. https://discord.com/developers/applications
2. New Application
3. OAuth2 > Redirects > Add: `http://localhost:3001/api/auth/callback`
4. Másold ki Client ID és Secret

### 2. Add hozzá magad admin-ként

Szerezd meg a Discord ID-dat:
1. Discord > Settings > Advanced > Developer Mode BE
2. Jobb klikk profilodra > Copy User ID

Add hozzá magad:
```bash
cd ~/tgf-app
./add-admin.sh YOUR_DISCORD_ID YourUsername
```

### 3. Indítsd el

```bash
cd ~/tgf-app
./start.sh
```

### 4. Nyisd meg a böngészőben

- **Weboldal:** http://localhost:5173
- **Admin panel:** http://localhost:5173/admin

## Hasznos parancsok

```bash
cd ~/tgf-app

./start.sh              # Indítás
./stop.sh               # Leállítás
./add-admin.sh ID Name  # Admin hozzáadása

# Logok
tail -f logs/backend.log
tail -f logs/frontend.log

# Adatbázis kapcsolat
psql -U tgf_user -d tgf_db
```

## Troubleshooting

### PostgreSQL nem indul

```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### Port már használatban

```bash
# Backend port (3001)
sudo lsof -i :3001
sudo kill -9 PID

# Frontend port (5173)
sudo lsof -i :5173
sudo kill -9 PID
```

### Adatbázis resetelése

```bash
cd ~/tgf-app/backend
npm run migrate
npm run seed
```

### Discord OAuth hiba

Ellenőrizd:
- Client ID és Secret helyes?
- Redirect URI: `http://localhost:3001/api/auth/callback`
- Discord Application engedélyei

## Producton deployment

### Nginx reverse proxy

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

### PM2 (process manager)

```bash
npm install -g pm2

cd ~/tgf-app

# Backend
pm2 start backend/dist/index.js --name tgf-backend

# Frontend
cd frontend
pm2 start "npx vite preview --port 5173" --name tgf-frontend

# Auto-restart on reboot
pm2 startup
pm2 save
```

## Rendszer követelmények

- **OS:** Debian 10+, Ubuntu 20.04+
- **RAM:** 2GB minimum, 4GB ajánlott
- **Disk:** 5GB szabad hely
- **CPU:** 2 core ajánlott
- **Network:** Internet kapcsolat a telepítéshez

## Biztonság

⚠️ **FONTOS production-ben:**

1. **Változtasd meg a jelszavakat!**
   - PostgreSQL password
   - JWT secret
   - Generálj új titkokat

2. **Használj HTTPS-t**
   - Let's Encrypt SSL
   - Nginx/Apache reverse proxy

3. **Firewall beállítások**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

4. **Rendszeres backup**
   ```bash
   pg_dump -U tgf_user tgf_db > backup.sql
   ```

## Support

Ha bármi probléma van:
1. Nézd meg a logokat: `tail -f ~/tgf-app/logs/*.log`
2. Ellenőrizd a CREDENTIALS.txt fájlt
3. Indítsd újra: `./stop.sh && ./start.sh`

## Licenc

MIT License
