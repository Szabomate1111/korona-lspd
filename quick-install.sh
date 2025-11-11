#!/bin/bash

#############################################
# TGF Quick Installer - Wrapper Script
# Downloads the full project and runs install
#############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════╗
║     TGF Quick Installer                        ║
║     Los Santos Police Department               ║
╚════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

REPO_URL="https://github.com/Szabomate1111/korona-lspd.git"
BRANCH="claude/tgf-system-design-011CV1pi8CdTVooPuS1BXAh6"
INSTALL_DIR="$HOME/tgf-app"
TEMP_DIR="/tmp/tgf-install-$$"

echo -e "${YELLOW}📥 Projekt letöltése...${NC}"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}Git telepítése...${NC}"
    sudo apt-get update -qq
    sudo apt-get install -y git > /dev/null 2>&1
fi

# Clone repository to temp directory
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

echo -e "${YELLOW}Klónozás GitHub-ról...${NC}"
git clone -b "$BRANCH" --single-branch "$REPO_URL" . > /dev/null 2>&1 || {
    echo -e "${RED}❌ Nem sikerült klónozni a repository-t${NC}"
    echo -e "${YELLOW}Fallback: Fájlok közvetlen letöltése...${NC}"

    # Fallback: Download files directly
    mkdir -p backend/src/{config,controllers,middleware,models,routes,services,types,utils}
    mkdir -p frontend/src/{components,pages,hooks,services,types,utils,styles}

    # This is a fallback - ideally files should be in git
    echo -e "${RED}⚠️  Figyelem: Git clone sikertelen. Manuális telepítés szükséges.${NC}"
    echo -e "${YELLOW}Kérlek töltsd le a projektet manuálisan:${NC}"
    echo -e "git clone -b $BRANCH $REPO_URL ~/tgf-app"
    echo -e "cd ~/tgf-app && ./install.sh"
    exit 1
}

echo -e "${GREEN}✓ Projekt letöltve${NC}"

# Make install script executable
chmod +x install.sh

# Export source directory for installer
export SOURCE_DIR="$TEMP_DIR"

# Run the main installer
echo -e "\n${YELLOW}🚀 Telepítés indítása...${NC}\n"
./install.sh

# Copy everything to final destination if not already there
if [ "$TEMP_DIR" != "$INSTALL_DIR" ]; then
    echo -e "\n${YELLOW}📦 Fájlok másolása végleges helyre...${NC}"
    mkdir -p "$INSTALL_DIR"
    cp -r "$TEMP_DIR"/* "$INSTALL_DIR/" 2>/dev/null || true
fi

# Cleanup temp directory
echo -e "${YELLOW}🧹 Ideiglenes fájlok törlése...${NC}"
cd "$HOME"
rm -rf "$TEMP_DIR"

echo -e "\n${GREEN}✨ Telepítés kész! ✨${NC}"
echo -e "\n${BLUE}Következő lépések:${NC}"
echo -e "1. ${GREEN}cd $INSTALL_DIR${NC}"
echo -e "2. ${GREEN}nano backend/.env${NC} ${YELLOW}(Discord OAuth beállítása)${NC}"
echo -e "3. ${GREEN}./add-admin.sh YOUR_DISCORD_ID YourUsername${NC}"
echo -e "4. ${GREEN}./start.sh${NC}"
echo -e "5. Nyisd meg: ${BLUE}http://localhost:5173${NC}"
