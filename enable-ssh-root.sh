#!/bin/bash

#############################################
# SSH Root Login Engedélyezése
# Enable SSH root login for Debian/Ubuntu
#############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 SSH Root Login Engedélyezése${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
   echo -e "${RED}❌ Ezt a scriptet root-ként kell futtatni!${NC}"
   echo -e "${YELLOW}Használat: su - majd ./enable-ssh-root.sh${NC}"
   exit 1
fi

# Install SSH server if not present
if ! command -v sshd &> /dev/null; then
    echo -e "${YELLOW}📦 OpenSSH szerver telepítése...${NC}"
    apt-get update -qq
    apt-get install -y openssh-server
    echo -e "${GREEN}✓ SSH szerver telepítve${NC}"
else
    echo -e "${GREEN}✓ SSH szerver már telepítve${NC}"
fi

# Backup original sshd_config
echo -e "${YELLOW}💾 SSH konfig backup...${NC}"
if [ ! -f /etc/ssh/sshd_config.backup ]; then
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    echo -e "${GREEN}✓ Backup: /etc/ssh/sshd_config.backup${NC}"
fi

# Enable root login
echo -e "${YELLOW}⚙️  Root login engedélyezése...${NC}"

# Check if PermitRootLogin exists
if grep -q "^PermitRootLogin" /etc/ssh/sshd_config; then
    # Replace existing line
    sed -i 's/^PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
else
    # Add new line
    echo "PermitRootLogin yes" >> /etc/ssh/sshd_config
fi

# Also enable password authentication if disabled
if grep -q "^PasswordAuthentication" /etc/ssh/sshd_config; then
    sed -i 's/^PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
else
    echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config
fi

echo -e "${GREEN}✓ SSH konfiguráció frissítve${NC}"

# Set root password if not set
echo -e "${YELLOW}🔑 Root jelszó ellenőrzése...${NC}"
if [ -z "$(passwd --status root | grep -o 'P')" ]; then
    echo -e "${YELLOW}Root jelszó nincs beállítva. Kérlek állítsd be:${NC}"
    passwd root
else
    echo -e "${GREEN}✓ Root jelszó már be van állítva${NC}"
fi

# Restart SSH service
echo -e "${YELLOW}🔄 SSH szolgáltatás újraindítása...${NC}"
systemctl restart sshd 2>/dev/null || systemctl restart ssh

echo -e "${GREEN}✓ SSH szolgáltatás újraindítva${NC}"

# Enable SSH on boot
systemctl enable ssh > /dev/null 2>&1 || systemctl enable sshd > /dev/null 2>&1

# Show SSH status
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ SSH Root Login engedélyezve!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Get IP address
IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${BLUE}📋 Kapcsolódási információk:${NC}"
echo -e "   ${GREEN}ssh root@$IP${NC}"
echo -e "   vagy"
echo -e "   ${GREEN}ssh root@$(hostname)${NC}"
echo ""
echo -e "${YELLOW}⚠️  Biztonsági figyelmeztetés:${NC}"
echo -e "   - Root SSH login biztonsági kockázat!"
echo -e "   - Használj erős jelszót"
echo -e "   - Fontold meg SSH kulcs használatát"
echo -e "   - Változtasd meg az SSH portot (22 helyett más)"
echo ""
echo -e "${BLUE}💡 SSH kulcs telepítése (ajánlott):${NC}"
echo -e "   1. Lokális gépen: ${GREEN}ssh-keygen${NC}"
echo -e "   2. Kulcs másolása: ${GREEN}ssh-copy-id root@$IP${NC}"
echo -e "   3. Jelszavas belépés tiltása később"
echo ""
