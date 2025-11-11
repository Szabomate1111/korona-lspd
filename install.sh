#!/bin/bash

#############################################
# TGF Automated Installer for Debian/Ubuntu
# Curl-friendly one-liner install script
#############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
# Allow override of INSTALL_DIR from command line
: ${INSTALL_DIR:="$HOME/tgf-app"}
DB_NAME="tgf_db"
DB_USER="tgf_user"
DB_PASSWORD="tgf_pass_$(openssl rand -hex 8)"
POSTGRES_PASSWORD="postgres_$(openssl rand -hex 8)"
JWT_SECRET="jwt_secret_$(openssl rand -hex 32)"
DEFAULT_ADMIN_DISCORD_ID="678640147503513600"  # Mate Discord ID
DEFAULT_ADMIN_USERNAME="mate"
DEFAULT_ADMIN_PASSWORD="mate1234"

# Discord placeholders (user needs to set these)
DISCORD_CLIENT_ID="your_discord_client_id_here"
DISCORD_CLIENT_SECRET="your_discord_client_secret_here"

echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════╗
║     TGF Application Installer v1.0             ║
║     Los Santos Police Department               ║
╚════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
   echo -e "${RED}❌ Ezt a scriptet root-ként kell futtatni!${NC}"
   echo -e "${YELLOW}Használat:${NC}"
   echo -e "  ${GREEN}su -${NC}         # root shell-be lépés (Debian)"
   echo -e "  ${GREEN}./install.sh${NC}  # script futtatása"
   echo -e ""
   echo -e "${YELLOW}Vagy ha van sudo:${NC}"
   echo -e "  ${GREEN}sudo ./install.sh${NC}"
   exit 1
fi

echo -e "${GREEN}✓ Root jogosultság rendben${NC}"

# Update system
echo -e "\n${YELLOW}📦 Rendszer frissítése...${NC}"
apt-get update -qq

# Install dependencies
echo -e "${YELLOW}📦 Alapvető csomagok telepítése...${NC}"
apt-get install -y curl wget git build-essential openssl postgresql postgresql-contrib > /dev/null 2>&1
echo -e "${GREEN}✓ Alapvető csomagok telepítve${NC}"

# Install Node.js (via NodeSource)
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Node.js telepítése...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs > /dev/null 2>&1
    echo -e "${GREEN}✓ Node.js $(node -v) telepítve${NC}"
else
    echo -e "${GREEN}✓ Node.js már telepítve: $(node -v)${NC}"
fi

# Setup PostgreSQL
echo -e "\n${YELLOW}🐘 PostgreSQL beállítása...${NC}"

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql > /dev/null 2>&1

# Set postgres user password
su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD '$POSTGRES_PASSWORD';\"" > /dev/null 2>&1

# Create database user
su - postgres -c "psql -c \"DROP USER IF EXISTS $DB_USER;\"" > /dev/null 2>&1
su - postgres -c "psql -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';\"" > /dev/null 2>&1

# Create database
su - postgres -c "psql -c \"DROP DATABASE IF EXISTS $DB_NAME;\"" > /dev/null 2>&1
su - postgres -c "psql -c \"CREATE DATABASE $DB_NAME OWNER $DB_USER;\"" > /dev/null 2>&1

echo -e "${GREEN}✓ PostgreSQL beállítva${NC}"
echo -e "  Database: $DB_NAME"
echo -e "  User: $DB_USER"

# Determine script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create installation directory
echo -e "\n${YELLOW}📁 Projekt mappa előkészítése...${NC}"

# Check if running from project directory with all files
if [ -f "$SCRIPT_DIR/backend/package.json" ] && [ -f "$SCRIPT_DIR/frontend/package.json" ]; then
    INSTALL_DIR="$SCRIPT_DIR"
    echo -e "${GREEN}✓ Projekt fájlok már a helyükön: $INSTALL_DIR${NC}"
