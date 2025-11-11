#!/bin/bash

#############################################
# TGF Development Mode Starter
# Runs backend and frontend in dev mode
#############################################

cd "$(dirname "$0")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 TGF Development Mode${NC}"
echo ""

# Check if .env files exist
if [ ! -f backend/.env ]; then
    echo -e "${RED}❌ Backend .env nem található!${NC}"
    echo -e "${YELLOW}Futtasd először: ./install.sh${NC}"
    exit 1
fi

if [ ! -f frontend/.env ]; then
    echo -e "${RED}❌ Frontend .env nem található!${NC}"
    echo -e "${YELLOW}Futtasd először: ./install.sh${NC}"
    exit 1
fi

# Check if node_modules exist
if [ ! -d backend/node_modules ]; then
    echo -e "${YELLOW}📦 Backend dependencies telepítése...${NC}"
    cd backend && npm install && cd ..
fi

if [ ! -d frontend/node_modules ]; then
    echo -e "${YELLOW}📦 Frontend dependencies telepítése...${NC}"
    cd frontend && npm install && cd ..
fi

# Create logs directory
mkdir -p logs

echo -e "${GREEN}✓ Környezet rendben${NC}"
echo ""

# Kill existing processes
pkill -f "tsx.*backend" 2>/dev/null || true
pkill -f "vite.*frontend" 2>/dev/null || true

# Start backend in background
echo -e "${YELLOW}🚀 Backend indítása (dev mode)...${NC}"
cd backend
npm run dev > ../logs/backend-dev.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../.backend-dev.pid
cd ..
echo -e "${GREEN}✓ Backend elindítva (PID: $BACKEND_PID)${NC}"

# Wait a bit for backend to start
sleep 2

# Start frontend in background
echo -e "${YELLOW}🚀 Frontend indítása (dev mode)...${NC}"
cd frontend
npm run dev > ../logs/frontend-dev.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../.frontend-dev.pid
cd ..
echo -e "${GREEN}✓ Frontend elindítva (PID: $FRONTEND_PID)${NC}"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Development mode fut!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🌐 Frontend:${NC} http://localhost:5173"
echo -e "${BLUE}🔧 Backend:${NC}  http://localhost:3001"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}💡 Logok:${NC}"
echo -e "   tail -f logs/backend-dev.log"
echo -e "   tail -f logs/frontend-dev.log"
echo ""
echo -e "${YELLOW}🛑 Leállítás:${NC}"
echo -e "   kill $BACKEND_PID $FRONTEND_PID"
echo -e "   vagy Ctrl+C majd pkill -f 'tsx.*backend' && pkill -f 'vite.*frontend'"
echo ""