else
    # Need to copy files to install directory
    mkdir -p "$INSTALL_DIR"

    if [ -n "$SOURCE_DIR" ] && [ -d "$SOURCE_DIR/backend" ]; then
        echo -e "${YELLOW}📥 Projekt fájlok másolása...${NC}"
        cp -r "$SOURCE_DIR"/* "$INSTALL_DIR/"
        echo -e "${GREEN}✓ Fájlok másolva${NC}"
    elif [ -f "$SCRIPT_DIR/backend/package.json" ]; then
        echo -e "${YELLOW}📥 Fájlok másolása telepítési mappába...${NC}"
        cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR/"
        echo -e "${GREEN}✓ Fájlok másolva${NC}"
    else
        echo -e "${RED}❌ Projekt fájlok nem találhatók!${NC}"
        echo -e "${YELLOW}Használd a quick-install.sh szkriptet vagy klónozd a repository-t.${NC}"
        exit 1
    fi
fi

cd "$INSTALL_DIR"

# Install backend dependencies
echo -e "\n${YELLOW}📦 Backend függőségek telepítése...${NC}"
cd "$INSTALL_DIR/backend"
npm install --silent > /dev/null 2>&1
echo -e "${GREEN}✓ Backend függőségek telepítve${NC}"

# Create backend .env
echo -e "${YELLOW}⚙️  Backend konfiguráció létrehozása...${NC}"
cat > .env << EOF
# Server
PORT=3001
NODE_ENV=production

# Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# Discord OAuth (FONTOS: Cseréld ki a saját értékeiddel!)
DISCORD_CLIENT_ID=$DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET=$DISCORD_CLIENT_SECRET
DISCORD_REDIRECT_URI=http://localhost:3001/api/auth/callback

# JWT
JWT_SECRET=$JWT_SECRET

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# Paste Detection Settings
SUSPICION_THRESHOLD=50
SIMILARITY_THRESHOLD=0.65
PASTE_EVENT_WEIGHT=40
SIMILARITY_WEIGHT=30
TIME_TO_EDIT_WEIGHT=20
MULTI_FIELD_BONUS=10
MIN_TIME_TO_EDIT=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=5
EOF

echo -e "${GREEN}✓ Backend .env létrehozva${NC}"

# Build backend
echo -e "${YELLOW}🔨 Backend build...${NC}"
npm run build > /dev/null 2>&1
echo -e "${GREEN}✓ Backend build kész${NC}"

# Run migrations
echo -e "${YELLOW}🗄️  Adatbázis migrációk futtatása...${NC}"
node dist/utils/migrate.js
echo -e "${GREEN}✓ Migrációk lefutottak${NC}"

# Run seed
echo -e "${YELLOW}🌱 Kezdeti adatok betöltése...${NC}"
DEFAULT_ADMIN_PASSWORD="$DEFAULT_ADMIN_PASSWORD" \
DEFAULT_ADMIN_DISCORD_ID="$DEFAULT_ADMIN_DISCORD_ID" \
DEFAULT_ADMIN_USERNAME="$DEFAULT_ADMIN_USERNAME" \
node dist/utils/seed.js
echo -e "${GREEN}✓ Kezdeti adatok betöltve${NC}"

# Install frontend dependencies
echo -e "\n${YELLOW}📦 Frontend függőségek telepítése...${NC}"
cd "$INSTALL_DIR/frontend"
npm install --silent > /dev/null 2>&1
echo -e "${GREEN}✓ Frontend függőségek telepítve${NC}"

# Create frontend .env
echo -e "${YELLOW}⚙️  Frontend konfiguráció létrehozása...${NC}"
cat > .env << EOF
VITE_API_URL=http://localhost:3001/api
VITE_FRONTEND_URL=http://localhost:5173
EOF

echo -e "${GREEN}✓ Frontend .env létrehozva${NC}"

# Build frontend
echo -e "${YELLOW}🔨 Frontend build...${NC}"
npm run build > /dev/null 2>&1
echo -e "${GREEN}✓ Frontend build kész${NC}"

# Create start.sh script
echo -e "\n${YELLOW}📝 Start script létrehozása...${NC}"
cat > "$INSTALL_DIR/start.sh" << 'STARTEOF'
#!/bin/bash

cd "$(dirname "$0")"

echo "🚀 TGF Application indítása..."

# Check if already running
if [ -f backend/.backend.pid ] && kill -0 $(cat backend/.backend.pid) 2>/dev/null; then
    echo "⚠️  Backend már fut!"
else
    echo "Starting backend..."
    cd backend
    NODE_ENV=production node dist/index.js > ../logs/backend.log 2>&1 &
    echo $! > .backend.pid
    cd ..
    echo "✓ Backend elindítva (PID: $(cat backend/.backend.pid))"
fi

if [ -f frontend/.frontend.pid ] && kill -0 $(cat frontend/.frontend.pid) 2>/dev/null; then
    echo "⚠️  Frontend már fut!"
else
    echo "Starting frontend..."
    cd frontend
    npx vite preview --port 5173 --host > ../logs/frontend.log 2>&1 &
    echo $! > .frontend.pid
    cd ..
    echo "✓ Frontend elindítva (PID: $(cat frontend/.frontend.pid))"
fi

echo ""
echo "✅ TGF Application fut!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Weboldal: http://localhost:5173"
echo "🔧 API:      http://localhost:3001"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Admin bejelentkezés:"
echo "   1. Menj ide: http://localhost:5173/admin"
echo "   2. Discord OAuth bejelentkezés"
echo "   3. Add hozzá magad admin-ként:"
echo "      - Discord Developer Portal > User Settings > Advanced"
echo "      - Developer Mode bekapcsolása"
echo "      - Jobb klikk profilra > Copy User ID"
echo ""
echo "💡 Logok: tail -f logs/backend.log vagy logs/frontend.log"
echo "🛑 Leállítás: ./stop.sh"
STARTEOF

chmod +x "$INSTALL_DIR/start.sh"

# Create stop.sh script
echo -e "${YELLOW}📝 Stop script létrehozása...${NC}"
cat > "$INSTALL_DIR/stop.sh" << 'STOPEOF'
#!/bin/bash

cd "$(dirname "$0")"

echo "🛑 TGF Application leállítása..."

if [ -f backend/.backend.pid ]; then
    PID=$(cat backend/.backend.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "✓ Backend leállítva (PID: $PID)"
    fi
    rm backend/.backend.pid
fi

if [ -f frontend/.frontend.pid ]; then
    PID=$(cat frontend/.frontend.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "✓ Frontend leállítva (PID: $PID)"
    fi
    rm frontend/.frontend.pid
fi

echo "✅ TGF Application leállítva"
STOPEOF

chmod +x "$INSTALL_DIR/stop.sh"

# Create logs directory
mkdir -p "$INSTALL_DIR/logs"

# Create credentials file
echo -e "\n${YELLOW}📝 Credentials fájl létrehozása...${NC}"
cat > "$INSTALL_DIR/CREDENTIALS.txt" << EOF
═══════════════════════════════════════════════
    TGF Application - Bejelentkezési Adatok
═══════════════════════════════════════════════

📁 Telepítési mappa: $INSTALL_DIR

🗄️  PostgreSQL:
   Host:     localhost
   Port:     5432
   Database: $DB_NAME
   User:     $DB_USER
   Password: $DB_PASSWORD

   Postgres admin:
   User:     postgres
   Password: $POSTGRES_PASSWORD

🔐 JWT Secret:
   $JWT_SECRET

🎮 Discord OAuth (ÍRD ÁT!):
   Client ID:     $DISCORD_CLIENT_ID
   Client Secret: $DISCORD_CLIENT_SECRET

   ⚠️  FONTOS: Cseréld ki ezeket a Discord Developer Portal-on!
   1. Menj ide: https://discord.com/developers/applications
   2. Hozz létre új Application-t
   3. OAuth2 > Add redirect: http://localhost:3001/api/auth/callback
   4. Másold ki Client ID-t és Client Secret-et
   5. Írd be őket: $INSTALL_DIR/backend/.env fájlba

👤 Admin hozzáadása:
   Módszer 1 - SQL-lel:
   psql -U $DB_USER -d $DB_NAME -c "INSERT INTO users (discord_id, username, role) VALUES ('YOUR_DISCORD_ID', 'YourName', 'owner');"

   Módszer 2 - Discord ID megszerzése:
   1. Discord > Settings > Advanced > Developer Mode (bekapcs)
   2. Jobb klikk profilodra > Copy User ID
   3. Futtasd: ./add-admin.sh YOUR_DISCORD_ID YourUsername

📝 Fájlok:
   Backend config:  $INSTALL_DIR/backend/.env
   Frontend config: $INSTALL_DIR/frontend/.env
   Start:           $INSTALL_DIR/start.sh
   Stop:            $INSTALL_DIR/stop.sh
   Logok:           $INSTALL_DIR/logs/

═══════════════════════════════════════════════
EOF

# Create add-admin helper script
cat > "$INSTALL_DIR/add-admin.sh" << 'ADMINEOF'
#!/bin/bash

if [ "$#" -lt 2 ]; then
    echo "Használat: ./add-admin.sh DISCORD_ID USERNAME [role]"
    echo "Példa: ./add-admin.sh 123456789012345678 Mate owner"
    exit 1
fi

DISCORD_ID=$1
USERNAME=$2
ROLE=${3:-owner}

cd "$(dirname "$0")"
source backend/.env

PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c \
    "INSERT INTO users (discord_id, username, role) VALUES ('$DISCORD_ID', '$USERNAME', '$ROLE') ON CONFLICT (discord_id) DO UPDATE SET username = '$USERNAME', role = '$ROLE';"

echo "✅ Admin hozzáadva: $USERNAME (Discord ID: $DISCORD_ID, Role: $ROLE)"
ADMINEOF

chmod +x "$INSTALL_DIR/add-admin.sh"

# Final success message
echo -e "\n${GREEN}"
cat << "EOF"
╔════════════════════════════════════════════════╗
║     ✅ Telepítés sikeres! ✅                    ║
╚════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📁 Telepítési mappa:${NC} $INSTALL_DIR"
echo -e "${GREEN}🌐 Weboldal:${NC} http://localhost:5173"
echo -e "${GREEN}🔧 API:${NC} http://localhost:3001"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}📋 Következő lépések:${NC}"
echo -e "1. ${GREEN}Állítsd be a Discord OAuth-ot:${NC}"
echo -e "   - Szerkeszd: ${BLUE}$INSTALL_DIR/backend/.env${NC}"
echo -e "   - DISCORD_CLIENT_ID és DISCORD_CLIENT_SECRET"
echo -e "   - Részletek: ${BLUE}$INSTALL_DIR/CREDENTIALS.txt${NC}"
echo ""
echo -e "2. ${GREEN}Add hozzá magad admin-ként:${NC}"
echo -e "   ${BLUE}cd $INSTALL_DIR${NC}"
echo -e "   ${BLUE}./add-admin.sh YOUR_DISCORD_ID YourUsername${NC}"
echo ""
echo -e "3. ${GREEN}Indítsd el az alkalmazást:${NC}"
echo -e "   ${BLUE}cd $INSTALL_DIR${NC}"
echo -e "   ${BLUE}./start.sh${NC}"
echo ""
echo -e "4. ${GREEN}Látogass el:${NC} ${BLUE}http://localhost:5173/admin${NC}"
echo ""

echo -e "${YELLOW}💡 Hasznos parancsok:${NC}"
echo -e "   ${BLUE}./start.sh${NC}        - Alkalmazás indítása"
echo -e "   ${BLUE}./stop.sh${NC}         - Alkalmazás leállítása"
echo -e "   ${BLUE}./add-admin.sh${NC}    - Admin hozzáadása"
echo -e "   ${BLUE}tail -f logs/*.log${NC} - Logok megtekintése"
echo ""

echo -e "${GREEN}✨ Sikeres telepítés! Jó szórakozást! ✨${NC}"
